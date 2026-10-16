// The simulator of THUMDER: assembles the program, loads it in memory and runs it in the pipeline, answering the same
// requests (and with the same types) as THUMDER-server, so the views do not care where it runs.
import type {
  TypeArrowCycle,
  TypeConfigurationMachine,
  TypeCycleCell,
  TypeCycleCellUnit,
  TypeData,
  TypeDataStatistics,
  TypeErrorInCode,
  TypeInstructionsData,
  TypeMemoryToUpdate,
  TypeMemoryToUpdateResponse,
  TypeRegisterToUpdate,
  TypeRegisterToUpdateResponse,
  TypeSimulationInitRequest,
  TypeSimulationInitResponse,
  TypeSimulationStep,
} from "@app/Types";
import { type AssemblyResult, assemble, globalNames, type SourceFile } from "@core/engine/assembler";
import { DEFAULT_MACHINE_CONFIG, type MachineConfig, SimulationError } from "@core/engine/cpu";
import { type Cell, type CycleReport, type FloatingUnit, Pipeline, type StallLabel, type Statistics } from "@core/engine/pipeline";
import type { ProgramIO } from "@core/engine/traps";

/** Why an instruction (the row of the diagram) is stalled in a cycle: pipeline.ts, StallReason */
export type StallInfo = {
  row: number;
  cycle: number;
  label: StallLabel;
  kind: "raw" | "waw" | "structural" | "mem" | "trap" | "input" | "blocked" | "aborted";
  /** The row of the instruction that causes it */
  cause?: number;
  register?: string;
  forwardingHelps?: boolean;
};

/** Why a run stopped at a breakpoint: its line (IF or another stage), or a read or a write of a watched address */
export type BreakpointHit = { kind: "line"; line: number; stage: BreakpointStage } | { kind: "read" | "write"; address: number };

/** The stages a breakpoint of a line can wait for (WinDLX): IF is when the instruction is fetched */
export type BreakpointStage = "IF" | "ID" | "EX" | "MEM" | "WB";

/** Extra fields of a step of the local simulator: the console of the program and the errors */
export type SimulationStepExtra = {
  /** What the program wrote in this cycle */
  output?: string;
  /** The program waits for a line of input (trap 3): send it with SimulationInputRequest */
  waitingForInput?: boolean;
  /** An error of the program (bad address, division by zero...): the simulation has stopped */
  error?: string;
  /** Why each stalled instruction is stalled (EDU-01) */
  stalls?: StallInfo[];
  /** What the loads read in this cycle */
  reads?: { address: number; bytes: number }[];
  /** The breakpoint it stopped at (the runner) */
  hit?: BreakpointHit;
};

export type LocalSimulationStep = TypeSimulationStep & SimulationStepExtra;

/**
 * The other files of the program (modules with .global symbols), besides the one being simulated. With `modules` they
 * are the ones chosen (NUC-10, «Load Code or Data» of WinDLX); without it, those that define the missing symbols
 */
export type LocalSimulationInitRequest = TypeSimulationInitRequest & { files?: SourceFile[]; modules?: string[] };

/** A label of the program, for the window of the symbols */
export type SymbolInfo = { name: string; address: string; file: string; global: boolean };

export type LocalSimulationInitResponse = TypeSimulationInitResponse & { symbols: SymbolInfo[]; modules: string[] };

/** The end of a run with a configuration (EDU-02) */
export type RunSummary = {
  stoppedBy: "complete" | "input" | "error" | "limit";
  error?: string;
  cycles: number;
  instructions: number;
  cpi: number;
  rawStalls: number;
  wawStalls: number;
  structuralStalls: number;
  controlStalls: number;
  totalStalls: number;
};

export type CompareRequest = { init: LocalSimulationInitRequest; configuration: TypeConfigurationMachine; maxCycles?: number };
export type CompareResponse = { withForwarding: RunSummary; withoutForwarding: RunSummary };

// The severities of the editor (EnumSeverity of @app/Types): only types are imported here, so this code runs in a Web
// Worker without the rest of the application
const SEVERITY_ERROR = 8;
const SEVERITY_WARNING = 4;

const hex = (value: number, digits = 8) => `0x${(value >>> 0).toString(16).toUpperCase().padStart(digits, "0")}`;
const address = (value: number) => hex(value) as `0x${string}`;

const FORWARDING_COLOR = 0x00aa00;
const STALL_COLOR = 0xff0000;

