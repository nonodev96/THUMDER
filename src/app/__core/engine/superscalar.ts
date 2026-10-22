// SuperDLX: a superscalar DLX with out of order execution and in order commit, as the SuperDLX simulator (McGill
// University, 1993) and WinSuperDLX (Universidad de Granada, 2002) describe it. Written for THUMDER from that model
// (docs/superdlx.md): no code of those programs is used. What each instruction computes is in cpu.ts, as for DLX, so a
// program ends with the same registers and memory in both architectures: only the cycles change.
//
// Each cycle runs the stages from the last one to the first, so that what a stage produces is used by the next one in
// the next cycle:
//
// 1. Commit: from the head of each reorder buffer (ROB), in order, up to `commit` per buffer. The registers are written
//    here. A store is released to be written in memory; a trap runs when it is the oldest instruction of the machine.
// 2. Write back: the instructions whose unit finishes in this cycle have their result: the ones that wait for it can
//    start in this same cycle. A load has its address, and goes to the memory.
// 3. Memory: the loads, in order, read the memory if no older store may write the same bytes; then the stores released
//    are written, in order, with the accesses left.
// 4. Issue: from each instruction window, the oldest instructions with their operands go to a free unit. A branch is
//    resolved here: if the prediction was wrong, everything after it is squashed and fetch goes on in the next cycle.
// 5. Decode: up to `decode` instructions from the queue go to their window and their ROB, with their registers renamed
//    (the operand is the ROB entry that will produce it, or the value of the register).
// 6. Fetch: up to `fetch` instructions to the queue, following the prediction of the branch target buffer (BTB).
import {
  accessMemory,
  destination,
  type Execution,
  execute,
  Memory,
  type Operands,
  Registers,
  readOperands,
  SimulationError,
} from "@core/engine/cpu";
import { type Decoded, decode, type RegisterUse, registerUse } from "@core/engine/isa";
import type { MemoryChange, MemoryRead, RegisterChange } from "@core/engine/pipeline";
import {
  POOL_KEYS,
  type PoolKey,
  SIDES,
  type Side,
  type SuperscalarConfig,
  type UnitSpec,
  unitSpec,
} from "@core/engine/superscalar-config";
import { type ProgramIO, runTrap, type TrapIO } from "@core/engine/traps";

/** What an instruction is for the machine */
export type OpKind = "alu" | "load" | "store" | "branch" | "jump" | "jreg" | "trap" | "nop" | "invalid";

export type OpInfo = { side: Side; pool: PoolKey | null; kind: OpKind };

const SHIFTS = new Set(["SLL", "SRL", "SRA", "SLLI", "SRLI", "SRAI", "LHI"]);
const SETS = /^S(EQ|NE|LT|GT|LE|GE)U?I?$/;

/**
 * The half of the machine and the unit of an instruction (SuperDLX). The half is the one of the register it writes: the
 * integer multiplications and divisions of WinDLX (on integer registers) are integer instructions that use the floating
 * point multiplier and divider, as in DLX
 */
export function classify(decoded: Decoded | null): OpInfo {
  if (decoded === null) return { side: "int", pool: null, kind: "invalid" };
  const m = decoded.def.mnemonic;
  switch (decoded.def.syntax) {
    case "none":
      return m === "NOP" ? { side: "int", pool: null, kind: "nop" } : { side: "int", pool: "int.alu", kind: "alu" };
    case "rrr":
      if (m === "MULT" || m === "MULTU") return { side: "int", pool: "fp.mult", kind: "alu" };
      if (m === "DIV" || m === "DIVU") return { side: "int", pool: "fp.div", kind: "alu" };
      return { side: "int", pool: SHIFTS.has(m) ? "int.shift" : SETS.test(m) ? "int.comp" : "int.alu", kind: "alu" };
    case "rri":
    case "ri":
      return { side: "int", pool: SHIFTS.has(m) ? "int.shift" : SETS.test(m) ? "int.comp" : "int.alu", kind: "alu" };
    case "load":
      return { side: "int", pool: "int.address", kind: "load" };
    case "store":
      return { side: "int", pool: "int.address", kind: "store" };
    case "fload":
      return { side: "fp", pool: "fp.address", kind: "load" };
    case "fstore":
      return { side: "fp", pool: "fp.address", kind: "store" };
    case "branch":
      return { side: "int", pool: "int.branch", kind: "branch" };
    case "fbranch":
      return { side: "fp", pool: "fp.branch", kind: "branch" };
    case "jump":
      return { side: "int", pool: "int.branch", kind: "jump" };
    case "jreg":
      return { side: "int", pool: "int.branch", kind: "jreg" };
    case "trap":
      return { side: "int", pool: null, kind: "trap" };
    case "fff":
      return { side: "fp", pool: m.startsWith("MULT") ? "fp.mult" : m.startsWith("DIV") ? "fp.div" : "fp.add", kind: "alu" };
    case "ff":
      return { side: "fp", pool: m.startsWith("CVT") ? "fp.conv" : "fp.add", kind: "alu" };
    case "fcmp":
      return { side: "fp", pool: "fp.comp", kind: "alu" };
    case "fr":
      return { side: "fp", pool: "fp.add", kind: "alu" };
    case "rf":
      return { side: "int", pool: "int.alu", kind: "alu" };
  }
}

/** Where an instruction is */
export type OpState = "fetched" | "queue" | "window" | "executing" | "address" | "memory" | "done" | "committed" | "squashed";

/** A register an instruction reads: the instruction that produces it (renamed) or, without one, its value at decode */
type Source = { file: "int" | "fp" | "fpsr"; register: number; producer: Op | null; value: number };

/** The prediction made at fetch: taken or not, with the entry of the BTB */
type Prediction = { taken: boolean; target: number; index: number };

