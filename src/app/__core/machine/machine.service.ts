import { computed, Injectable, inject, type Signal, signal } from "@angular/core";
import { DEFAULT_CODE } from "@app/CONSTANTS";
import {
  EnumLogLevel,
  type InterfaceFileItem,
  type TypeAddress,
  type TypeBreakpoints,
  type TypeConfigurationMachine,
  type TypeCycleCell,
  type TypeDataStatistics,
  type TypeEnabledForwardingConfiguration,
  type TypeErrorInCode,
  type TypeFloatingPointStageConfiguration,
  type TypeInstructionsData,
  type TypeLogger,
  type TypeMemoryToUpdate,
  type TypeMemoryToUpdateResponse,
  type TypePipelineCellInstruction,
  type TypePipelineInstructions,
  type TypeRegisterToUpdate,
  type TypeRegisterToUpdateResponse,
  type TypeSimulationStep,
  type TypeStage,
  type TypeStatusMachine,
} from "@app/Types";
import { Utils } from "@app/Utils";
import { UtilsDataStructures } from "@app/UtilsDataStructures";
import { ConfigService } from "@core/config/config.service";
import { ManagerBreakpoints } from "@core/DLX/ManagerBreakpoints";
import { ManagerMemory } from "@core/DLX/ManagerMemory";
import { ManagerRegisters } from "@core/DLX/ManagerRegisters";
import { ManagerStatistics } from "@core/DLX/ManagerStatistics";
import type { JournalEntry, StageBreakpoint, Watchpoint } from "@core/engine/runner";
import type {
  BreakpointHit,
  BreakpointStage,
  CompareResponse,
  LocalSimulationInitRequest,
  LocalSimulationInitResponse,
  SimulationStepExtra,
  SymbolInfo,
} from "@core/engine/simulator";
import { ExerciseService } from "@core/exercises/exercise.service";
import { logger } from "@core/logger/logger";
import { CycleDiagramModel } from "@core/machine/cycle-diagram.model";
import { FileSystemService } from "@core/services/file-system/file-system.service";
import { LocalSimulatorService } from "@core/services/simulator/local-simulator.service";
import { SoundService } from "@core/services/sound/sound.service";
import { ToastService } from "@core/services/toast/toast.service";
import { StorageService } from "@core/storage/storage.service";
import { TranslateService } from "@ngx-translate/core";
import { firstValueFrom, type Observable, Subject } from "rxjs";

import THUMDER_Map = UtilsDataStructures.THUMDER_Map;

type Step = TypeSimulationStep & SimulationStepExtra;

/** The number of floating point units of each kind of the program loaded (the pipeline view draws one box for each) */
export type FloatingPointUnits = { fadd: number; fmul: number; fdiv: number };

/** Where each instruction of the code is in the pipeline in this cycle, by address */
export type StagesByAddress = ReadonlyMap<TypeAddress, TypeStage>;

/** The stage of the breakpoint of each line that does not stop in IF (storage: "breakpoint_stages") */
export type BreakpointStages = Record<string, BreakpointStage>;

/**
 * What a cycle changed, for the datapath: the registers written (PC, IR, A, B, ALU, DMAR, LDR... and the general purpose
 * ones in WB), the memory written and what the loads read
 */
export type CycleChanges = {
  step: number;
  registers: readonly TypeRegisterToUpdate[];
  memory: readonly TypeMemoryToUpdate[];
  reads: readonly { address: number; bytes: number }[];
};

/** The modules chosen for each program, by the key of its file (storage: "program_modules"); without one, automatic */
export type ProgramModules = Record<string, string[]>;

/**
 * A change of the user during a run (a line of input, a register, the memory): the simulator makes it again when the
 * run is repeated to step back, and `replay` makes it again in the page
 */
type JournalRecord = JournalEntry & { replay: () => void };

/**
 * The state of the machine that the views read. Only MachineService writes it, and the views follow its signals: no view
 * keeps a copy of its own. The registers and the memory are big mutable objects (ManagerRegisters, ManagerMemory):
 * `values` changes every time they change.
 */