export class DLXSimulator {
  private config: MachineConfig = { ...DEFAULT_MACHINE_CONFIG };
  /** The files of the program: the main one and the modules it needs */
  private files: SourceFile[] = [];
  /** The files that can be modules of the program (the others of its folder) */
  private candidates: SourceFile[] = [];
  private main = "";
  private program: AssemblyResult | null = null;
  private pipeline: Pipeline | null = null;
  private lines = new Map<number, number>();
  private input: string[] = [];
  private finished = false;

  private readonly io: ProgramIO = {
    write: () => undefined,
    readLine: () => this.input.shift() ?? null,
  };

  /** Answers a request of the protocol (payload and answer as JSON strings): docs/simulador.md, «El protocolo del Worker» */
  public handle(event: string, payload: string): string {
    const data = payload === "" ? {} : JSON.parse(payload);
    switch (event) {
      case "SimulationInitRequest":
        return JSON.stringify(this.init(data as LocalSimulationInitRequest));
      case "SimulationNextStepRequest":
        return JSON.stringify(this.step());
      case "UpdateConfigurationMachineRequest":
        return JSON.stringify(this.configure(data as TypeConfigurationMachine));
      case "UpdateRegisterRequest":
        return JSON.stringify(this.updateRegisters(data as TypeRegisterToUpdate[]));
      case "UpdateMemoryRequest":
        return JSON.stringify(this.updateMemory(data as TypeMemoryToUpdate[]));
      case "SimulationInputRequest":
        this.provideInput((data as { text: string }).text ?? "");
        return JSON.stringify({ allOK: true });
      case "CompareForwardingRequest":
        return JSON.stringify(compareForwarding(data as CompareRequest));
      default:
        throw new Error(`Unknown request ${event}`);
    }
  }

  public init(request: LocalSimulationInitRequest): LocalSimulationInitResponse {
    this.main = request.filename || "main.s";
    this.files = [{ name: this.main, content: request.content }];
    this.candidates = (request.files ?? []).filter((file) => file.name !== this.main);
    // The modules chosen by the user, in their order (the ones that do not exist any more are left out)
    if (request.modules !== undefined) {
      this.files.push(...request.modules.flatMap((name) => this.candidates.filter((file) => file.name === name)));
    }
    let program = this.load();
    // Like loading several files in WinDLX: the files that make global the symbols that are missing
    for (; request.modules === undefined; ) {
      const missing = new Set(
        program.messages.map((message) => /^Undefined symbol: (.+)$/.exec(message.message)?.[1]).filter((name) => name !== undefined),
      );
      const modules = this.candidates.filter(
        (file) => !this.files.includes(file) && globalNames(file.content).some((name) => missing.has(name)),
      );
      if (modules.length === 0) break;
      this.files.push(...modules);
      program = this.load();
    }
    const errors: TypeErrorInCode[] = program.messages.map((message) => ({
      line: message.file === this.main ? message.line : 1,
      message: message.file === this.main ? message.message : `${message.file}:${message.line}: ${message.message}`,
      severity: message.severity === "error" ? SEVERITY_ERROR : SEVERITY_WARNING,
    }));
    const machineInstructions: TypeInstructionsData[] = program.instructions.map((instruction) => ({
      address: address(instruction.address),
      code: hex(instruction.word),
      text: instruction.labels.join(", "),
      instruction: instruction.source,
    }));
    // The data of the directives, as words
    const view = new DataView(program.memory.buffer);
    const memory: TypeMemoryToUpdate[] = program.dataAddresses.map((word) => ({
      typeData: "Word",
      address: address(word),
      value: hex(view.getUint32(word)),
    }));
    return {
      id: request.id,
      filename: this.main,
      date: request.date,
      lines: request.content.split("\n").length,
      canSimulate: program.ok,
      errors,
      symbols: program.symbolTable.map((symbol) => ({
        name: symbol.name,
        address: hex(symbol.value),
        file: symbol.file,
        global: symbol.global,
      })),
      modules: this.files.slice(1).map((file) => file.name),
      machineDirectives: [],
      machineInstructions,
      runner: [
        {
          step: -1,
          line: 0,
          isNewInstruction: false,
          isComplete: false,
          pipeline: this.emptyPipeline(),
          registers: [{ typeRegister: "Control", register: "PC", hexadecimalValue: hex(program.entry) }],
          memory,
          statistics: {},
        },
      ],
    };
  }

