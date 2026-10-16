// The pipeline of WinDLX, cycle by cycle (docs/manual-simulador-dlx.md, sections 2.4, 3 and 6):
//
// - IF, ID, intEX, MEM and WB, and the floating point units faddEX, fmultEX and fdivEX (1 to 8 units of each kind, each
//   one busy for its delay; MULT, MULTU, DIV and DIVU of integers also use them).
// - Branches and jumps are resolved in ID with predict-not-taken: a taken one aborts the instruction fetched after it.
// - WB writes in the first half of the cycle and ID reads in the second one.
// - With forwarding, a result can be used in the cycle after it is produced (the end of EX, of MEM for loads, of the last
//   cycle of a floating point unit); without it, the instruction waits in ID until the producer is in WB.
// - Stalls: R-Stall (read after write), W-Stall (an older instruction with the same destination is still in a unit),
//   S-Stall (no free floating point unit), Stall (a floating point instruction takes MEM first) and T-Stall (a trap
//   waits in IF until the pipeline is empty).
import {
  accessMemory,
  destination,
  type Execution,
  execute,
  type MachineConfig,
  Memory,
  type Operands,
  Registers,
  SimulationError,
  writeBack,
} from "@core/engine/cpu";
import { type Decoded, decode, type RegisterUse, registerUse, type Unit } from "@core/engine/isa";
import { type ProgramIO, runTrap } from "@core/engine/traps";

export type StallLabel = "R-Stall" | "W-Stall" | "S-Stall" | "T-Stall" | "Stall" | "Aborted";
export type FloatingUnit = Exclude<Unit, "int">;
export const FLOATING_UNITS: FloatingUnit[] = ["fadd", "fmul", "fdiv"];

export class Instance {
  public decoded: Decoded | null;
  public use: RegisterUse;
  public unit: Unit;
  public execution?: Execution;
  public result: Pick<Execution, "value" | "fpValue" | "fpsr"> = {};
  /** The cycle at the end of which its result exists (for forwarding) */
  public producedCycle = Number.POSITIVE_INFINITY;
  /** The last cycle in its execution unit */
  public exEnd = Number.POSITIVE_INFINITY;
  public unitIndex = -1;
  public squashed = false;
  /** Branches and jumps: resolved in ID */
  public resolved = false;
  /** The taken branch (or the trap 0) that aborted it */
  public squashedBy: Instance | null = null;
  public halts = false;
  /** The stall it is in now (to count each stall once and draw the arrow of its cause once) */
  public stall: StallLabel | null = null;

  constructor(
    public readonly id: number,
    public readonly pc: number,
    public readonly word: number,
  ) {
    this.decoded = decode(word);
    this.use = this.decoded
      ? registerUse(this.decoded)
      : { intReads: [], fpReads: [], intWrites: [], fpWrites: [], readsFPSR: false, writesFPSR: false };
    this.unit = this.decoded?.def.unit ?? "int";
  }

  get syntax() {
    return this.decoded?.def.syntax;
  }

  get isControl() {
    return this.syntax === "branch" || this.syntax === "fbranch" || this.syntax === "jump" || this.syntax === "jreg";
  }

  get isTrap() {
    return this.syntax === "trap";
  }

  get isLoad() {
    return this.syntax === "load" || this.syntax === "fload";
  }

  get isStore() {
    return this.syntax === "store" || this.syntax === "fstore";
  }

  /** Writes integer register `register` (R0 excluded), floating point register `register` or the FPSR */
  public writes(kind: "int" | "fp" | "fpsr", register = 0): boolean {
    if (kind === "int") return this.use.intWrites.includes(register);
    if (kind === "fp") return this.use.fpWrites.includes(register);
    return this.use.writesFPSR;
  }
}

export type Cell = { instance: Instance; label: true | StallLabel };

/**
 * Why an instruction is stalled in a cycle (EDU-01): read after write (the register and its producer, and whether
 * forwarding would have avoided it), write after write, no free unit, MEM taken by a floating point unit, a trap waiting
 * for the pipeline or for input, waiting behind another stalled instruction, or aborted by a taken branch
 */