export type MachineState = {
  /** The cycle the simulation is in (0 before the first one) */
  step: Signal<number>;
  /** The line of the main file of the instruction just fetched (or the newest one in the pipeline) */
  line: Signal<number>;
  running: Signal<boolean>;
  complete: Signal<boolean>;
  /** Stopped at a breakpoint */
  breakpoint: Signal<boolean>;
  /** A program without errors is loaded and has not finished */
  canSimulate: Signal<boolean>;
  /** The program waits for a line of the console (trap 3) */
  waitingForInput: Signal<boolean>;
  /** Everything the program has written in the console (DLX-I/O) */
  output: Signal<string>;
  /** The errors of the assembler, with their line */
  errors: Signal<TypeErrorInCode[]>;
  /** The instructions of the program loaded */
  code: Signal<TypeInstructionsData[]>;
  stages: Signal<StagesByAddress>;
  /** The pipeline of this cycle, with the text of each instruction */
  pipeline: Signal<TypePipelineInstructions | null>;
  /** What this cycle changed (null before the first one) */
  cycle: Signal<CycleChanges | null>;
  units: Signal<FloatingPointUnits>;
  statistics: Signal<TypeDataStatistics>;
  /** Changes when the registers or the memory change */
  values: Signal<number>;
  /** Changes when the cycle clock diagram (`MachineService.diagram`) changes */
  diagram: Signal<number>;
  /** Changes every time a program is loaded */
  loads: Signal<number>;
  /** The cycles run since the program was loaded (stepping back goes to one less) */
  cycles: Signal<number>;
  /** Running to the end without drawing each cycle (the views are drawn when it stops) */
  quiet: Signal<boolean>;
  /** The breakpoint of the last stop: a line (and its stage), or a read or a write of a watched address */
  hit: Signal<BreakpointHit | null>;
  /** The labels of the program loaded (WinDLX: Memory → Symbols) */
  symbols: Signal<SymbolInfo[]>;
  /** The modules loaded with the program */
  modules: Signal<string[]>;
  /** The key of the file loaded (the file manager) */
  fileKey: Signal<string>;
};

/** A message of the log of the simulation */
export type LogEntry = { id: number; date: Date; level: string; text: string; cycle: number };

/** The messages of the log that are kept */
export const LOG_LIMIT = 2000;

@Injectable({
  providedIn: "root",
})
export class MachineService {
  private store = inject(StorageService);
  private config = inject(ConfigService);
  private exercises = inject(ExerciseService);
  // The simulator of THUMDER, in its Web Worker (src/app/__core/engine)
  private simulator = inject(LocalSimulatorService);
  private fileSystem = inject(FileSystemService);
  private translate = inject(TranslateService);
  private toast = inject(ToastService);
  private sound = inject(SoundService);

  public floatingPointStageConfiguration: TypeFloatingPointStageConfiguration;
  public memorySize: number;
  public enabledForwarding: TypeEnabledForwardingConfiguration;

  public readonly dataStatistics = new ManagerStatistics();
  public readonly registers = new ManagerRegisters();
  public readonly memory: ManagerMemory;
  public readonly breakpointManager = new ManagerBreakpoints();
  /** The cycle clock diagram, from the start of the simulation (drawn by its view) */
  public readonly diagram = new CycleDiagramModel();
  // address --> instruction
  public code: THUMDER_Map<TypeAddress, TypeInstructionsData> = new THUMDER_Map();

  private readonly stepSignal = signal(0);
  private readonly lineSignal = signal(0);
  private readonly runningSignal = signal(false);
  private readonly completeSignal = signal(false);
  private readonly breakpointSignal = signal(false);
  private readonly canSimulateSignal = signal(false);
  private readonly waitingForInputSignal = signal(false);
  private readonly outputSignal = signal("");
  private readonly errorsSignal = signal<TypeErrorInCode[]>([]);
  private readonly codeSignal = signal<TypeInstructionsData[]>([]);
  private readonly stagesSignal = signal<StagesByAddress>(new Map());
  private readonly pipelineSignal = signal<TypePipelineInstructions | null>(null);
  private readonly cycleSignal = signal<CycleChanges | null>(null);
  private readonly unitsSignal = signal<FloatingPointUnits>({ fadd: 1, fmul: 1, fdiv: 1 });
  private readonly statisticsSignal = signal<TypeDataStatistics>(this.dataStatistics.getData());
  private readonly valuesSignal = signal(0);
  private readonly diagramSignal = signal(0);
  private readonly loadsSignal = signal(0);
  private readonly cyclesSignal = signal(0);
  private readonly quietSignal = signal(false);
  private readonly hitSignal = signal<BreakpointHit | null>(null);
  private readonly symbolsSignal = signal<SymbolInfo[]>([]);
  private readonly modulesSignal = signal<string[]>([]);
  private readonly fileKeySignal = signal("");

  public readonly state: MachineState = {
    step: this.stepSignal.asReadonly(),
    line: this.lineSignal.asReadonly(),
    running: this.runningSignal.asReadonly(),
    complete: this.completeSignal.asReadonly(),
    breakpoint: this.breakpointSignal.asReadonly(),
    canSimulate: this.canSimulateSignal.asReadonly(),
    waitingForInput: this.waitingForInputSignal.asReadonly(),
    output: this.outputSignal.asReadonly(),
    errors: this.errorsSignal.asReadonly(),
    code: this.codeSignal.asReadonly(),
    stages: this.stagesSignal.asReadonly(),
    pipeline: this.pipelineSignal.asReadonly(),
    cycle: this.cycleSignal.asReadonly(),
    units: this.unitsSignal.asReadonly(),
    statistics: this.statisticsSignal.asReadonly(),
    values: this.valuesSignal.asReadonly(),
    diagram: this.diagramSignal.asReadonly(),
    loads: this.loadsSignal.asReadonly(),
    cycles: this.cyclesSignal.asReadonly(),
    quiet: this.quietSignal.asReadonly(),
    hit: this.hitSignal.asReadonly(),
    symbols: this.symbolsSignal.asReadonly(),
    modules: this.modulesSignal.asReadonly(),
    fileKey: this.fileKeySignal.asReadonly(),
  };