  /** WinDLX: changing the configuration resets the processor (the program stays loaded) */
  public configure(configuration: TypeConfigurationMachine): TypeConfigurationMachine {
    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Math.trunc(Number(value)) || min));
    this.config = {
      memorySize: clamp(configuration.memorySize, 0x200, 0x1000000),
      forwarding: configuration.enabledForwarding !== false,
      fadd: { count: clamp(configuration.addition.count, 1, 8), delay: clamp(configuration.addition.delay, 1, 50) },
      fmul: { count: clamp(configuration.multiplication.count, 1, 8), delay: clamp(configuration.multiplication.delay, 1, 50) },
      fdiv: { count: clamp(configuration.division.count, 1, 8), delay: clamp(configuration.division.delay, 1, 50) },
    };
    if (this.files.length > 0) this.load();
    return configuration;
  }

  /** How many cycles have run since the program was loaded */
  public get cycles(): number {
    return this.pipeline ? this.pipeline.cycle + 1 : 0;
  }

  /** The line of the main file of the instruction at an address (0 if it is not there) */
  public lineOf(at: number): number {
    return this.lines.get(at) ?? 0;
  }

  public get pipelineStats(): Statistics | null {
    return this.pipeline?.stats ?? null;
  }

  public provideInput(text: string): void {
    this.input.push(text.endsWith("\n") ? text : `${text}\n`);
  }

  public step(): LocalSimulationStep {
    const pipeline = this.pipeline;
    if (pipeline === null || this.finished) {
      return { ...this.emptyStep(pipeline?.cycle ?? 0), isComplete: true };
    }
    const report = pipeline.tick();
    if (report.halted || report.error) this.finished = true;
    return this.toStep(report, pipeline);
  }

  public updateRegisters(registers: TypeRegisterToUpdate[]): TypeRegisterToUpdateResponse {
    const pipeline = this.pipeline;
    const response: TypeRegisterToUpdateResponse = { allOK: pipeline !== null, registerToUpdates: [] };
    if (pipeline === null) return response;
    for (const { typeRegister, register, hexadecimalValue } of registers) {
      const name = String(register).toUpperCase();
      const number = Number(name.replace(/\D/g, ""));
      const value = BigInt(`0x${hexadecimalValue.replace(/^0x/i, "") || "0"}`);
      const word = Number(value & 0xffffffffn);
      if (typeRegister === "Integer" && number > 0 && number < 32) {
        pipeline.registers.setR(number, word | 0);
        response.registerToUpdates.push({ typeRegister, register: `R${number}`, hexadecimalValue: hex(pipeline.registers.R[number]) });
      } else if (typeRegister === "Float" && number >= 0 && number < 32) {
        pipeline.registers.F[number] = word;
        response.registerToUpdates.push({ typeRegister, register: `F${number}`, hexadecimalValue: hex(word) });
      } else if (typeRegister === "Double" && number >= 0 && number < 31 && number % 2 === 0) {
        pipeline.registers.F[number] = Number(value >> 32n);
        pipeline.registers.F[number + 1] = word;
        response.registerToUpdates.push({
          typeRegister,
          register: `F${number}`,
          hexadecimalValue: hex(Number(value >> 32n)) + hex(word).slice(2),
        });
      } else if (typeRegister === "Control" && name === "PC") {
        pipeline.nextPC = word;
        response.registerToUpdates.push({ typeRegister, register: "PC", hexadecimalValue: hex(word) });
      } else if (typeRegister === "Control" && name === "FPSR") {
        pipeline.registers.FPSR = word & 1;
        response.registerToUpdates.push({ typeRegister, register: "FPSR", hexadecimalValue: hex(word & 1) });
      } else {
        response.allOK = false;
      }
    }
    return response;
  }

  public updateMemory(changes: TypeMemoryToUpdate[]): TypeMemoryToUpdateResponse {
    const pipeline = this.pipeline;
    const response: TypeMemoryToUpdateResponse = { allOK: pipeline !== null, memoryToUpdates: [] };
    if (pipeline === null) return response;
    for (const change of changes) {
      try {
        const at = Number.parseInt(change.address, 16);
        const value = BigInt(`0x${change.value.replace(/^0x/i, "") || "0"}`);
        const memory = pipeline.memory;
        switch (change.typeData) {
          case "Byte":
            memory.writeU8(at, Number(value & 0xffn));
            break;
          case "HalfWord":
            memory.writeU16(at, Number(value & 0xffffn));
            break;
          case "Word":
          case "Float":
            memory.writeU32(at, Number(value & 0xffffffffn));
            break;
          case "Double":
            memory.check(at, 8);
            memory.writeU32(at, Number((value >> 32n) & 0xffffffffn));
            memory.writeU32(at + 4, Number(value & 0xffffffffn));
            break;
          default:
            throw new SimulationError(`Type ${change.typeData} cannot be written`);
        }
        response.memoryToUpdates.push(change);
      } catch {
        response.allOK = false;
      }
    }
    return response;
  }

  // ─── Internals ────────────────────────────────────────────────────────────────────────────────────────────────────

  /** Assembles the files and creates the machine with the program in memory */
  private load(): AssemblyResult {
    const program = assemble(this.files, { memorySize: this.config.memorySize, mainFile: this.main });
    this.program = program;
    this.lines = new Map(program.instructions.filter((i) => i.file === this.main).map((i) => [i.address, i.line]));
    this.input = [];
    this.finished = !program.ok;
    this.pipeline = program.ok ? new Pipeline(this.config, program.memory, program.entry, this.io) : null;
    return program;
  }

  private emptyPipeline(): TypeSimulationStep["pipeline"] {
    const empty: TypeCycleCell = { address: "" as `0x${string}`, addressRow: 0, draw: false };
    const units = (count: number) => Array.from({ length: count }, (_, unit) => ({ ...empty, unit }));
    return {
      IF: empty,
      ID: empty,
      intEX: empty,
      MEM: empty,
      WB: empty,
      faddEX: units(this.config.fadd.count),
      fmultEX: units(this.config.fmul.count),
      fdivEX: units(this.config.fdiv.count),
      arrows: [],
    };
  }

  private emptyStep(cycle: number): LocalSimulationStep {
    return { step: cycle, line: 0, isNewInstruction: false, pipeline: this.emptyPipeline(), registers: [], memory: [], statistics: {} };
  }

  private toStep(report: CycleReport, pipeline: Pipeline): LocalSimulationStep {
    const cell = (value: Cell | null): TypeCycleCell =>
      value === null
        ? { address: "" as `0x${string}`, addressRow: 0, draw: false }
        : { address: address(value.instance.pc), addressRow: value.instance.id, draw: value.label };
    const units = (unit: FloatingUnit): TypeCycleCellUnit[] => report.units[unit].map((value, index) => ({ ...cell(value), unit: index }));
    const arrows: TypeArrowCycle[] = report.arrows.map((arrow) => ({
      fromAddressRow: arrow.from.id,
      fromStep: arrow.fromCycle,
      toAddressRow: arrow.to.id,
      toStep: arrow.toCycle,
      color: arrow.kind === "forwarding" ? FORWARDING_COLOR : STALL_COLOR,
    }));
    const registers: TypeRegisterToUpdate[] = report.registers.map((change) => ({
      typeRegister: change.kind === "control" ? "Control" : change.kind === "int" ? "Integer" : "Float",
      register: change.name,
      hexadecimalValue: hex(change.value),
    }));
    const memory: TypeMemoryToUpdate[] = report.memory.map((change) => {
      const types: Record<number, TypeData> = { 1: "Byte", 2: "HalfWord", 4: change.floating ? "Float" : "Word", 8: "Double" };
      const value = change.bytes === 8 ? hex(change.words[0]) + hex(change.words[1]).slice(2) : hex(change.words[0], change.bytes * 2);
      return { typeData: types[change.bytes], address: address(change.address), value };
    });
    // The line in the editor: the instruction just fetched (or the newest one in the pipeline)
    const newest = [report.IF, report.ID, report.intEX, report.MEM, report.WB].find((value) => value !== null)?.instance;
    const shown = report.fetched ?? newest;
    return {
      step: report.cycle,
      line: shown ? (this.lines.get(shown.pc) ?? 0) : 0,
      isNewInstruction: report.fetched !== null,
      isComplete: report.halted || report.error !== undefined,
      pipeline: {
        IF: cell(report.IF),
        ID: cell(report.ID),
        intEX: cell(report.intEX),
        MEM: cell(report.MEM),
        WB: cell(report.WB),
        faddEX: units("fadd"),
        fmultEX: units("fmul"),
        fdivEX: units("fdiv"),
        arrows,
      },
      registers,
      memory,
      statistics: this.statistics(pipeline.stats),
      output: report.output || undefined,
      waitingForInput: report.waitingForInput || undefined,
      error: report.error,
      stalls: report.stalls.map((stall) => ({
        row: stall.instance.id,
        cycle: stall.cycle,
        label: stall.label,
        kind: stall.kind,
        cause: stall.cause?.id,
        register: stall.register,
        forwardingHelps: stall.forwardingHelps,
      })),
      reads: report.reads.length > 0 ? report.reads : undefined,
    };
  }

  private statistics(stats: Statistics): TypeDataStatistics {
    const percent = (part: number, total: number) => (total === 0 ? 0 : Math.round((part / total) * 10000) / 100);
    const of = (part: number, total: number) => ({ num: part, per: percent(part, total) });
    const totalStalls = stats.rawStalls + stats.wawStalls + stats.structuralStalls + stats.controlStalls + stats.trapStalls;
    const floating = stats.fadd + stats.fmul + stats.fdiv;
    const loadStore = stats.loads + stats.stores;
    return {
      TOTAL: {
        CYCLES_EXECUTED: { cycles: stats.cycles },
        ID_EXECUTED: { instructions: stats.instructions },
        INSTRUCTIONS_IN_PIPELINE: { instructions_in_pipeline: stats.inPipeline },
      },
      HARDWARE: {
        MEMORY_SIZE: { size: this.config.memorySize },
        FADD_EX_STAGES: { num: this.config.fadd.count, cycles: this.config.fadd.delay },
        FMULT_EX_STAGES: { num: this.config.fmul.count, cycles: this.config.fmul.delay },
        FDIV_EX_STAGES: { num: this.config.fdiv.count, cycles: this.config.fdiv.delay },
        FORWARDING: { enabled: this.config.forwarding },
      },
      STALLS: {
        RAW_STALLS: of(stats.rawStalls, stats.cycles),
        LD_STALLS: of(stats.loadStalls, stats.rawStalls),
        BRANCH_STALLS: of(stats.branchStalls, stats.rawStalls),
        FLOATING_POINT_STALLS: of(stats.floatingStalls, stats.rawStalls),
        WAW_STALLS: of(stats.wawStalls, stats.cycles),
        STRUCTURAL_STALLS: of(stats.structuralStalls, stats.cycles),
        CONTROL_STALLS: of(stats.controlStalls, stats.cycles),
        TRAP_STALLS: of(stats.trapStalls, stats.cycles),
        TOTAL: of(totalStalls, stats.cycles),
      },
      CONDITIONAL: {
        TOTAL: of(stats.branches, stats.instructions),
        TAKEN: of(stats.taken, stats.branches),
        NOT_TAKEN: of(stats.branches - stats.taken, stats.branches),
      },
      LOAD_STORE: {
        TOTAL: of(loadStore, stats.instructions),
        LOADS: of(stats.loads, loadStore),
        STORES: of(stats.stores, loadStore),
      },
      FLOATING: {
        TOTAL: of(floating, stats.instructions),
        ADDITIONS: of(stats.fadd, floating),
        MULTIPLICATIONS: of(stats.fmul, floating),
        DIVISIONS: of(stats.fdiv, floating),
      },
      TRAPS: { TOTAL: of(stats.traps, stats.instructions) },
    };
  }
}