export type StallReason = {
  instance: Instance;
  cycle: number;
  label: StallLabel;
  kind: "raw" | "waw" | "structural" | "mem" | "trap" | "input" | "blocked" | "aborted";
  cause?: Instance;
  /** The register of a read after write or a write after write: R3, F2, FPSR */
  register?: string;
  /** Read after write without forwarding: whether forwarding would have had the value ready */
  forwardingHelps?: boolean;
};

/** A read of the memory (a load in MEM), for the watchpoints */
export type MemoryRead = { address: number; bytes: 1 | 2 | 4 | 8 };

export type Arrow = { from: Instance; fromCycle: number; to: Instance; toCycle: number; kind: "forwarding" | "stall" };

export type RegisterChange = { kind: "control" | "int" | "fp"; name: string; value: number };

export type MemoryChange = { address: number; bytes: 1 | 2 | 4 | 8; floating: boolean; words: number[] };

export type CycleReport = {
  cycle: number;
  IF: Cell | null;
  ID: Cell | null;
  intEX: Cell | null;
  MEM: Cell | null;
  WB: Cell | null;
  units: Record<FloatingUnit, (Cell | null)[]>;
  /** The instruction fetched in this cycle */
  fetched: Instance | null;
  arrows: Arrow[];
  /** Why each stalled instruction is stalled in this cycle */
  stalls: StallReason[];
  /** What the loads read in MEM in this cycle */
  reads: MemoryRead[];
  registers: RegisterChange[];
  memory: MemoryChange[];
  output: string;
  waitingForInput: boolean;
  /** The program has ended (trap 0 in WB) */
  halted: boolean;
  error?: string;
};

export type Statistics = {
  cycles: number;
  instructions: number;
  inPipeline: number;
  rawStalls: number;
  loadStalls: number;
  branchStalls: number;
  floatingStalls: number;
  wawStalls: number;
  structuralStalls: number;
  controlStalls: number;
  trapStalls: number;
  branches: number;
  taken: number;
  loads: number;
  stores: number;
  fadd: number;
  fmul: number;
  fdiv: number;
  traps: number;
};

const CONTROL_REGISTERS = [
  "PC",
  "IMAR",
  "IR",
  "A",
  "AHI",
  "B",
  "BHI",
  "BTA",
  "ALU",
  "ALUHI",
  "FPSR",
  "DMAR",
  "SDR",
  "SDRHI",
  "LDR",
  "LDRHI",
];

// "blocked": waits behind another stalled instruction (that one counts the stall)
type Blocker = {
  label: StallLabel;
  cause?: Instance;
  kind: "raw" | "waw" | "structural" | "trap" | "input" | "blocked";
  register?: string;
  forwardingHelps?: boolean;
};

type Operand = { kind: "int" | "fp" | "fpsr"; register: number };

const registerName = ({ kind, register }: Operand) => (kind === "int" ? `R${register}` : kind === "fp" ? `F${register}` : "FPSR");

export class Pipeline {
  public readonly registers = new Registers();
  public readonly memory: Memory;
  /** The special registers of the stages (PC, IR, A, B, ALU, DMAR...) for the views */
  public readonly control = new Map<string, number>(CONTROL_REGISTERS.map((name) => [name, 0]));
  public cycle = -1;
  public complete = false;
  public readonly stats: Statistics = {
    cycles: 0,
    instructions: 0,
    inPipeline: 0,
    rawStalls: 0,
    loadStalls: 0,
    branchStalls: 0,
    floatingStalls: 0,
    wawStalls: 0,
    structuralStalls: 0,
    controlStalls: 0,
    trapStalls: 0,
    branches: 0,
    taken: 0,
    loads: 0,
    stores: 0,
    fadd: 0,
    fmul: 0,
    fdiv: 0,
    traps: 0,
  };

  private pc: number;
  private nextId = 0;
  private fetching = true;
  private IF: Instance | null = null;
  private ID: Instance | null = null;
  private EX: Instance | null = null;
  private MEM: Instance | null = null;
  private WB: Instance | null = null;
  private readonly units: Record<FloatingUnit, (Instance | null)[]>;
  /** Instructions from ID to WB, oldest first */
  private inFlight: Instance[] = [];
  private report!: CycleReport;
  private changes = new Map<string, RegisterChange>();