  /**
   * Where the program starts, for the buttons that go to it in the code and the memory: its label main or, without it,
   * its first instruction. Null without a program
   */
  public readonly entry = computed<{ address: number; main: boolean } | null>(() => {
    const main = this.symbolsSignal().find((symbol) => symbol.name === "main");
    if (main) return { address: Number.parseInt(main.address, 16) >>> 0, main: true };
    const first = this.codeSignal()[0];
    return first ? { address: Number.parseInt(first.address, 16) >>> 0, main: false } : null;
  });

  /** The last message of the log of the simulation, for the debug window */
  public logger: string = "";
  private readonly logger$ = new Subject<string>();
  /** The log of the simulation, for its view: the last LOG_LIMIT messages (`logVersion` changes with each one) */
  private readonly logEntries: LogEntry[] = [];
  private readonly logVersionSignal = signal(0);
  public readonly logVersion = this.logVersionSignal.asReadonly();
  private nextLogId = 1;
  private readonly level: EnumLogLevel = EnumLogLevel.All;

  // The cycle waiting for the answer of the simulator: there is never more than one, so two quick F10 run two cycles
  private stepping: Promise<void> | null = null;
  // Changes when the simulation is paused, finished or reset: a running loop with an older value stops
  private runId = 0;
  // The run of the simulator (in its worker) that is going on, if any
  private localRun: Promise<unknown> | null = null;

  /** What was sent to load the program (stepping back loads it again as it was, even if the editor changed it) */
  private lastInit: LocalSimulationInitRequest | null = null;
  /** The changes of the user since the program was loaded, with the cycle they were made at */
  private journal: JournalRecord[] = [];
  /** Running without drawing: the views are updated when the run stops */
  private quiet = false;
  /** Repeating the run to step back: no stops, toasts or new journal entries */
  private replaying = false;
  private pendingOutput = "";
  private lastStep: Step | null = null;

  constructor() {
    const config = this.config.value();
    this.floatingPointStageConfiguration = config.floatingPoint;
    this.enabledForwarding = config.forwarding;
    this.unitsSignal.set(MachineService.unitsOf(this.floatingPointStageConfiguration));
    this.memorySize = config.memorySize;
    this.memory = new ManagerMemory(this.memorySize);
  }

  // The names the rest of THUMDER used before the signals
  public get step(): number {
    return this.stepSignal();
  }

  public get line(): number {
    return this.lineSignal();
  }

  public get isRunning(): boolean {
    return this.runningSignal();
  }

  public get isComplete(): boolean {
    return this.completeSignal();
  }

  public get isBreakpoint(): boolean {
    return this.breakpointSignal();
  }

  public get canSimulate(): boolean {
    return this.canSimulateSignal();
  }

  private static unitsOf(configuration: TypeFloatingPointStageConfiguration | null): FloatingPointUnits {
    return {
      fadd: configuration?.addition.count ?? 1,
      fmul: configuration?.multiplication.count ?? 1,
      fdiv: configuration?.division.count ?? 1,
    };
  }

  /**
   * Loads the current file into the simulator: clears the state, sends the configuration and asks the simulator to
   * assemble the file. Returns false (and shows a toast) if the simulator fails
   */
  public async resetMachineStatus(options: { again?: boolean } = {}): Promise<boolean> {
    try {
      this.writeToLog("RESET");
      this.stopRunning();
      // The cycles of a run of the worker that are on their way are handled before everything is cleared
      await this.localRun?.catch(() => undefined);

      this.breakpointManager.reset();
      this.breakpointManager.updateManager(this.store.getItem("breakpoints") as TypeBreakpoints);

      // The configuration, with what the exercise of the file locks (EDU-07)
      const config = this.exercises.configFor((this.store.getItem("interfaceFileItem") as InterfaceFileItem | null)?.key);
      this.memorySize = config.memorySize;
      this.memory.setSize(this.memorySize);
      this.floatingPointStageConfiguration = config.floatingPoint;
      this.enabledForwarding = config.forwarding;
      this.diagram.limit = config.diagramHistory;
      this.emptyState({ keepJournal: options.again === true });
      this.sound.resetPipeline();

      // The configuration first: the simulator assembles the program for its memory size (a program that does not fit
      // is an assembly error, not data out of the memory of the page)
      await this.sendConfiguration();
      // The answer fills the code, the memory and the registers that have just been cleared
      await this.SimulationInit(options.again === true);
      this.loadsSignal.update((loads) => loads + 1);

      // The program loaded is in the status bar; only the errors get a toast (UI-10)
      if (!options.again) this.sound.event(this.canSimulate ? "load" : "errors");
      if (!options.again && !this.canSimulate) await this.toastAssemblyErrors();
      return true;
    } catch (error) {
      logger.error(error);
      await this.toastSimulatorError();
      return false;
    }
  }