/** An instruction in flight: from fetch to commit (or until it is squashed) */
export class Op {
  public readonly decoded: Decoded | null;
  public readonly info: OpInfo;
  public readonly use: RegisterUse;
  public state: OpState = "fetched";
  /** The registers it needs to start (for a store, only the base of the address) */
  public sources: Source[] = [];
  /** The registers of the data a store writes: they may arrive after the address */
  public data: Source[] = [];
  public execution?: Execution;
  public result: Pick<Execution, "value" | "fpValue" | "fpsr"> = {};
  /** The ones that wait for its result can take it */
  public valueReady = false;
  /** It has finished: it commits when it reaches the head of its ROB */
  public done = false;
  /** The cycle its unit (or its memory access) finishes */
  public readyCycle = Number.POSITIVE_INFINITY;
  public pool: PoolKey | null;
  public unit = -1;
  /** An error of the program (bad address, division by zero...): it stops the simulation when it commits */
  public error?: string;
  public prediction: Prediction | null = null;
  /** Branches and jumps: the outcome is known */
  public resolved = false;
  public taken = false;
  public mispredicted = false;
  /** Stores: committed, waiting to be written in memory */
  public released = false;
  /** Loads: waited at least once for an older store */
  public blocked = false;
  /** Traps: they have run (their result is in R1) */
  public trapRun = false;
  public robSlot = -1;
  /** The cycles of its events, for the diagram */
  public readonly cycles: {
    fetch: number;
    dispatch?: number;
    issue?: number;
    memory?: number;
    complete?: number;
    commit?: number;
    squash?: number;
  };

  constructor(
    public readonly row: number,
    public readonly pc: number,
    public readonly word: number,
    cycle: number,
  ) {
    this.decoded = decode(word);
    this.info = classify(this.decoded);
    this.pool = this.info.pool;
    this.use = this.decoded
      ? registerUse(this.decoded)
      : { intReads: [], fpReads: [], intWrites: [], fpWrites: [], readsFPSR: false, writesFPSR: false };
    this.cycles = { fetch: cycle };
  }

  public get isControl(): boolean {
    return this.info.kind === "branch" || this.info.kind === "jump" || this.info.kind === "jreg";
  }

  public writes(file: Source["file"], register: number): boolean {
    if (file === "int") return this.use.intWrites.includes(register);
    if (file === "fp") return this.use.fpWrites.includes(register);
    return this.use.writesFPSR;
  }

  /** The value of a register it writes, once it has its result */
  public valueOf(file: Source["file"], register: number): number {
    if (file === "int") return (this.result.value ?? 0) | 0;
    if (file === "fpsr") return this.result.fpsr ?? 0;
    const target = this.decoded ? destination(this.decoded) : null;
    const offset = target?.kind === "fp" ? register - target.register : 0;
    return (this.result.fpValue?.[offset] ?? 0) >>> 0;
  }

  /** The register it writes, as the views name it: R3, F2 (a double: F2-F3), FPSR or nothing */
  public get destinationName(): string {
    const target = this.decoded ? destination(this.decoded) : null;
    if (target === null) return "";
    if (target.kind === "int") return `R${target.register}`;
    if (target.kind === "fpsr") return "FPSR";
    return target.words === 2 ? `F${target.register}-F${target.register + 1}` : `F${target.register}`;
  }
}

/** A reorder buffer: a circular buffer of `size` entries, the oldest at the head */
class ReorderBuffer {
  public readonly entries: Op[] = [];
  /** The entry of the oldest instruction */
  public head = 0;

  constructor(public readonly size: number) {}

  public get full(): boolean {
    return this.entries.length >= this.size;
  }

  public push(op: Op): void {
    op.robSlot = (this.head + this.entries.length) % this.size;
    this.entries.push(op);
  }

  public shift(): Op | undefined {
    const op = this.entries.shift();
    if (op) this.head = (this.head + 1) % this.size;
    return op;
  }

  /** Removes the instructions younger than `row` (always the last ones) and returns them */
  public squashAfter(row: number): Op[] {
    const index = this.entries.findIndex((op) => op.row > row);
    return index < 0 ? [] : this.entries.splice(index);
  }
}

type Pool = { spec: UnitSpec; slots: (Op | null)[] };

/** An entry of the branch target buffer: the branch, its target and its 2-bit counter (0 and 1 not taken, 2 and 3 taken) */
export type BtbEntry = { pc: number; target: number; state: number };

/** Why fetch does not fetch in a cycle */
export type FetchStall = "queueFull" | "branch" | "jreg" | "halt" | "fault" | "recovery";
/** Why decode sends no instruction in a cycle */
export type DispatchStall = "queueEmpty" | "robInt" | "robFp" | "windowInt" | "windowFp" | "loadBuffer" | "storeBuffer";
/** Why nothing commits in a cycle with instructions in the ROBs */
export type CommitStall = "notDone" | "order" | "storeData" | "trap" | "input";

const FETCH_STALLS: FetchStall[] = ["queueFull", "branch", "jreg", "halt", "fault", "recovery"];
const DISPATCH_STALLS: DispatchStall[] = ["queueEmpty", "robInt", "robFp", "windowInt", "windowFp", "loadBuffer", "storeBuffer"];
const COMMIT_STALLS: CommitStall[] = ["notDone", "order", "storeData", "trap", "input"];

export type SuperscalarStats = {
  cycles: number;
  /** Instructions committed */
  instructions: number;
  fetched: number;
  dispatched: number;
  issued: number;
  /** Instructions squashed after a misprediction */
  squashed: number;
  recoveries: number;
  branches: number;
  taken: number;
  mispredicted: number;
  btbMisses: number;
  btbCollisions: number;
  jumps: number;
  loads: number;
  stores: number;
  /** Loads that waited for an older store */
  blockedLoads: number;
  traps: number;
  /** Instructions committed by kind of unit */
  byPool: Record<PoolKey, number>;
  /** Cycles with n instructions fetched, decoded, issued and committed (n is the index) */
  fetchHistogram: number[];
  dispatchHistogram: number[];
  issueHistogram: number[];
  commitHistogram: number[];
  fetchStalls: Record<FetchStall, number>;
  dispatchStalls: Record<DispatchStall, number>;
  commitStalls: Record<CommitStall, number>;
  /** Cycles that the instructions of the windows waited for their operands, and for a free unit */
  waitOperands: number;
  waitUnit: number;
  /** Cycles each kind of unit was busy (one per unit and cycle) */
  unitBusy: Record<PoolKey, number>;
  /** The occupation of each structure, added cycle after cycle (divided by the cycles, the mean) */
  occupancy: { queue: number; robInt: number; robFp: number; windowInt: number; windowFp: number; loadBuffer: number; storeBuffer: number };
};