  constructor(
    public readonly config: MachineConfig,
    program: Uint8Array,
    start: number,
    private readonly io: ProgramIO,
  ) {
    this.memory = new Memory(config.memorySize);
    this.memory.bytes.set(program.subarray(0, config.memorySize));
    this.pc = start;
    this.registers.PC = start;
    this.control.set("PC", start);
    this.units = {
      fadd: new Array(config.fadd.count).fill(null),
      fmul: new Array(config.fmul.count).fill(null),
      fdiv: new Array(config.fdiv.count).fill(null),
    };
  }

  /** The address of the next instruction to fetch */
  public get nextPC(): number {
    return this.pc;
  }

  public set nextPC(address: number) {
    this.pc = address >>> 0;
    this.registers.PC = this.pc;
    // A change of the cycle: the register views show the new PC
    this.setControl("PC", this.pc);
  }

  /** Advances one clock cycle */
  public tick(): CycleReport {
    if (this.complete) throw new SimulationError("The simulation has ended");
    const k = ++this.cycle;
    this.changes = new Map();
    const output = { text: "" };
    const io: ProgramIO = {
      write: (text, descriptor) => {
        output.text += text;
        this.io.write(text, descriptor);
      },
      readLine: () => this.io.readLine(),
    };
    this.report = {
      cycle: k,
      IF: null,
      ID: null,
      intEX: null,
      MEM: null,
      WB: null,
      units: { fadd: [], fmul: [], fdiv: [] },
      fetched: null,
      arrows: [],
      stalls: [],
      reads: [],
      registers: [],
      memory: [],
      output: "",
      waitingForInput: false,
      halted: false,
    };
    const labels = new Map<Instance, StallLabel>();
    let aborted: Instance | null = null;
    let issued: Instance | null = null;

    try {
      // 1. WB of the last cycle leaves the pipeline
      if (this.WB) this.retire(this.WB);
      // 2. MEM → WB
      this.WB = this.MEM;
      this.MEM = null;
      // 3. Who gets MEM: the floating point units first (the oldest), then intEX
      const finished = FLOATING_UNITS.flatMap((unit) => this.units[unit].filter((x): x is Instance => x !== null && x.exEnd <= k - 1)).sort(
        (a, b) => a.id - b.id,
      );
      if (finished.length > 0) {
        const chosen = finished[0];
        this.units[chosen.unit as FloatingUnit][chosen.unitIndex] = null;
        this.MEM = chosen;
        for (const waiting of finished.slice(1)) {
          labels.set(waiting, "Stall");
          this.report.stalls.push({ instance: waiting, cycle: k, label: "Stall", kind: "mem", cause: chosen });
        }
        if (this.EX) {
          labels.set(this.EX, "Stall");
          this.stats.structuralStalls++;
          this.EX.stall = "Stall";
          this.report.stalls.push({ instance: this.EX, cycle: k, label: "Stall", kind: "mem", cause: chosen });
        }
      } else if (this.EX) {
        this.MEM = this.EX;
        this.EX = null;
      }
      // 4. ID → intEX or a floating point unit
      const x = this.ID;
      if (x) {
        const blocker = this.blocker(x, k, io);
        if (blocker === null) {
          this.issue(x, k);
          this.ID = null;
          issued = x;
        } else {
          labels.set(x, blocker.label);
          this.countStall(x, blocker, k);
          const { label, kind, cause, register, forwardingHelps } = blocker;
          this.report.stalls.push({ instance: x, cycle: k, label, kind, cause, register, forwardingHelps });
        }
      }
      // 5. IF → ID
      const y = this.IF;
      if (y) {
        if (y.squashed) {
          aborted = y;
          this.IF = null;
          this.report.stalls.push({ instance: y, cycle: k, label: "Aborted", kind: "aborted", cause: y.squashedBy ?? undefined });
        } else if (this.ID === null) {
          if (y.isTrap && this.inFlight.length > 0) {
            labels.set(y, "T-Stall");
            this.stats.trapStalls++;
            y.stall = "T-Stall";
            this.report.stalls.push({
              instance: y,
              cycle: k,
              label: "T-Stall",
              kind: "trap",
              cause: this.inFlight[this.inFlight.length - 1],
            });
          } else {
            this.ID = y;
            this.IF = null;
            this.inFlight.push(y);
          }
        } else {
          // Waits behind the instruction stalled in ID
          const label = labels.get(this.ID) ?? "Stall";
          labels.set(y, label);
          this.report.stalls.push({ instance: y, cycle: k, label, kind: "blocked", cause: this.ID });
        }
      }
      // 6. Fetch
      if (this.IF === null && this.fetching) this.fetch(k);

      // 7. The work of the cycle: WB writes in the first half, ID reads in the second
      if (this.WB) this.writeBackStage(this.WB);
      if (this.MEM) this.memoryStage(this.MEM, k);
      if (issued) this.executeStage(issued, k);
      if (this.ID) this.decodeStage(this.ID, k);
    } catch (error) {
      if (!(error instanceof SimulationError)) throw error;
      this.report.error = error.message;
      this.complete = true;
    }

    // What each stage holds in this cycle
    const cell = (instance: Instance | null): Cell | null => (instance ? { instance, label: labels.get(instance) ?? true } : null);
    this.report.IF = cell(this.IF);
    this.report.ID = cell(this.ID) ?? (aborted ? { instance: aborted, label: "Aborted" } : null);
    this.report.intEX = cell(this.EX);
    this.report.MEM = cell(this.MEM);
    this.report.WB = cell(this.WB);
    for (const unit of FLOATING_UNITS) this.report.units[unit] = this.units[unit].map(cell);
    this.report.output = output.text;
    this.report.registers = [...this.changes.values()];
    this.stats.cycles = k + 1;
    this.stats.inPipeline = [this.IF, this.ID, this.EX, this.MEM, this.WB, ...FLOATING_UNITS.flatMap((unit) => this.units[unit])].filter(
      (instance) => instance !== null,
    ).length;
    return this.report;
  }

