// The whole simulation runs here, inside the Web Worker of the simulator (simulator.worker.ts): the requests of the
// protocol (assemble, configure, one cycle, registers, memory, input) and the execution loop, which goes on by itself at
// the chosen pace and stops at the end, at a breakpoint, at an error or when the program waits for input. The page only
// draws the cycles it receives.
import {
  type BreakpointHit,
  type BreakpointStage,
  DLXSimulator,
  type LocalSimulationStep,
  SUPERSCALAR_STAGES,
} from "@core/engine/simulator";

/** A breakpoint of a line that waits for its instruction to reach a stage other than IF (NUC-11) */
export type StageBreakpoint = { line: number; stage: BreakpointStage };

/** A watched piece of memory: the run stops when a load reads it or a store writes it (NUC-11) */
export type Watchpoint = { address: number; bytes: number; read: boolean; write: boolean };

/** What the user changed in a run (an input line, a register, the memory), to repeat it when stepping back (EDU-03) */
export type JournalEntry = { at: number; event: string; payload: string };

export type RunOptions = {
  /** Milliseconds between cycles (0: as fast as possible) */
  delay: number;
  /** Lines of the main file with a breakpoint (when the instruction is fetched, unless `stages` says another stage) */
  breakpoints: number[];
  stages?: StageBreakpoint[];
  watchpoints?: Watchpoint[];
  /** Stops when this many cycles have run (stepping back repeats the run up to a cycle) */
  until?: number;
  /** The changes to make again, each one when `at` cycles have run */
  journal?: JournalEntry[];
};

/** Messages to the simulator */
export type ToSimulator =
  | { kind: "request"; id: number; event: string; payload: string }
  /** Runs cycle after cycle (RunOptions) */
  | ({ kind: "run" } & RunOptions)
  | { kind: "pause" }
  /** A new pace for the run going on */
  | { kind: "speed"; delay: number }
  | { kind: "breakpoints"; lines: number[]; stages?: StageBreakpoint[]; watchpoints?: Watchpoint[] };

export type StopReason = "complete" | "breakpoint" | "input" | "error" | "paused";

/** Messages from the simulator */
export type FromSimulator =
  | { kind: "response"; id: number; result?: string; error?: string }
  /** The cycles run since the last message (one, or several together when running with no delay) */
  | { kind: "steps"; steps: LocalSimulationStep[] }
  | { kind: "stopped"; reason: StopReason };

/** With no delay, the cycles of each message: as many as fit in a frame (and at most this many) */
const MAX_STEPS_PER_MESSAGE = 500;
const FRAME_MS = 16;

const SIZES: Record<string, number> = { Byte: 1, HalfWord: 2, Word: 4, Float: 4, Double: 8 };
const STAGES: Exclude<BreakpointStage, "IF">[] = ["ID", "EX", "MEM", "WB"];

export class SimulationRunner {
  private readonly simulator = new DLXSimulator();
  private breakpoints = new Set<number>();
  private stages = new Map<number, BreakpointStage>();
  private watchpoints: Watchpoint[] = [];
  private until = Number.POSITIVE_INFINITY;
  private journal: JournalEntry[] = [];
  private delay = 0;
  private running = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  /** The rows (instructions) in each stage in the last cycle: a stage breakpoint stops when one arrives */
  private previous = new Map<BreakpointStage, Set<number>>();

  constructor(private readonly emit: (message: FromSimulator) => void) {}

  public handle(message: ToSimulator): void {
    switch (message.kind) {
      case "request":
        try {
          this.emit({ kind: "response", id: message.id, result: this.request(message.event, message.payload) });
        } catch (error) {
          this.emit({ kind: "response", id: message.id, error: error instanceof Error ? error.message : String(error) });
        }
        break;
      case "run":
        this.setBreakpoints(message.breakpoints, message.stages, message.watchpoints);
        this.until = message.until ?? Number.POSITIVE_INFINITY;
        this.journal = [...(message.journal ?? [])].sort((a, b) => a.at - b.at);
        this.start(Math.max(0, message.delay));
        break;
      case "pause":
        if (this.running) this.stop("paused");
        break;
      case "speed":
        this.delay = Math.max(0, message.delay);
        break;
      case "breakpoints":
        this.setBreakpoints(message.lines, message.stages, message.watchpoints);
        break;
    }
  }

  private request(event: string, payload: string): string {
    // A program loaded again (or a new configuration): its instructions start again from the first row
    if (event === "SimulationInitRequest" || event === "UpdateConfigurationMachineRequest") this.previous.clear();
    if (event !== "SimulationNextStepRequest") return this.simulator.handle(event, payload);
    // One cycle by hand: the stages are followed too, so a run that starts afterwards knows where each instruction was
    const step = this.simulator.step();
    this.hitOf(step);
    this.simulator.attachSnapshot(step);
    return JSON.stringify(step);
  }

  private setBreakpoints(lines: number[], stages: StageBreakpoint[] = [], watchpoints: Watchpoint[] = []): void {
    this.breakpoints = new Set(lines);
    this.stages = new Map(stages.map(({ line, stage }) => [line, stage]));
    this.watchpoints = watchpoints;
  }