/** An event of an instruction in a cycle: fetched, decoded, issued, memory access, result, commit or squashed */
export type OpEventKind = "F" | "D" | "I" | "M" | "W" | "C" | "X";
export type OpEvent = { op: Op; kind: OpEventKind };

export type SuperscalarReport = {
  cycle: number;
  events: OpEvent[];
  /** The instructions fetched in this cycle */
  fetched: Op[];
  registers: RegisterChange[];
  memory: MemoryChange[];
  reads: MemoryRead[];
  output: string;
  io: TrapIO[];
  waitingForInput: boolean;
  halted: boolean;
  error?: string;
};

// ─── The state of the machine for the views (JSON) ─────────────────────────────────────────────────────────────────────

export type SnapshotOp = { row: number; pc: number };
/** An operand: its register, whether it is ready and, if not, the instruction (row) and the ROB entry that produce it */
export type SnapshotSource = { name: string; ready: boolean; row?: number; side?: Side; slot?: number };
export type SnapshotWindowEntry = SnapshotOp & { pool: PoolKey | null; sources: SnapshotSource[]; waiting: "operands" | "unit" | null };
export type SnapshotRobEntry = SnapshotOp & {
  slot: number;
  dest: string;
  state: OpState;
  /** The result, when it has it (hexadecimal) */
  value?: string;
  error?: string;
  /** Branches: predicted taken or not, and whether the prediction was wrong */
  predicted?: boolean;
  mispredicted?: boolean;
};
export type SnapshotBufferEntry = SnapshotOp & {
  /** The address, once it is computed */
  address?: number;
  bytes?: number;
  state: "address" | "waiting" | "blocked" | "memory" | "ready" | "released";
  /** Stores: the data to write is ready */
  data?: boolean;
};
export type SnapshotUnit = { pool: PoolKey; latency: number; slots: ({ row: number; pc: number; left: number } | null)[] };
export type SnapshotBtbEntry = { index: number; pc: number; target: number; state: number };
export type SnapshotRename = { register: string; row: number; side: Side; slot: number; ready: boolean };

export type SuperscalarSnapshot = {
  cycle: number;
  /** The address of the next instruction to fetch, and why fetch is stopped */
  pc: number;
  fetchStop: FetchStall | null;
  sizes: { queue: number; rob: Record<Side, number>; window: Record<Side, number>; loadBuffer: number; storeBuffer: number; btb: number };
  queue: SnapshotOp[];
  windows: Record<Side, SnapshotWindowEntry[]>;
  rob: Record<Side, { head: number; entries: SnapshotRobEntry[] }>;
  loadBuffer: SnapshotBufferEntry[];
  storeBuffer: SnapshotBufferEntry[];
  units: SnapshotUnit[];
  btb: SnapshotBtbEntry[];
  /** The registers renamed: the youngest instruction of the ROBs that will write each one */
  rename: SnapshotRename[];
};

const hexWord = (value: number) => `0x${(value >>> 0).toString(16).toUpperCase().padStart(8, "0")}`;

const zeros = <K extends string>(keys: readonly K[]) => Object.fromEntries(keys.map((key) => [key, 0])) as Record<K, number>;

export class Superscalar {
  public readonly registers = new Registers();
  public readonly memory: Memory;
  public cycle = -1;
  public complete = false;
  public readonly stats: SuperscalarStats;

  private pc: number;
  private nextRow = 0;
  private queue: Op[] = [];
  private readonly rob: Record<Side, ReorderBuffer>;
  private readonly window: Record<Side, Op[]> = { int: [], fp: [] };
  private loads: Op[] = [];
  private stores: Op[] = [];
  private readonly pools = new Map<PoolKey, Pool>();
  /** The instructions in a unit or in a memory access, with the cycle they finish */
  private executing: Op[] = [];
  /** NOP and J are done in fetch: they commit when every older instruction has committed */
  private retiredAtFetch: Op[] = [];
  private readonly btb: (BtbEntry | null)[];
  private fetchStop: FetchStall | null = null;
  /** Why fetch did not fetch in the last cycle */
  private fetchStatus: FetchStall | null = null;
  private fetchFault = "";
  /** After a misprediction (or a branch or a jump resolved in issue), fetch goes on in this cycle */
  private resumeCycle = 0;
  /** Why fetch waits until `resumeCycle` */
  private resumeReason: FetchStall = "recovery";
  private report!: SuperscalarReport;
  private changes = new Map<string, RegisterChange>();

  constructor(
    public readonly config: SuperscalarConfig,
    program: Uint8Array,
    start: number,
    private readonly io: ProgramIO,
  ) {
    this.memory = new Memory(config.memorySize);
    this.memory.bytes.set(program.subarray(0, config.memorySize));
    this.pc = start >>> 0;
    this.registers.PC = this.pc;
    this.rob = { int: new ReorderBuffer(config.rob.int), fp: new ReorderBuffer(config.rob.fp) };
    for (const key of POOL_KEYS) {
      const spec = unitSpec(config, key);
      this.pools.set(key, { spec, slots: new Array(spec.count).fill(null) });
    }
    this.btb = new Array(config.btb).fill(null);
    this.stats = {
      cycles: 0,
      instructions: 0,
      fetched: 0,
      dispatched: 0,
      issued: 0,
      squashed: 0,
      recoveries: 0,
      branches: 0,
      taken: 0,
      mispredicted: 0,
      btbMisses: 0,
      btbCollisions: 0,
      jumps: 0,
      loads: 0,
      stores: 0,
      blockedLoads: 0,
      traps: 0,
      byPool: zeros(POOL_KEYS),
      fetchHistogram: new Array(config.fetch + 1).fill(0),
      dispatchHistogram: new Array(config.decode + 1).fill(0),
      issueHistogram: [0],
      commitHistogram: new Array(2 * config.commit + 1).fill(0),
      fetchStalls: zeros(FETCH_STALLS),
      dispatchStalls: zeros(DISPATCH_STALLS),
      commitStalls: zeros(COMMIT_STALLS),
      waitOperands: 0,
      waitUnit: 0,
      unitBusy: zeros(POOL_KEYS),
      occupancy: { queue: 0, robInt: 0, robFp: 0, windowInt: 0, windowFp: 0, loadBuffer: 0, storeBuffer: 0 },
    };
  }