  // ─── Movements ────────────────────────────────────────────────────────────────────────────────────────────────────

  private fetch(k: number): void {
    const word = this.memory.readU32(this.pc);
    const instance = new Instance(this.nextId++, this.pc, word);
    this.IF = instance;
    this.report.fetched = instance;
    this.setControl("IMAR", this.pc);
    this.setControl("IR", word);
    this.nextPC = this.pc + 4;
    void k;
  }

  private retire(instance: Instance): void {
    this.inFlight = this.inFlight.filter((other) => other !== instance);
    this.WB = null;
  }

  /** Why the instruction in ID cannot go on to its execution unit in cycle `k`, or null if it can */
  private blocker(x: Instance, k: number, io: ProgramIO): Blocker | null {
    if (x.isControl && !x.resolved) {
      return { label: "R-Stall", kind: "raw", ...this.rawCause(x, k - 1) };
    }
    // Read after write: the operands must be ready for EX in cycle k
    if (!x.isControl) {
      const raw = this.rawCause(x, k);
      if (raw.cause) return { label: "R-Stall", kind: "raw", ...raw };
    }
    // Write after write: an older instruction with the same destination is still executing
    const writer = this.olderWriterExecuting(x);
    if (writer) return { label: "W-Stall", kind: "waw", cause: writer.instance, register: registerName(writer.operand) };
    // A free execution unit
    if (x.unit === "int") {
      if (this.EX !== null) return { label: "Stall", kind: "blocked", cause: this.EX };
    } else if (!this.units[x.unit].includes(null)) {
      return { label: "S-Stall", kind: "structural" };
    }
    // A trap runs when it goes on to EX (the pipeline is empty: it waited in IF)
    if (x.isTrap) {
      const trap = runTrap(x.decoded?.offset ?? 0, this.registers, this.memory, io);
      if (trap.waitingForInput) {
        this.report.waitingForInput = true;
        return { label: "T-Stall", kind: "input" };
      }
      x.result.value = trap.r1;
      x.producedCycle = k;
      x.halts = trap.halt === true;
    }
    return null;
  }