  /** The changes of the journal made when this many cycles had run. Returns whether there were any */
  private applyJournal(): boolean {
    let applied = false;
    while (this.journal.length > 0 && this.journal[0].at <= this.simulator.cycles) {
      const entry = this.journal.shift() as JournalEntry;
      this.simulator.handle(entry.event, entry.payload);
      applied = true;
    }
    return applied;
  }

  /** One cycle, with the breakpoint it reached, if any */
  private step(): LocalSimulationStep {
    this.applyJournal();
    const step = this.simulator.step();
    const hit = this.hitOf(step);
    if (hit !== null) {
      step.isBreakpoint = true;
      step.hit = hit;
    }
    return step;
  }

  private hitOf(step: LocalSimulationStep): BreakpointHit | null {
    if (step.superscalar) return this.superscalarHit(step) ?? this.watchpointHit(step);
    // A line: when its instruction is fetched (IF), or when it arrives at the stage of its breakpoint
    if (step.isNewInstruction && this.breakpoints.has(step.line) && (this.stages.get(step.line) ?? "IF") === "IF") {
      return { kind: "line", line: step.line, stage: "IF" };
    }
    let hit: BreakpointHit | null = null;
    for (const stage of STAGES) {
      const cells =
        stage === "EX"
          ? [step.pipeline.intEX, ...step.pipeline.faddEX, ...step.pipeline.fmultEX, ...step.pipeline.fdivEX]
          : [step.pipeline[stage]];
      const rows = new Set<number>();
      for (const cell of cells) {
        if (cell.draw === false || (cell.address as string) === "") continue;
        rows.add(cell.addressRow);
        if (hit !== null || this.previous.get(stage)?.has(cell.addressRow)) continue;
        const line = this.simulator.lineOf(Number.parseInt(cell.address, 16));
        if (this.breakpoints.has(line) && this.stages.get(line) === stage) hit = { kind: "line", line, stage };
      }
      this.previous.set(stage, rows);
    }
    if (hit !== null) return hit;
    return this.watchpointHit(step);
  }

  /**
   * SuperDLX: a line, when one of its instructions is fetched, decoded, issued, accesses the memory or commits (IF, ID,
   * EX, MEM and WB, the stages of DLX the breakpoints name). Several instructions do it in the same cycle
   */
  private superscalarHit(step: LocalSimulationStep): BreakpointHit | null {
    if (this.breakpoints.size === 0) return null;
    for (const event of step.superscalar?.events ?? []) {
      const stage = SUPERSCALAR_STAGES[event.kind];
      if (stage === undefined) continue;
      const line = this.simulator.lineOf(event.pc);
      if (this.breakpoints.has(line) && (this.stages.get(line) ?? "IF") === stage) return { kind: "line", line, stage };
    }
    return null;
  }

  /** A watched address: written by a store, or read by a load */
  private watchpointHit(step: LocalSimulationStep): BreakpointHit | null {
    const overlaps = (address: number, bytes: number, watch: Watchpoint) =>
      address < watch.address + watch.bytes && watch.address < address + bytes;
    for (const watch of this.watchpoints) {
      if (watch.write) {
        const written = step.memory.find((change) => overlaps(Number.parseInt(change.address, 16), SIZES[change.typeData] ?? 4, watch));
        if (written) return { kind: "write", address: Number.parseInt(written.address, 16) };
      }
      if (watch.read) {
        const read = step.reads?.find((access) => overlaps(access.address, access.bytes, watch));
        if (read) return { kind: "read", address: read.address };
      }
    }
    return null;
  }

  private static stopReason(step: LocalSimulationStep): StopReason | null {
    if (step.error) return "error";
    if (step.isComplete) return "complete";
    if (step.waitingForInput) return "input";
    if (step.isBreakpoint) return "breakpoint";
    return null;
  }

  private start(delay: number): void {
    if (this.running) return;
    this.running = true;
    this.delay = delay;
    const loop = () => {
      this.timer = null;
      if (!this.running) return;
      const started = Date.now();
      const steps: LocalSimulationStep[] = [];
      let reason: StopReason | null = this.simulator.cycles >= this.until ? "paused" : null;
      while (reason === null) {
        const step = this.step();
        steps.push(step);
        reason = SimulationRunner.stopReason(step) ?? (this.simulator.cycles >= this.until ? "paused" : null);
        // Repeating a run: the input it waits for is in the journal
        if (reason === "input" && this.applyJournal()) reason = this.simulator.cycles >= this.until ? "paused" : null;
        if (this.delay > 0 || steps.length >= MAX_STEPS_PER_MESSAGE || Date.now() - started >= FRAME_MS) break;
      }
      // The page draws the last cycle of the message: it takes the whole machine (SuperDLX)
      if (steps.length > 0) {
        this.simulator.attachSnapshot(steps[steps.length - 1]);
        this.emit({ kind: "steps", steps });
      }
      // Repeating a run up to a cycle: the changes made at that point are part of it
      if (reason === "paused" && this.simulator.cycles >= this.until) this.applyJournal();
      if (reason !== null) {
        this.stop(reason);
        return;
      }
      this.timer = setTimeout(loop, Math.max(0, this.delay - (Date.now() - started)));
    };
    loop();
  }

  private stop(reason: StopReason): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    this.running = false;
    this.emit({ kind: "stopped", reason });
  }
}