  /** The registers, the code, the statistics and the signals of the views as they are before loading a program */
  private emptyState(options: { keepJournal?: boolean } = {}): void {
    this.registers.reset();
    this.dataStatistics.reset();
    this.diagram.reset();
    this.code = new THUMDER_Map();
    this.code.setDefaultValue(DEFAULT_CODE);

    this.stepSignal.set(0);
    this.lineSignal.set(-1);
    this.completeSignal.set(false);
    this.breakpointSignal.set(false);
    this.canSimulateSignal.set(false);
    this.waitingForInputSignal.set(false);
    this.outputSignal.set("");
    this.errorsSignal.set([]);
    this.codeSignal.set([]);
    this.stagesSignal.set(new Map());
    this.pipelineSignal.set(null);
    this.cycleSignal.set(null);
    this.unitsSignal.set(MachineService.unitsOf(this.floatingPointStageConfiguration));
    this.statisticsSignal.set(this.dataStatistics.getData());
    this.cyclesSignal.set(0);
    this.hitSignal.set(null);
    this.pendingOutput = "";
    this.lastStep = null;
    if (!options.keepJournal) this.journal = [];
    this.touchValues();
    this.diagramSignal.update((version) => version + 1);
  }

  /**
   * The button of the navbar that resets everything: the memory, the code and the registers to zero and no program
   * loaded (nothing can be simulated until the program is loaded again). The breakpoints of the file stay
   */
  public async clear(): Promise<void> {
    this.writeToLog("CLEAR");
    this.sound.event("clear");
    this.sound.resetPipeline();
    this.stopRunning();
    await this.localRun?.catch(() => undefined);
    this.memory.reset();
    this.emptyState();
    this.symbolsSignal.set([]);
    this.modulesSignal.set([]);
    this.lastInit = null;
    this.loadsSignal.update((loads) => loads + 1);
  }

  public getLoggerObservable(): Observable<string> {
    return this.logger$.asObservable();
  }

  // Navbar
  public async reset(): Promise<void> {
    await this.resetMachineStatus();
  }

  /** One cycle. While the simulation is running it does nothing (the running loop is already stepping) */
  public async nextStep(): Promise<void> {
    if (this.isRunning) return;
    try {
      await this.SimulationNextStep();
    } catch (error) {
      logger.error(error);
      await this.toastSimulatorError();
    }
  }

  public async pause(): Promise<void> {
    this.stopRunning();
  }

  /**
   * Runs cycle after cycle (one every `delay` ms of the configuration) until a pause, a breakpoint, the end or a line
   * of input. The simulator runs by itself in its worker (and stops there); here each cycle is drawn as it arrives. The
   * cycles that arrive after a pause also count: the machine has run them
   */
  public async resume(options: { delay?: number; until?: number; journal?: JournalEntry[] } = {}): Promise<void> {
    if (this.isComplete) {
      logger.warn("The simulation is complete: it cannot go on");
      return;
    }
    if (this.isRunning) return;
    this.breakpointSignal.set(false);
    this.hitSignal.set(null);
    this.runningSignal.set(true);

    const runId = ++this.runId;
    const delay = options.delay ?? this.config.value().delay;
    // Repeating a run to step back: no breakpoints
    const breakpoints = options.until === undefined ? this.runBreakpoints() : { breakpoints: [] };
    this.localRun = this.simulator.run({ delay, ...breakpoints, until: options.until, journal: options.journal }, (step) =>
      this.handleStep(step),
    );
    try {
      await this.localRun;
    } catch (error) {
      logger.error(error);
      await this.toastSimulatorError();
    } finally {
      this.localRun = null;
      if (runId === this.runId && this.isRunning) this.stopRunning();
    }
  }

  /** The breakpoints of a run: the lines, the stage of those that do not stop in IF, and the watched addresses */
  private runBreakpoints(): { breakpoints: number[]; stages: StageBreakpoint[]; watchpoints: Watchpoint[] } {
    const breakpoints = this.breakpointManager.getAllLinesWithBreakpoints();
    const stages = (this.store.getItem("breakpoint_stages") as BreakpointStages | null) ?? {};
    return {
      breakpoints,
      stages: breakpoints.filter((line) => stages[line] && stages[line] !== "IF").map((line) => ({ line, stage: stages[line] })),
      watchpoints: (this.store.getItem("watchpoints") as Watchpoint[] | null) ?? [],
    };
  }