  private issue(x: Instance, k: number): void {
    x.stall = null;
    this.stats.instructions++;
    if (x.isLoad) this.stats.loads++;
    if (x.isStore) this.stats.stores++;
    if (x.isTrap) this.stats.traps++;
    if (x.unit !== "int") this.stats[x.unit]++;
    if (x.unit === "int") {
      this.EX = x;
    } else {
      const index = this.units[x.unit].indexOf(null);
      this.units[x.unit][index] = x;
      x.unitIndex = index;
    }
    if (x.halts) {
      // Trap 0: nothing after it runs
      this.fetching = false;
      if (this.IF) {
        this.IF.squashed = true;
        this.IF.squashedBy = x;
      }
    }
  }

  private countStall(x: Instance, blocker: Blocker, k: number): void {
    const first = x.stall !== blocker.label;
    x.stall = blocker.label;
    switch (blocker.kind) {
      case "raw":
        this.stats.rawStalls++;
        if (x.isControl) this.stats.branchStalls++;
        else if (blocker.cause?.isLoad) this.stats.loadStalls++;
        else if (blocker.cause && blocker.cause.unit !== "int") this.stats.floatingStalls++;
        break;
      case "waw":
        this.stats.wawStalls++;
        break;
      case "structural":
        this.stats.structuralStalls++;
        break;
      case "trap":
      case "input":
        this.stats.trapStalls++;
        break;
      case "blocked":
        break;
    }
    if (first && blocker.cause && (blocker.kind === "raw" || blocker.kind === "waw")) {
      this.report.arrows.push({ from: blocker.cause, fromCycle: k - 1, to: x, toCycle: k, kind: "stall" });
    }
  }

  // ─── Hazards ──────────────────────────────────────────────────────────────────────────────────────────────────────

  /** The youngest instruction older than `x` that writes the register (the one whose value `x` must read) */
  private producerOf(x: Instance, kind: "int" | "fp" | "fpsr", register = 0): Instance | null {
    const index = this.inFlight.indexOf(x);
    for (let i = index - 1; i >= 0; i--) {
      if (this.inFlight[i].writes(kind, register)) return this.inFlight[i];
    }
    return null;
  }

  private sources(x: Instance): Operand[] {
    return [
      ...x.use.intReads.map((register) => ({ kind: "int" as const, register })),
      ...x.use.fpReads.map((register) => ({ kind: "fp" as const, register })),
      ...(x.use.readsFPSR ? [{ kind: "fpsr" as const, register: 0 }] : []),
    ];
  }

  /**
   * The operand of `x` (and its producer) that is not ready to be used in cycle `useCycle + 1` (EX of an instruction, or
   * the cycle after the ID of a branch, which uses its operands in ID)
   */
  private unreadyOperand(x: Instance, useCycle: number): { producer: Instance; operand: Operand } | null {
    for (const operand of this.sources(x)) {
      const producer = this.producerOf(x, operand.kind, operand.register);
      if (producer === null) continue;
      if (!this.isReady(producer, useCycle, x.isControl)) return { producer, operand };
    }
    return null;
  }

  private unreadyProducer(x: Instance, useCycle: number): Instance | null {
    return this.unreadyOperand(x, useCycle)?.producer ?? null;
  }

  /** The cause of a read after write: the producer, the register and whether forwarding would have avoided the stall */
  private rawCause(x: Instance, useCycle: number): Pick<Blocker, "cause" | "register" | "forwardingHelps"> {
    const unready = this.unreadyOperand(x, useCycle);
    if (unready === null) return {};
    const { producer, operand } = unready;
    const forwardingHelps = !this.config.forwarding && Number.isFinite(producer.producedCycle) && producer.producedCycle <= useCycle - 1;
    return { cause: producer, register: registerName(operand), forwardingHelps };
  }