/** Runs a program to its end (or to `maxCycles`) with a configuration, and sums it up */
export function runToEnd(init: LocalSimulationInitRequest, configuration: TypeConfigurationMachine, maxCycles = 1_000_000): RunSummary {
  const simulator = new DLXSimulator();
  simulator.configure(configuration);
  const loaded = simulator.init(init);
  let stoppedBy: RunSummary["stoppedBy"] = "limit";
  let error: string | undefined;
  if (!loaded.canSimulate) {
    stoppedBy = "error";
    error = loaded.errors.find((message) => message.severity === SEVERITY_ERROR)?.message;
  } else {
    while (simulator.cycles < maxCycles) {
      const step = simulator.step();
      if (step.error) {
        stoppedBy = "error";
        error = step.error;
        break;
      }
      if (step.isComplete) {
        stoppedBy = "complete";
        break;
      }
      if (step.waitingForInput) {
        stoppedBy = "input";
        break;
      }
    }
  }
  const stats = simulator.pipelineStats;
  const totalStalls = stats ? stats.rawStalls + stats.wawStalls + stats.structuralStalls + stats.controlStalls + stats.trapStalls : 0;
  return {
    stoppedBy,
    error,
    cycles: stats?.cycles ?? 0,
    instructions: stats?.instructions ?? 0,
    cpi: stats && stats.instructions > 0 ? Math.round((stats.cycles / stats.instructions) * 100) / 100 : 0,
    rawStalls: stats?.rawStalls ?? 0,
    wawStalls: stats?.wawStalls ?? 0,
    structuralStalls: stats?.structuralStalls ?? 0,
    controlStalls: stats?.controlStalls ?? 0,
    totalStalls,
  };
}

/** The same program with and without forwarding (EDU-02) */
export function compareForwarding({ init, configuration, maxCycles }: CompareRequest): CompareResponse {
  return {
    withForwarding: runToEnd(init, { ...configuration, enabledForwarding: true }, maxCycles),
    withoutForwarding: runToEnd(init, { ...configuration, enabledForwarding: false }, maxCycles),
  };
}