  /** The breakpoints changed (the editor, the window of the breakpoints): a run going on uses the new ones */
  public updateRunBreakpoints(): void {
    const { breakpoints, stages, watchpoints } = this.runBreakpoints();
    this.simulator.setBreakpoints(breakpoints, stages, watchpoints);
  }

  /** The pace of the simulation (ms between cycles), also for the run going on (UI-04) */
  public setSpeed(delay: number): void {
    const saved = this.config.update({ delay }).delay;
    if (this.localRun !== null) this.simulator.setSpeed(saved);
  }

  /** Runs to the end (or to a breakpoint) as fast as possible, drawing only where it stops (UI-04) */
  public async runToEnd(): Promise<void> {
    if (this.isRunning || this.isComplete || !this.canSimulate) return;
    this.setQuiet(true);
    try {
      await this.resume({ delay: 0 });
    } finally {
      this.setQuiet(false);
    }
  }

  /**
   * Goes back one cycle (EDU-03): the program is loaded again as it was and run, without drawing, to the cycle before,
   * with the changes of the user (input, registers, memory) made again at the cycle they were made
   */
  public async stepBack(): Promise<void> {
    const target = this.cyclesSignal() - 1;
    if (target < 0 || this.isRunning || this.lastInit === null) return;
    const journal = this.journal.filter((entry) => entry.at <= target);
    this.sound.event("back");
    this.replaying = true;
    this.setQuiet(true);
    try {
      if (!(await this.resetMachineStatus({ again: true }))) return;
      this.journal = journal;
      // The changes made before the first cycle
      for (const entry of journal.filter((entry) => entry.at === 0)) {
        await this.simulator.request(entry.event, entry.payload);
        entry.replay();
      }
      const later = journal.filter((entry) => entry.at > 0).map(({ at, event, payload }) => ({ at, event, payload }));
      if (target > 0) await this.resume({ delay: 0, until: target, journal: later });
    } finally {
      this.replaying = false;
      this.setQuiet(false);
    }
  }

  private setQuiet(quiet: boolean): void {
    this.quiet = quiet;
    this.quietSignal.set(quiet);
    if (!quiet) this.publish();
  }

  /** After running without drawing: the views get the state where it stopped */
  private publish(): void {
    if (this.pendingOutput) this.outputSignal.update((output) => output + this.pendingOutput);
    this.pendingOutput = "";
    const step = this.lastStep;
    if (step !== null) {
      this.stepSignal.set(step.step);
      this.lineSignal.set(step.line);
      if (step.pipeline) this.publishPipeline(step);
      // Waiting for input, unless the input it waits for was already given
      const answered = this.journal.some((entry) => entry.event === "SimulationInputRequest" && entry.at === step.step + 1);
      this.waitingForInputSignal.set(step.waitingForInput === true && !answered);
    }
    this.statisticsSignal.set(this.dataStatistics.getData());
    this.touchValues();
    this.diagramSignal.update((version) => version + 1);
  }

  /** The same program with and without forwarding, to the end, with the rest of the configuration (EDU-02) */
  public async compareForwarding(): Promise<CompareResponse> {
    const init = this.lastInit ?? (await this.initRequest());
    return this.simulator.request<CompareResponse>("CompareForwardingRequest", { init, configuration: this.configuration() });
  }

  public async end(): Promise<void> {
    this.stopRunning();
    this.completeSignal.set(true);
  }

  private stopRunning() {
    this.runningSignal.set(false);
    this.runId++;
    if (this.localRun !== null) this.simulator.pause();
  }

  /** What loads the file open in the editor: its text and the modules it may use */
  private async initRequest(): Promise<LocalSimulationInitRequest> {
    const file = this.store.getItem("interfaceFileItem") as InterfaceFileItem;
    const chosen = (this.store.getItem("program_modules") as ProgramModules | null)?.[file.key];
    return {
      id: "thumder",
      filename: file.name,
      date: Utils.dateToStringFormat(new Date()),
      content: file.content,
      registers: [],
      memory: [],
      breakpoints: [],
      // The modules it may need: the ones chosen (NUC-10) or, without a choice, those that define its missing symbols
      files: await this.fileSystem.programFiles(file),
      ...(chosen ? { modules: chosen } : {}),
    } as LocalSimulationInitRequest;
  }