  /**
   * Whether the result of `producer` can be used by an instruction that needs it in EX in cycle `cycle` (or, for a
   * branch, in ID in cycle `cycle + 1`)
   */
  private isReady(producer: Instance, cycle: number, forBranch: boolean): boolean {
    if (this.config.forwarding) return producer.producedCycle <= cycle - 1;
    // Without forwarding the value comes from the registers: written in WB (first half), read in ID (second half)
    return forBranch ? producer === this.WB : false;
  }

  private olderWriterExecuting(x: Instance): { instance: Instance; operand: Operand } | null {
    const executing = new Set<Instance>(
      [...FLOATING_UNITS.flatMap((unit) => this.units[unit]), this.EX].filter((i): i is Instance => i !== null),
    );
    for (const writer of executing) {
      if (writer.id >= x.id) continue;
      const int = x.use.intWrites.find((register) => writer.writes("int", register));
      if (int !== undefined) return { instance: writer, operand: { kind: "int", register: int } };
      const fp = x.use.fpWrites.find((register) => writer.writes("fp", register));
      if (fp !== undefined) return { instance: writer, operand: { kind: "fp", register: fp } };
      if (x.use.writesFPSR && writer.writes("fpsr")) return { instance: writer, operand: { kind: "fpsr", register: 0 } };
    }
    return null;
  }

  /** The operands of `x`: from the registers, or forwarded from the older instructions that have produced them */
  private operands(x: Instance, k: number): Operands {
    const decoded = x.decoded as Decoded;
    const { def, rs1, rs2 } = decoded;
    const doubles = def.doubles ?? [];
    const intValue = (register: number) => {
      const producer = this.producerOf(x, "int", register);
      if (producer && producer.result.value !== undefined && producer !== null) {
        this.forwarded(producer, x, k);
        return producer.result.value | 0;
      }
      return this.registers.R[register];
    };
    const fpWord = (register: number) => {
      const producer = this.producerOf(x, "fp", register);
      if (producer?.result.fpValue) {
        this.forwarded(producer, x, k);
        const target = destination(producer.decoded as Decoded);
        const offset = target && target.kind === "fp" ? register - target.register : 0;
        return producer.result.fpValue[offset] >>> 0;
      }
      return this.registers.F[register];
    };
    const fp = (register: number, isDouble: boolean) => (isDouble ? [fpWord(register), fpWord(register + 1)] : [fpWord(register)]);
    const fpSourceA = def.syntax === "fff" || def.syntax === "ff" || def.syntax === "fcmp" || def.syntax === "rf";
    const fpSourceB = def.syntax === "fff" || def.syntax === "fcmp" || def.syntax === "fstore";
    const fpsrProducer = x.use.readsFPSR ? this.producerOf(x, "fpsr") : null;
    if (fpsrProducer) this.forwarded(fpsrProducer, x, k);
    return {
      a: x.use.intReads.includes(rs1) ? intValue(rs1) : this.registers.R[rs1],
      b: x.use.intReads.includes(rs2) ? intValue(rs2) : this.registers.R[rs2],
      fa: fpSourceA ? fp(rs1, doubles.includes("s1")) : [],
      fb: fpSourceB ? fp(rs2, def.syntax === "fstore" ? doubles.includes("d") : doubles.includes("s2")) : [],
      fpsr: fpsrProducer ? (fpsrProducer.result.fpsr ?? this.registers.FPSR) : this.registers.FPSR,
    };
  }

  private forwarded(producer: Instance, consumer: Instance, k: number): void {
    // The value came through a forwarding path only if it was not yet in the registers
    if (producer === this.WB && !consumer.isControl) return;
    if (!this.report.arrows.some((arrow) => arrow.from === producer && arrow.to === consumer)) {
      this.report.arrows.push({ from: producer, fromCycle: producer.producedCycle, to: consumer, toCycle: k, kind: "forwarding" });
    }
  }

  // ─── Stages ───────────────────────────────────────────────────────────────────────────────────────────────────────