  /** The address of the next instruction to fetch */
  public get nextPC(): number {
    return this.pc;
  }

  public set nextPC(address: number) {
    this.pc = address >>> 0;
    this.registers.PC = this.pc;
    this.changes.set("PC", { kind: "control", name: "PC", value: this.pc });
  }

  /** The instructions between fetch and commit */
  public get inFlight(): number {
    return this.queue.length + this.rob.int.entries.length + this.rob.fp.entries.length + this.retiredAtFetch.length;
  }

  /** Advances one clock cycle */
  public tick(): SuperscalarReport {
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
      events: [],
      fetched: [],
      registers: [],
      memory: [],
      reads: [],
      output: "",
      io: [],
      waitingForInput: false,
      halted: false,
    };
    const pcBefore = this.pc;
    try {
      this.commitStage(k, io);
      if (!this.complete) {
        this.writeBackStage(k);
        this.memoryStage(k);
        this.issueStage(k);
        this.dispatchStage(k);
        this.fetchStage(k);
        // A fetch that cannot go on (an address out of memory) is an error when everything before it has committed
        if (this.fetchStop === "fault" && this.inFlight === 0) throw new SimulationError(this.fetchFault);
      }
    } catch (error) {
      if (!(error instanceof SimulationError)) throw error;
      this.report.error = error.message;
      this.complete = true;
    }
    if (this.pc !== pcBefore) this.nextPC = this.pc;
    this.countCycle();
    this.report.output = output.text;
    this.report.registers = [...this.changes.values()];
    this.stats.cycles = k + 1;
    return this.report;
  }

  // ─── Commit ───────────────────────────────────────────────────────────────────────────────────────────────────────

  private commitStage(k: number, io: ProgramIO): void {
    let total = 0;
    let stall: CommitStall | null = null;
    for (const side of SIDES) {
      if (this.complete) break;
      const rob = this.rob[side];
      const other = this.rob[side === "int" ? "fp" : "int"];
      let count = 0;
      let reason: CommitStall | null = null;
      while (count < this.config.commit && rob.entries.length > 0) {
        const op = rob.entries[0];
        if (!op.done) {
          reason = "notDone";
          break;
        }
        // The other ROB may hold an older branch not resolved yet, an older trap or an older error
        if (this.waitsForOther(op, other)) {
          reason = "order";
          break;
        }
        if (op.error !== undefined) throw new SimulationError(op.error);
        if (op.info.kind === "store" && !op.released) {
          if (!op.data.every((source) => source.producer === null || source.producer.valueReady)) {
            reason = "storeData";
            break;
          }
          this.release(op);
        }
        if (op.info.kind === "trap" && !op.trapRun) {
          if (!this.canRunTrap(op, other)) {
            reason = "trap";
            break;
          }
          if (!this.runTrapOf(op, io)) {
            reason = "input";
            break;
          }
          // Its result goes to R1 in the next cycle (SuperDLX); the trap 0 ends the program now
          if (!this.complete) break;
        }
        this.commit(op, side, k);
        count++;
        if (this.complete) break;
      }
      total += count;
      if (stall === null && count === 0 && rob.entries.length > 0) stall = reason;
    }
    // NOP and J commit when every instruction before them has
    if (!this.complete) this.retireUpTo(this.oldestInFlight(), k);
    this.stats.commitHistogram[total]++;
    if (total === 0 && stall !== null) this.stats.commitStalls[stall]++;
  }

  private waitsForOther(op: Op, other: ReorderBuffer): boolean {
    for (const older of other.entries) {
      if (older.row > op.row) break;
      if (older.isControl && !older.resolved) return true;
      if ((older.info.kind === "trap" && !older.trapRun) || (older.done && older.error !== undefined)) return true;
    }
    return false;
  }

  /** A trap runs when it is the oldest instruction of the machine and the stores before it are in memory */
  private canRunTrap(op: Op, other: ReorderBuffer): boolean {
    return (other.entries[0]?.row ?? Number.POSITIVE_INFINITY) > op.row && (this.stores[0]?.row ?? Number.POSITIVE_INFINITY) > op.row;
  }

  /** Runs a trap with the registers and the memory committed; false if it waits for a line of input */
  private runTrapOf(op: Op, io: ProgramIO): boolean {
    const number = op.decoded?.offset ?? 0;
    const recorded: ProgramIO = {
      write: (text, descriptor) => {
        this.report.io.push({ trap: number, descriptor, text });
        io.write(text, descriptor);
      },
      readLine: () => io.readLine(),
    };
    const trap = runTrap(number, this.registers, this.memory, recorded);
    if (trap.read !== undefined) this.report.io.push({ trap: number, descriptor: 0, text: trap.read });
    if (trap.waitingForInput) {
      this.report.waitingForInput = true;
      return false;
    }
    op.result = { value: trap.r1 ?? this.registers.R[1] };
    op.valueReady = true;
    op.trapRun = true;
    if (trap.halt) {
      this.complete = true;
      this.report.halted = true;
    }
    return true;
  }

  private commit(op: Op, side: Side, k: number): void {
    this.retireUpTo(op.row, k);
    this.rob[side].shift();
    const decoded = op.decoded;
    if (decoded !== null) {
      const target = destination(decoded);
      if (target?.kind === "int" && op.result.value !== undefined) {
        this.registers.setR(target.register, op.result.value);
        if (target.register !== 0) {
          this.changes.set(`R${target.register}`, { kind: "int", name: `R${target.register}`, value: this.registers.R[target.register] });
        }
      }
      if (target?.kind === "fp" && op.result.fpValue) {
        for (let i = 0; i < target.words; i++) {
          const register = target.register + i;
          this.registers.F[register] = op.result.fpValue[i] >>> 0;
          this.changes.set(`F${register}`, { kind: "fp", name: `F${register}`, value: this.registers.F[register] });
        }
      }
      if (target?.kind === "fpsr" && op.result.fpsr !== undefined) {
        this.registers.FPSR = op.result.fpsr;
        this.changes.set("FPSR", { kind: "control", name: "FPSR", value: this.registers.FPSR });
      }
    }
    this.committed(op, k);
  }

  /** What an instruction counts when it commits */
  private committed(op: Op, k: number): void {
    op.state = "committed";
    op.cycles.commit = k;
    this.event(op, "C");
    const stats = this.stats;
    stats.instructions++;
    if (op.pool) stats.byPool[op.pool]++;
    switch (op.info.kind) {
      case "branch":
        stats.branches++;
        if (op.taken) stats.taken++;
        if (op.mispredicted) stats.mispredicted++;
        break;
      case "jump":
      case "jreg":
        stats.jumps++;
        break;
      case "load":
        stats.loads++;
        if (op.blocked) stats.blockedLoads++;
        break;
      case "store":
        stats.stores++;
        break;
      case "trap":
        stats.traps++;
        break;
    }
  }

  private oldestInFlight(): number {
    return Math.min(this.rob.int.entries[0]?.row ?? Infinity, this.rob.fp.entries[0]?.row ?? Infinity, this.queue[0]?.row ?? Infinity);
  }

  /** The NOP and J older than `row` commit */
  private retireUpTo(row: number, k: number): void {
    while (this.retiredAtFetch.length > 0 && this.retiredAtFetch[0].row < row) {
      this.committed(this.retiredAtFetch.shift() as Op, k);
    }
  }

  /** A store reaches the head of its ROB with its data: it is released, to be written in memory in order */
  private release(op: Op): void {
    const execution = execute(op.decoded as Decoded, this.operands(op, [...op.sources, ...op.data]), op.pc);
    op.execution = execution;
    op.released = true;
  }

  // ─── Write back ───────────────────────────────────────────────────────────────────────────────────────────────────

  private writeBackStage(k: number): void {
    const finished = this.executing.filter((op) => op.readyCycle === k);
    if (finished.length === 0) return;
    this.executing = this.executing.filter((op) => op.readyCycle !== k);
    for (const op of finished) {
      this.freeUnit(op);
      if (op.state === "executing" && op.info.kind === "load" && op.error === undefined) {
        // The address is ready: the load waits in the load buffer for the memory
        op.state = "address";
        continue;
      }
      op.state = "done";
      op.done = true;
      if (op.info.kind !== "trap") op.valueReady = true;
      op.cycles.complete = k;
      this.event(op, "W");
    }
  }

  private freeUnit(op: Op): void {
    if (op.pool === null || op.unit < 0) return;
    const pool = this.pools.get(op.pool) as Pool;
    if (pool.slots[op.unit] === op) pool.slots[op.unit] = null;
    op.unit = -1;
  }

  // ─── Memory ───────────────────────────────────────────────────────────────────────────────────────────────────────

  private memoryStage(k: number): void {
    const max = this.config.memory.accesses;
    let accesses = 0;
    // The loads, the oldest first: one whose address is not known yet stops the younger ones (SuperDLX)
    for (const load of [...this.loads]) {
      if (accesses >= max) break;
      if (load.state === "window" || load.state === "executing") break;
      if (load.state !== "address") continue;
      if (this.mustWait(load)) {
        load.blocked = true;
        continue;
      }
      accesses++;
      const access = load.execution?.memory as NonNullable<Execution["memory"]>;
      try {
        load.result = accessMemory(load.execution as Execution, this.memory);
      } catch (error) {
        if (!(error instanceof SimulationError)) throw error;
        load.error = error.message;
      }
      this.report.reads.push({ address: access.address, bytes: access.bytes });
      load.state = "memory";
      load.cycles.memory = k;
      load.readyCycle = k + this.config.memory.latency;
      this.executing.push(load);
      this.loads = this.loads.filter((other) => other !== load);
      this.event(load, "M");
    }
    // The stores released, in order, with the accesses left
    while (accesses < max && this.stores.length > 0 && this.stores[0].released) {
      const store = this.stores.shift() as Op;
      accesses++;
      const access = store.execution?.memory as NonNullable<Execution["memory"]>;
      accessMemory(store.execution as Execution, this.memory);
      this.report.memory.push({
        address: access.address,
        bytes: access.bytes,
        floating: access.floating === true,
        words: access.store ?? [],
      });
      store.cycles.memory = k;
      this.event(store, "M");
    }
  }

  /**
   * A load waits while an older store may write some of its bytes (its address is not known yet, or it is the same),
   * and while an older trap has not run (the trap 3 writes in memory). SuperDLX does not forward the data of a store to
   * a load: the load reads the memory once the store has written it
   */
  private mustWait(load: Op): boolean {
    const access = load.execution?.memory as NonNullable<Execution["memory"]>;
    for (const store of this.stores) {
      if (store.row > load.row) break;
      const other = store.execution?.memory;
      if (!other || store.state === "window" || store.state === "executing") return true;
      if (access.address < other.address + other.bytes && other.address < access.address + access.bytes) return true;
    }
    return this.rob.int.entries.some((op) => op.info.kind === "trap" && !op.trapRun && op.row < load.row);
  }

  // ─── Issue ────────────────────────────────────────────────────────────────────────────────────────────────────────

  private issueStage(k: number): void {
    let issued = 0;
    for (const side of SIDES) {
      for (const op of [...this.window[side]]) {
        if (op.state !== "window") continue;
        if (!op.sources.every((source) => source.producer === null || source.producer.valueReady)) {
          this.stats.waitOperands++;
          continue;
        }
        if (op.info.kind === "trap") {
          op.readyCycle = k + 1;
        } else {
          const pool = this.pools.get(op.pool as PoolKey) as Pool;
          const free = pool.slots.indexOf(null);
          if (free < 0) {
            this.stats.waitUnit++;
            continue;
          }
          pool.slots[free] = op;
          op.unit = free;
          op.readyCycle = k + pool.spec.latency;
        }
        this.window[side] = this.window[side].filter((other) => other !== op);
        op.state = "executing";
        op.cycles.issue = k;
        this.executing.push(op);
        this.event(op, "I");
        issued++;
        this.start(op, k);
      }
    }
    this.stats.issued += issued;
    while (this.stats.issueHistogram.length <= issued) this.stats.issueHistogram.push(0);
    this.stats.issueHistogram[issued]++;
  }

  /** What an instruction does when it starts in its unit: its result, its address, or the outcome of a branch */
  private start(op: Op, k: number): void {
    if (op.info.kind === "trap") return;
    const decoded = op.decoded as Decoded;
    let execution: Execution;
    try {
      execution = execute(decoded, this.operands(op, op.sources), op.pc);
    } catch (error) {
      if (!(error instanceof SimulationError)) throw error;
      op.error = error.message;
      return;
    }
    op.execution = execution;
    switch (op.info.kind) {
      case "load":
      case "store": {
        const access = execution.memory as NonNullable<Execution["memory"]>;
        try {
          this.memory.check(access.address, access.bytes);
        } catch (error) {
          if (!(error instanceof SimulationError)) throw error;
          op.error = error.message;
        }
        return;
      }
      case "branch":
        this.resolveBranch(op, execution.branch as NonNullable<Execution["branch"]>, k);
        return;
      case "jreg":
        op.result = { value: execution.value };
        if (!op.resolved) this.resolveJump(op, (execution.branch as NonNullable<Execution["branch"]>).target, k + 1);
        return;
      default:
        op.result = { value: execution.value, fpValue: execution.fpValue, fpsr: execution.fpsr };
    }
  }

  private resolveBranch(op: Op, branch: NonNullable<Execution["branch"]>, k: number): void {
    op.resolved = true;
    op.taken = branch.taken;
    const actual = branch.taken ? branch.target : (op.pc + 4) >>> 0;
    if (!this.config.prediction) {
      // Fetch stopped at the branch: it goes on in the next cycle where it has to
      this.pc = actual;
      this.fetchStop = null;
      this.resumeCycle = k + 1;
      this.resumeReason = "branch";
      return;
    }
    const prediction = op.prediction as Prediction;
    const entry = this.btb[prediction.index];
    if (entry === null || entry.pc !== op.pc) {
      // Another branch took the entry of the BTB: it is not changed
      this.stats.btbCollisions++;
    } else {
      entry.state = branch.taken ? Math.min(3, entry.state + 1) : Math.max(0, entry.state - 1);
    }
    const predicted = prediction.taken ? prediction.target : (op.pc + 4) >>> 0;
    if (predicted !== actual) {
      op.mispredicted = true;
      this.recover(op, actual, k);
    }
  }

  /** A jump to a register (JR, JALR): fetch, stopped at it, goes on at its target */
  private resolveJump(op: Op, target: number, resumeCycle: number): void {
    op.resolved = true;
    op.taken = true;
    if (this.fetchStop === "jreg") this.fetchStop = null;
    this.pc = target >>> 0;
    if (resumeCycle > this.resumeCycle) {
      this.resumeCycle = resumeCycle;
      this.resumeReason = "jreg";
    }
  }

  /** A wrong prediction: every instruction after the branch goes, and fetch goes on at `pc` in the next cycle */
  private recover(branch: Op, pc: number, k: number): void {
    const squashed = new Set<Op>(this.queue);
    this.queue = [];
    for (const side of SIDES) {
      for (const op of this.rob[side].squashAfter(branch.row)) squashed.add(op);
      this.window[side] = this.window[side].filter((op) => op.row <= branch.row);
    }
    this.loads = this.loads.filter((op) => op.row <= branch.row);
    this.stores = this.stores.filter((op) => op.row <= branch.row);
    this.executing = this.executing.filter((op) => op.row <= branch.row);
    for (const op of this.retiredAtFetch.filter((op) => op.row > branch.row)) squashed.add(op);
    this.retiredAtFetch = this.retiredAtFetch.filter((op) => op.row <= branch.row);
    for (const op of [...squashed].sort((a, b) => a.row - b.row)) {
      this.freeUnit(op);
      op.state = "squashed";
      op.cycles.squash = k;
      this.event(op, "X");
    }
    this.stats.squashed += squashed.size;
    this.stats.recoveries++;
    this.pc = pc >>> 0;
    this.fetchStop = null;
    this.fetchFault = "";
    this.resumeCycle = k + 1;
    this.resumeReason = "recovery";
  }

  /** The operands of an instruction, from the values of its sources (cpu.ts reads them as from the registers) */
  private operands(op: Op, sources: Source[]): Operands {
    const scratch = new Registers();
    for (const source of sources) {
      const value = source.producer ? source.producer.valueOf(source.file, source.register) : source.value;
      if (source.file === "int") scratch.R[source.register] = value | 0;
      else if (source.file === "fp") scratch.F[source.register] = value >>> 0;
      else scratch.FPSR = value;
    }
    return readOperands(op.decoded as Decoded, scratch);
  }

  // ─── Decode ───────────────────────────────────────────────────────────────────────────────────────────────────────

  private dispatchStage(k: number): void {
    let count = 0;
    let stall: DispatchStall | null = null;
    while (count < this.config.decode) {
      const op = this.queue[0];
      if (op === undefined) {
        stall = "queueEmpty";
        break;
      }
      const side = op.info.side;
      const needsWindow = op.info.kind !== "invalid";
      if (this.rob[side].full) {
        stall = side === "int" ? "robInt" : "robFp";
        break;
      }
      if (needsWindow && this.window[side].length >= this.config.window[side]) {
        stall = side === "int" ? "windowInt" : "windowFp";
        break;
      }
      if (op.info.kind === "load" && this.loads.length >= this.config.loadBuffer) {
        stall = "loadBuffer";
        break;
      }
      if (op.info.kind === "store" && this.stores.length >= this.config.storeBuffer) {
        stall = "storeBuffer";
        break;
      }
      this.queue.shift();
      this.rename(op);
      this.rob[side].push(op);
      op.cycles.dispatch = k;
      this.event(op, "D");
      count++;
      if (op.info.kind === "invalid") {
        op.error = `Invalid instruction ${hexWord(op.word)} at ${hexWord(op.pc)}`;
        this.finish(op, k);
        continue;
      }
      if (op.info.kind === "jreg" && op.sources.every((source) => source.producer === null || source.producer.valueReady)) {
        // The register of the jump is known: fetch goes on at its target in this same cycle (SuperDLX)
        const execution = execute(op.decoded as Decoded, this.operands(op, op.sources), op.pc);
        op.result = { value: execution.value };
        this.resolveJump(op, (execution.branch as NonNullable<Execution["branch"]>).target, k);
        this.finish(op, k);
        continue;
      }
      op.state = "window";
      this.window[side].push(op);
      if (op.info.kind === "load") this.loads.push(op);
      if (op.info.kind === "store") this.stores.push(op);
    }
    this.stats.dispatched += count;
    this.stats.dispatchHistogram[count]++;
    if (count === 0 && stall !== null) this.stats.dispatchStalls[stall]++;
  }

  /** An instruction done without a unit (in decode) */
  private finish(op: Op, k: number): void {
    op.state = "done";
    op.done = true;
    op.valueReady = true;
    op.cycles.complete = k;
    this.event(op, "W");
  }

  /** The registers an instruction reads: renamed to the instructions of the ROBs that produce them */
  private rename(op: Op): void {
    const decoded = op.decoded;
    if (decoded === null || op.info.kind === "trap") return;
    const { intReads, fpReads, readsFPSR } = op.use;
    const int = (registers: number[]) => registers.map((register) => this.lookup("int", register, op));
    const fp = (registers: number[]) => registers.map((register) => this.lookup("fp", register, op));
    if (op.info.kind === "store") {
      // The base of the address, to start; the data, for the commit
      op.sources = int(decoded.rs1 === 0 ? [] : [decoded.rs1]);
      op.data = decoded.def.syntax === "store" ? int(decoded.rs2 === 0 ? [] : [decoded.rs2]) : fp(fpReads);
      return;
    }
    op.sources = [...int(intReads), ...fp(fpReads), ...(readsFPSR ? [this.lookup("fpsr", 0, op)] : [])];
  }

  private lookup(file: Source["file"], register: number, op: Op): Source {
    if (file === "int" && register === 0) return { file, register, producer: null, value: 0 };
    const rob = this.rob[file === "int" ? "int" : "fp"];
    for (let i = rob.entries.length - 1; i >= 0; i--) {
      const producer = rob.entries[i];
      if (producer.row < op.row && producer.writes(file, register)) return { file, register, producer, value: 0 };
    }
    const value = file === "int" ? this.registers.R[register] : file === "fp" ? this.registers.F[register] : this.registers.FPSR;
    return { file, register, producer: null, value };
  }

  // ─── Fetch ────────────────────────────────────────────────────────────────────────────────────────────────────────

  private fetchStage(k: number): void {
    let count = 0;
    this.fetchStatus = null;
    if (k < this.resumeCycle) {
      this.fetchStatus = this.resumeReason;
    } else if (this.fetchStop !== null) {
      this.fetchStatus = this.fetchStop;
    } else {
      count = this.fetch(k);
      if (count === 0) this.fetchStatus = this.queue.length >= this.config.queue ? "queueFull" : this.fetchStop;
    }
    if (this.fetchStatus !== null && count === 0) this.stats.fetchStalls[this.fetchStatus]++;
    this.stats.fetched += count;
    this.stats.fetchHistogram[count]++;
  }

  private fetch(k: number): number {
    let count = 0;
    while (count < this.config.fetch && this.queue.length < this.config.queue) {
      let word: number;
      try {
        word = this.memory.readU32(this.pc);
      } catch (error) {
        if (!(error instanceof SimulationError)) throw error;
        this.fetchStop = "fault";
        this.fetchFault = error.message;
        break;
      }
      const op = new Op(this.nextRow++, this.pc, word, k);
      count++;
      this.report.fetched.push(op);
      this.event(op, "F");
      const decoded = op.decoded;
      const next = (this.pc + 4) >>> 0;
      switch (op.info.kind) {
        case "nop":
          this.retire(op);
          this.pc = next;
          continue;
        case "jump": {
          const target = (op.pc + 4 + (decoded as Decoded).offset) >>> 0;
          op.resolved = true;
          op.taken = true;
          this.pc = target;
          // J is done here; JAL goes on, to write R31
          if (decoded?.def.mnemonic === "J") this.retire(op);
          else this.enqueue(op);
          continue;
        }
        case "jreg":
          this.enqueue(op);
          this.pc = next;
          this.fetchStop = "jreg";
          return count;
        case "branch": {
          this.enqueue(op);
          if (!this.config.prediction) {
            this.pc = next;
            this.fetchStop = "branch";
            return count;
          }
          const target = (op.pc + 4 + (decoded as Decoded).imm) >>> 0;
          op.prediction = this.predict(op.pc, target);
          this.pc = op.prediction.taken ? target : next;
          continue;
        }
        case "trap":
          this.enqueue(op);
          this.pc = next;
          // The trap 0 ends the program: nothing after it is fetched
          if ((decoded?.offset ?? 0) === 0) {
            this.fetchStop = "halt";
            return count;
          }
          continue;
        default:
          this.enqueue(op);
          this.pc = next;
      }
    }
    return count;
  }

  private enqueue(op: Op): void {
    op.state = "queue";
    this.queue.push(op);
  }

  private retire(op: Op): void {
    op.state = "done";
    op.done = true;
    this.retiredAtFetch.push(op);
  }

  /** The prediction of the BTB: a branch that is not there goes in, predicted taken (SuperDLX) */
  private predict(pc: number, target: number): Prediction {
    const index = (pc >>> 2) % this.btb.length;
    const entry = this.btb[index];
    if (entry !== null && entry.pc === pc) return { taken: entry.state >= 2, target: entry.target, index };
    this.stats.btbMisses++;
    this.btb[index] = { pc, target, state: 2 };
    return { taken: true, target, index };
  }

  // ─── Views ────────────────────────────────────────────────────────────────────────────────────────────────────────

  private event(op: Op, kind: OpEventKind): void {
    this.report.events.push({ op, kind });
  }

  private countCycle(): void {
    const { occupancy, unitBusy } = this.stats;
    occupancy.queue += this.queue.length;
    occupancy.robInt += this.rob.int.entries.length;
    occupancy.robFp += this.rob.fp.entries.length;
    occupancy.windowInt += this.window.int.length;
    occupancy.windowFp += this.window.fp.length;
    occupancy.loadBuffer += this.loads.length;
    occupancy.storeBuffer += this.stores.length;
    for (const [key, pool] of this.pools) unitBusy[key] += pool.slots.filter((slot) => slot !== null).length;
  }

  /** Everything the machine holds now, for the views */
  public snapshot(): SuperscalarSnapshot {
    const ready = (source: Source) => source.producer === null || source.producer.valueReady;
    const sourceOf = (source: Source & { last?: number }): SnapshotSource => {
      const fp = source.last === undefined ? `F${source.register}` : `F${source.register}-F${source.last}`;
      const name = source.file === "int" ? `R${source.register}` : source.file === "fp" ? fp : "FPSR";
      const producer = source.producer;
      if (producer === null || producer.valueReady) return { name, ready: true };
      return { name, ready: false, row: producer.row, side: producer.info.side, slot: producer.robSlot };
    };
    // The two halves of a double from the same instruction are one operand: F2-F3
    const pairs = (sources: Source[]): (Source & { last?: number })[] => {
      const result: (Source & { last?: number })[] = [];
      for (const source of sources) {
        const previous = result[result.length - 1];
        if (
          previous?.file === "fp" &&
          source.file === "fp" &&
          previous.last === undefined &&
          source.register === previous.register + 1 &&
          source.producer === previous.producer
        ) {
          previous.last = source.register;
        } else {
          result.push({ ...source });
        }
      }
      return result;
    };
    const windowEntry = (op: Op): SnapshotWindowEntry => {
      const waiting = !op.sources.every(ready)
        ? "operands"
        : op.pool !== null && !(this.pools.get(op.pool) as Pool).slots.includes(null)
          ? "unit"
          : null;
      return { row: op.row, pc: op.pc, pool: op.pool, sources: pairs([...op.sources, ...op.data]).map(sourceOf), waiting };
    };
    const robEntry = (op: Op): SnapshotRobEntry => {
      const entry: SnapshotRobEntry = { row: op.row, pc: op.pc, slot: op.robSlot, dest: op.destinationName, state: op.state };
      if (op.valueReady && op.decoded) {
        const target = destination(op.decoded);
        if (target?.kind === "int" && op.result.value !== undefined) entry.value = hexWord(op.result.value);
        if (target?.kind === "fp" && op.result.fpValue) entry.value = op.result.fpValue.map(hexWord).join(" ");
        if (target?.kind === "fpsr" && op.result.fpsr !== undefined) entry.value = String(op.result.fpsr);
      }
      if (op.done && op.error !== undefined) entry.error = op.error;
      if (op.prediction) {
        entry.predicted = op.prediction.taken;
        if (op.resolved) entry.mispredicted = op.mispredicted;
      }
      return entry;
    };
    const bufferEntry = (op: Op): SnapshotBufferEntry => {
      const access = op.state === "window" || op.state === "executing" ? undefined : op.execution?.memory;
      let state: SnapshotBufferEntry["state"];
      if (op.info.kind === "load") state = access === undefined ? "address" : this.mustWait(op) ? "blocked" : "waiting";
      else state = access === undefined ? "address" : op.released ? "released" : "ready";
      const entry: SnapshotBufferEntry = { row: op.row, pc: op.pc, state };
      if (access) {
        entry.address = access.address;
        entry.bytes = access.bytes;
      }
      if (op.info.kind === "store") entry.data = op.data.every(ready);
      return entry;
    };
    const rename = new Map<string, SnapshotRename>();
    for (const side of SIDES) {
      for (const op of this.rob[side].entries) {
        const entry = { row: op.row, side, slot: op.robSlot, ready: op.valueReady };
        for (const register of op.use.intWrites) rename.set(`R${register}`, { register: `R${register}`, ...entry });
        for (const register of op.use.fpWrites) rename.set(`F${register}`, { register: `F${register}`, ...entry });
        if (op.use.writesFPSR) rename.set("FPSR", { register: "FPSR", ...entry });
      }
    }
    return {
      cycle: this.cycle,
      pc: this.pc,
      fetchStop: this.fetchStatus,
      sizes: {
        queue: this.config.queue,
        rob: { ...this.config.rob },
        window: { ...this.config.window },
        loadBuffer: this.config.loadBuffer,
        storeBuffer: this.config.storeBuffer,
        btb: this.config.btb,
      },
      queue: this.queue.map((op) => ({ row: op.row, pc: op.pc })),
      windows: { int: this.window.int.map(windowEntry), fp: this.window.fp.map(windowEntry) },
      rob: {
        int: { head: this.rob.int.head, entries: this.rob.int.entries.map(robEntry) },
        fp: { head: this.rob.fp.head, entries: this.rob.fp.entries.map(robEntry) },
      },
      loadBuffer: [
        ...this.loads.map(bufferEntry),
        ...this.executing
          .filter((op) => op.info.kind === "load" && op.state === "memory")
          .map((op) => ({
            row: op.row,
            pc: op.pc,
            state: "memory" as const,
            address: op.execution?.memory?.address,
            bytes: op.execution?.memory?.bytes,
          })),
      ].sort((a, b) => a.row - b.row),
      storeBuffer: this.stores.map(bufferEntry),
      units: [...this.pools].map(([pool, { spec, slots }]) => ({
        pool,
        latency: spec.latency,
        slots: slots.map((op) => (op === null ? null : { row: op.row, pc: op.pc, left: Math.max(0, op.readyCycle - this.cycle) })),
      })),
      btb: this.btb.flatMap((entry, index) => (entry === null ? [] : [{ index, pc: entry.pc, target: entry.target, state: entry.state }])),
      rename: [...rename.values()],
    };
  }
}