  private async SimulationInit(again = false): Promise<boolean> {
    this.writeToLog("SimulationInit");
    const request = again && this.lastInit ? this.lastInit : await this.initRequest();
    if (!again) this.fileKeySignal.set((this.store.getItem("interfaceFileItem") as InterfaceFileItem | null)?.key ?? "");
    this.lastInit = request;
    const simulationInit = await this.simulator.request<LocalSimulationInitResponse>("SimulationInitRequest", JSON.stringify(request));

    this.memory.processResponseMachineInstructions(simulationInit.machineInstructions);
    for (const instruction of simulationInit.machineInstructions) {
      this.code.set(Utils.stringToAddress(instruction.address), { ...instruction });
    }
    for (const step of simulationInit.runner) {
      this.memory.processMemoryToUpdateArray(step.memory);
      this.registers.processRegisterToUpdateArray(step.registers);
    }

    this.errorsSignal.set(simulationInit.errors);
    this.symbolsSignal.set(simulationInit.symbols ?? []);
    this.modulesSignal.set(simulationInit.modules ?? []);
    this.codeSignal.set(simulationInit.machineInstructions.map((instruction) => ({ ...instruction })));
    this.canSimulateSignal.set(simulationInit.canSimulate);
    this.touchValues();
    return simulationInit.canSimulate;
  }

  private configuration(): TypeConfigurationMachine {
    return {
      enabledForwarding: this.enabledForwarding,
      memorySize: this.memorySize,
      addition: { ...this.floatingPointStageConfiguration.addition },
      division: { ...this.floatingPointStageConfiguration.division },
      multiplication: { ...this.floatingPointStageConfiguration.multiplication },
    };
  }

  private async sendConfiguration(): Promise<void> {
    const payload = this.configuration();
    const response = await this.simulator.request<TypeConfigurationMachine>("UpdateConfigurationMachineRequest", JSON.stringify(payload));
    this.writeToLog("UpdateConfigurationMachine: {0}", EnumLogLevel.Debug, [{ index: 0, value: response }]);
  }

  // Waits for the answer of the simulator; a second call while a cycle is on its way gets that same cycle
  private SimulationNextStep(): Promise<void> {
    if (this.stepping !== null) return this.stepping;
    this.stepping = (async () => {
      try {
        const payload = JSON.stringify({ step: this.step + 1 });
        await this.handleStep(await this.simulator.request<Step>("SimulationNextStepRequest", payload));
      } finally {
        this.stepping = null;
      }
    })();
    return this.stepping;
  }

  /** A cycle of the simulator: the console, the end, the breakpoints and what changed */
  private async handleStep(step: Step): Promise<void> {
    this.lastStep = step;
    this.cyclesSignal.set(step.step + 1);
    if (step.output) {
      if (this.quiet) this.pendingOutput += step.output;
      else this.outputSignal.update((output) => output + step.output);
    }
    if (this.replaying) {
      // The changes the user made at this point of the original run
      for (const entry of this.journal) if (entry.at === step.step + 1) entry.replay();
      this.completeSignal.set(step.isComplete ?? false);
      if (step.isComplete) this.canSimulateSignal.set(false);
      this.processStep(step);
      return;
    }
    // The sounds of the cycle: the stages the instructions enter (only followed when running without drawing)
    if (step.pipeline) this.sound.cycle(step.pipeline, this.isRunning ? this.config.value().delay : 300, this.quiet);
    if (step.waitingForInput) {
      // The program waits for a line (trap 3): stop until it is typed in the console
      this.stopRunning();
      this.waitingForInputSignal.set(true);
      this.sound.event("input");
    }
    if (step.error) {
      this.sound.event("error");
      await this.toastProgramError(step.error);
    }

    const complete = step.isComplete ?? false;
    // A breakpoint stops the simulation when its instruction is fetched (not again while it waits in IF)
    const breakpoint = step.isBreakpoint === true || (step.isNewInstruction && this.breakpointManager.isBreakpoint(step.line));
    this.completeSignal.set(complete);
    this.breakpointSignal.set(breakpoint);
    if (!this.quiet) {
      this.stepSignal.set(step.step);
      this.lineSignal.set(step.line);
    }
    if (complete) {
      this.canSimulateSignal.set(false);
      this.stopRunning();
      this.sound.event("complete");
      this.processStep(step);
      await this.toastMessage("TOAST.TITLE_END_SIMULATION", "TOAST.MESSAGE_END_SIMULATION");
      return;
    }
    if (breakpoint) {
      this.stopRunning();
      this.sound.event("breakpoint");
      this.hitSignal.set(step.hit ?? { kind: "line", line: step.line, stage: "IF" });
      await this.toastBreakpoint(step.hit ?? { kind: "line", line: step.line, stage: "IF" });
    }
    this.processStep(step);
    this.writeToLog("SimulationNextStep S: {0} L: {1}", EnumLogLevel.Debug, [
      { index: 0, value: step.step },
      { index: 1, value: step.line },
    ]);
  }

  /** What a cycle changes: registers, memory, statistics, the pipeline and the cycle clock diagram */
  private processStep(step: Step): void {
    if (step.registers?.length > 0) this.registers.processRegisterToUpdateArray(step.registers);
    if (step.memory?.length > 0) this.memory.processMemoryToUpdateArray(step.memory);
    if (step.statistics && Object.keys(step.statistics).length > 0) {
      this.dataStatistics.processResponse(step.statistics);
      if (!this.quiet) this.statisticsSignal.set(this.dataStatistics.getData());
    }
    if (!this.quiet && (step.registers?.length > 0 || step.memory?.length > 0)) this.touchValues();
    if (step.pipeline) this.updatePipeline(step);
  }