  private decodeStage(x: Instance, k: number): void {
    if (x.decoded === null) {
      throw new SimulationError(
        `Invalid instruction 0x${x.word.toString(16).toUpperCase().padStart(8, "0")} at 0x${x.pc.toString(16).toUpperCase().padStart(8, "0")}`,
      );
    }
    this.setControl("A", this.registers.R[x.decoded.rs1]);
    this.setControl("B", this.registers.R[x.decoded.rs2]);
    if (!x.isControl || x.resolved) return;
    // Branches and jumps: resolved here if their operand is ready
    if (this.unreadyProducer(x, k) !== null) return;
    const execution = execute(x.decoded, this.operands(x, k), x.pc);
    x.execution = execution;
    x.resolved = true;
    const branch = execution.branch;
    if (!branch) return;
    this.setControl("BTA", branch.target);
    if (execution.value !== undefined) {
      x.result.value = execution.value;
      x.producedCycle = k;
    }
    if (branch.conditional) {
      this.stats.branches++;
      if (branch.taken) this.stats.taken++;
    }
    if (branch.taken) {
      // Predict not taken: the instruction fetched after the branch goes
      if (this.IF) {
        this.IF.squashed = true;
        this.IF.squashedBy = x;
      }
      this.stats.controlStalls++;
      this.nextPC = branch.target;
    }
  }

  private executeStage(x: Instance, k: number): void {
    const decoded = x.decoded as Decoded;
    const delay = x.unit === "int" ? 1 : this.config[x.unit].delay;
    x.exEnd = k + delay - 1;
    if (x.isControl || x.isTrap) return;
    const execution = execute(decoded, this.operands(x, k), x.pc);
    x.execution = execution;
    if (execution.memory) {
      this.setControl("DMAR", execution.memory.address);
      if (execution.memory.store) {
        this.setControl("SDR", execution.memory.store[0]);
        if (execution.memory.bytes === 8) this.setControl("SDRHI", execution.memory.store[1]);
      }
      return;
    }
    x.result = { value: execution.value, fpValue: execution.fpValue, fpsr: execution.fpsr };
    x.producedCycle = x.exEnd;
    if (execution.value !== undefined) this.setControl("ALU", execution.value);
    if (execution.fpValue) {
      this.setControl("ALU", execution.fpValue[0]);
      if (execution.fpValue.length > 1) this.setControl("ALUHI", execution.fpValue[1]);
    }
  }

  private memoryStage(x: Instance, k: number): void {
    const access = x.execution?.memory;
    if (!access) return;
    const loaded = accessMemory(x.execution as Execution, this.memory);
    if (access.store) {
      this.report.memory.push({ address: access.address, bytes: access.bytes, floating: access.floating === true, words: access.store });
      return;
    }
    x.result = loaded;
    x.producedCycle = k;
    this.report.reads.push({ address: access.address, bytes: access.bytes });
    if (loaded.value !== undefined) this.setControl("LDR", loaded.value);
    if (loaded.fpValue) {
      this.setControl("LDR", loaded.fpValue[0]);
      if (loaded.fpValue.length > 1) this.setControl("LDRHI", loaded.fpValue[1]);
    }
  }

  private writeBackStage(x: Instance): void {
    if (x.halts) {
      this.complete = true;
      this.report.halted = true;
    }
    const decoded = x.decoded;
    if (decoded === null) return;
    const target = destination(decoded);
    writeBack(decoded, x.result, this.registers);
    if (target?.kind === "int" && x.result.value !== undefined) {
      this.changes.set(`R${target.register}`, { kind: "int", name: `R${target.register}`, value: this.registers.R[target.register] });
    }
    if (target?.kind === "fp" && x.result.fpValue) {
      for (let i = 0; i < target.words; i++) {
        const register = target.register + i;
        this.changes.set(`F${register}`, { kind: "fp", name: `F${register}`, value: this.registers.F[register] });
      }
    }
    if (target?.kind === "fpsr" && x.result.fpsr !== undefined) this.setControl("FPSR", this.registers.FPSR);
  }

  private setControl(name: string, value: number): void {
    this.control.set(name, value >>> 0);
    this.changes.set(name, { kind: "control", name, value: value >>> 0 });
  }
}