  // The pipeline and the cycle clock diagram live here (not in their views), so they are complete when a view opens
  private updatePipeline(step: Step): void {
    const { pipeline } = step;
    if (step.isNewInstruction === true) {
      this.diagram.addInstruction(this.code.getOrDefaultValue(pipeline.IF.address)?.instruction ?? "");
    }
    for (const arrow of pipeline.arrows ?? []) {
      // A number, or a hexadecimal string in older versions
      const color = typeof arrow.color === "number" ? arrow.color : parseInt(String(arrow.color), 16);
      this.diagram.addArrow({
        fromRow: arrow.fromAddressRow,
        fromCycle: arrow.fromStep,
        toRow: arrow.toAddressRow,
        toCycle: arrow.toStep,
        color,
      });
    }
    this.diagram.addCycle(pipeline, step.step);
    if (step.stalls) this.diagram.addStalls(step.stalls);
    if (this.quiet) return;
    this.publishPipeline(step);
    this.diagramSignal.update((version) => version + 1);
  }

  /** The pipeline of a cycle and where each instruction is, for the views */
  private publishPipeline(step: Step): void {
    const { pipeline } = step;
    this.cycleSignal.set({ step: step.step, registers: step.registers ?? [], memory: step.memory ?? [], reads: step.reads ?? [] });
    const unit = (cell: TypeCycleCell & { unit?: number }) => ({ unit: cell.unit ?? 0, ...this.instructionInCell(cell) });
    this.pipelineSignal.set({
      IF: this.instructionInCell(pipeline.IF),
      ID: this.instructionInCell(pipeline.ID),
      intEX: this.instructionInCell(pipeline.intEX),
      MEM: this.instructionInCell(pipeline.MEM),
      WB: this.instructionInCell(pipeline.WB),
      faddEX: pipeline.faddEX.map(unit),
      fmultEX: pipeline.fmultEX.map(unit),
      fdivEX: pipeline.fdivEX.map(unit),
    });

    // Where each instruction is: one Map for the whole code table
    const stages = new Map<TypeAddress, TypeStage>();
    const place = (cell: TypeCycleCell, stage: TypeStage) => {
      if (cell.draw !== false && cell.address) stages.set(cell.address, stage);
    };
    for (const stage of ["IF", "ID", "intEX", "MEM", "WB"] as const) place(pipeline[stage], stage);
    for (const stage of ["faddEX", "fmultEX", "fdivEX"] as const) for (const cell of pipeline[stage]) place(cell, stage);
    this.stagesSignal.set(stages);
  }

  private instructionInCell(cell: TypeCycleCell): TypePipelineCellInstruction {
    if (cell.address === undefined || (cell.address as string).length === 0) return { text: "", draw: cell.draw };
    return { text: this.getCode(cell.address).instruction, draw: cell.draw, address: cell.address, id: cell.addressRow };
  }

  /** The registers or the memory changed (they are mutable objects) */
  private touchValues(): void {
    this.valuesSignal.update((version) => version + 1);
  }

  /** The line typed in the console for the program (trap 3); it goes on where it stopped */
  public async provideInput(text: string): Promise<void> {
    const payload = JSON.stringify({ text });
    await this.simulator.request("SimulationInputRequest", payload);
    this.outputSignal.update((output) => `${output}${text}\n`);
    this.waitingForInputSignal.set(false);
    this.record("SimulationInputRequest", payload, () => {
      this.pendingOutput += `${text}\n`;
    });
  }

  /** A change of the user, to make it again when stepping back */
  private record(event: string, payload: string, replay: () => void): void {
    if (!this.replaying) this.journal.push({ at: this.cyclesSignal(), event, payload, replay });
  }

  /** Clears the console of the program */
  public clearOutput(): void {
    this.outputSignal.set("");
  }

  /** Sends the registers to the simulator and applies the values it has stored. Returns whether all were accepted */
  public async updateRegisters(registersToUpdate: TypeRegisterToUpdate[]): Promise<boolean> {
    const payload = JSON.stringify(registersToUpdate);
    const response = await this.simulator.request<TypeRegisterToUpdateResponse>("UpdateRegisterRequest", payload);
    this.registers.processRegisterToUpdateArray(response.registerToUpdates);
    this.touchValues();
    this.record("UpdateRegisterRequest", payload, () => this.registers.processRegisterToUpdateArray(response.registerToUpdates));
    return response.allOK;
  }

  /** Sends the memory to the simulator and applies the values it has stored. Returns whether all were accepted */
  public async updateMemory(memoryToUpdate: TypeMemoryToUpdate[]): Promise<boolean> {
    const payload = JSON.stringify(memoryToUpdate);
    const response = await this.simulator.request<TypeMemoryToUpdateResponse>("UpdateMemoryRequest", payload);
    this.memory.processMemoryToUpdateArray(response.memoryToUpdates);
    this.touchValues();
    this.record("UpdateMemoryRequest", payload, () => this.memory.processMemoryToUpdateArray(response.memoryToUpdates));
    return response.allOK;
  }

  public writeToLog(msg: string, level: EnumLogLevel = EnumLogLevel.Debug, params: TypeLogger[] = []) {
    if (this.shouldLog(level)) {
      const date = new Date();
      const text = MachineService.stringFormat(msg, params);
      this.logger = `${date.toLocaleString()} - Type: ${EnumLogLevel[level]} - ${text}`;
      logger.debug(this.logger);
      this.logger$.next(this.logger);
      this.logEntries.push({ id: this.nextLogId++, date, level: EnumLogLevel[level], text, cycle: this.cyclesSignal() });
      // The oldest ones go in groups (not one by one with each new message)
      if (this.logEntries.length > LOG_LIMIT + 500) this.logEntries.splice(0, this.logEntries.length - LOG_LIMIT);
      this.logVersionSignal.update((version) => version + 1);
    }
  }

  /** The messages of the log kept, the oldest first */
  public logHistory(): readonly LogEntry[] {
    return this.logEntries.slice(-LOG_LIMIT);
  }

  public clearLog(): void {
    this.logEntries.length = 0;
    this.logVersionSignal.update((version) => version + 1);
  }

  /** Replaces each {n} of the message with the value of the parameter with index n (objects as JSON) */
  public static stringFormat(msg: string, params: TypeLogger[]): string {
    return msg.replace(/{([0-9]+)}/g, (match: string, index: string) => {
      const logValue = params.find((v) => v.index === Number(index));
      if (logValue === undefined || typeof logValue.value === "undefined") return match;
      if (typeof logValue.value === "object") return JSON.stringify(logValue.value);
      return String(logValue.value);
    });
  }

  private shouldLog(level: EnumLogLevel): boolean {
    return (level >= this.level && level !== EnumLogLevel.Off) || this.level === EnumLogLevel.All;
  }

  public getCode(address: TypeAddress): TypeInstructionsData {
    const code = this.code.get(address);
    if (code === undefined) {
      logger.warn("Not an address of the code: %s", address);
      return DEFAULT_CODE;
    }
    return code;
  }

  public getAllStatusMachine(): TypeStatusMachine {
    return {
      registers: this.registers,
      memory: this.memory.getAllMemory(),
      breakpoints: this.breakpointManager.getAllBreakpoints(),
      statistics: this.dataStatistics.getData(),
    };
  }

  private async toastMessage(key_title: string = "TOAST.LOGIN_FALSE", key_message: string = "TOAST.ACCESS_DENIED"): Promise<void> {
    const message = await firstValueFrom(this.translate.get(key_message));
    const title = await firstValueFrom(this.translate.get(key_title));
    this.toast.info(message, title);
  }

  /** Where it stopped: the line (and the stage, if it is not IF), or the address read or written */
  private async toastBreakpoint(hit: BreakpointHit): Promise<void> {
    const title = await firstValueFrom(this.translate.get("TOAST.TITLE_BREAKPOINT_SIMULATION"));
    const message =
      hit.kind === "line"
        ? await firstValueFrom(
            this.translate.get(hit.stage === "IF" ? "TOAST.MESSAGE_BREAKPOINT_LINE" : "TOAST.MESSAGE_BREAKPOINT_STAGE", hit),
          )
        : await firstValueFrom(
            this.translate.get(hit.kind === "read" ? "TOAST.MESSAGE_WATCH_READ" : "TOAST.MESSAGE_WATCH_WRITE", {
              address: `0x${hit.address.toString(16).toUpperCase().padStart(8, "0")}`,
            }),
          );
    this.toast.info(message, title);
  }

  // The errors are marked on their lines in the editor
  private async toastAssemblyErrors(): Promise<void> {
    const title = await firstValueFrom(this.translate.get("TOAST.TITLE_ASSEMBLY_ERRORS"));
    const message = await firstValueFrom(this.translate.get("TOAST.MESSAGE_ASSEMBLY_ERRORS"));
    this.toast.warning(message, title);
  }

  private async toastProgramError(message: string): Promise<void> {
    const title = await firstValueFrom(this.translate.get("TOAST.TITLE_PROGRAM_ERROR"));
    this.toast.error(message, title);
  }

  private async toastSimulatorError(): Promise<void> {
    const title = await firstValueFrom(this.translate.get("TOAST.TITLE_SIMULATOR_ERROR"));
    const message = await firstValueFrom(this.translate.get("TOAST.MESSAGE_SIMULATOR_ERROR"));
    this.toast.warning(message, title);
  }
}
