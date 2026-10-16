import type { TypeDataStatistics } from "@app/Types";

// What the statistics view shows, from the statistics of the simulator (WinDLX: Statistics): the counts, what part of
// the cycles each kind of stall takes, the mix of instructions of the program and the main cause of the stalls

/** A bar of a chart: its key (the name of its text) and its value, with its part of the whole in % */
export type Share = { key: string; value: number; per: number };

/** The kinds of stall: the cycles an instruction waits in ID (or in an unit) and why */
export const STALLS = ["RAW", "WAW", "STRUCTURAL", "CONTROL", "TRAP"] as const;
export type StallKind = (typeof STALLS)[number];

/** Why an instruction waits for a result (RAW): a load, a branch that needs it in ID, a floating point operation or other */
export const RAW_CAUSES = ["LOAD", "BRANCH", "FLOATING", "OTHER"] as const;

/** The groups of instructions of the program */
export const MIX = ["LOADS", "STORES", "BRANCHES", "FLOATING", "TRAPS", "OTHER"] as const;

const percent = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 1000) / 10 : 0);

export type Summary = {
  cycles: number;
  instructions: number;
  /** Cycles per instruction (0 with no instructions) */
  cpi: number;
  /** The cycles with a stall, and their part of all the cycles */
  stalls: number;
  stallsPer: number;
  inPipeline: number;
  /** The kind of stall that takes most cycles (null without stalls) */
  mainCause: Share | null;
};

export function summarize(data: TypeDataStatistics): Summary {
  const cycles = data.TOTAL.CYCLES_EXECUTED.cycles;
  const instructions = data.TOTAL.ID_EXECUTED.instructions;
  const stalls = stallShares(data);
  const total = data.STALLS.TOTAL.num;
  const main = stalls.reduce<Share | null>((best, share) => (share.value > (best?.value ?? 0) ? share : best), null);
  return {
    cycles,
    instructions,
    cpi: instructions > 0 ? Math.round((cycles / instructions) * 100) / 100 : 0,
    stalls: total,
    stallsPer: percent(total, cycles),
    inPipeline: data.TOTAL.INSTRUCTIONS_IN_PIPELINE.instructions_in_pipeline,
    mainCause: main,
  };
}

/** Each kind of stall, with its part of all the cycles */
export function stallShares(data: TypeDataStatistics): Share[] {
  const cycles = data.TOTAL.CYCLES_EXECUTED.cycles;
  const counts: Record<StallKind, number> = {
    RAW: data.STALLS.RAW_STALLS.num,
    WAW: data.STALLS.WAW_STALLS.num,
    STRUCTURAL: data.STALLS.STRUCTURAL_STALLS.num,
    CONTROL: data.STALLS.CONTROL_STALLS.num,
    TRAP: data.STALLS.TRAP_STALLS.num,
  };
  return STALLS.map((key) => ({ key, value: counts[key], per: percent(counts[key], cycles) }));
}

/** What the cycles are: the ones without a stall and the ones of each kind of stall (100% in all) */
export function cycleShares(data: TypeDataStatistics): Share[] {
  const cycles = data.TOTAL.CYCLES_EXECUTED.cycles;
  const stalls = stallShares(data);
  const free = Math.max(0, cycles - stalls.reduce((sum, share) => sum + share.value, 0));
  return [{ key: "FREE", value: free, per: percent(free, cycles) }, ...stalls];
}

/** The causes of the RAW stalls, with their part of them */
export function rawCauses(data: TypeDataStatistics): Share[] {
  const raw = data.STALLS.RAW_STALLS.num;
  const load = data.STALLS.LD_STALLS.num;
  const branch = data.STALLS.BRANCH_STALLS.num;
  const floating = data.STALLS.FLOATING_POINT_STALLS.num;
  const other = Math.max(0, raw - load - branch - floating);
  const counts = { LOAD: load, BRANCH: branch, FLOATING: floating, OTHER: other };
  return RAW_CAUSES.map((key) => ({ key, value: counts[key], per: percent(counts[key], raw) }));
}

/** The instructions of the program by group, with their part of all of them */
export function instructionMix(data: TypeDataStatistics): Share[] {
  const instructions = data.TOTAL.ID_EXECUTED.instructions;
  const counts = {
    LOADS: data.LOAD_STORE.LOADS.num,
    STORES: data.LOAD_STORE.STORES.num,
    BRANCHES: data.CONDITIONAL.TOTAL.num,
    FLOATING: data.FLOATING.TOTAL.num,
    TRAPS: data.TRAPS.TOTAL.num,
    OTHER: 0,
  };
  const known = counts.LOADS + counts.STORES + counts.BRANCHES + counts.FLOATING + counts.TRAPS;
  // The integer operations, the jumps and the rest
  counts.OTHER = Math.max(0, instructions - known);
  return MIX.map((key) => ({ key, value: counts[key], per: percent(counts[key], instructions) }));
}

/** The conditional branches: taken and not taken */
export function branchShares(data: TypeDataStatistics): Share[] {
  const total = data.CONDITIONAL.TOTAL.num;
  const taken = data.CONDITIONAL.TAKEN.num;
  return [
    { key: "TAKEN", value: taken, per: percent(taken, total) },
    { key: "NOT_TAKEN", value: total - taken, per: percent(total - taken, total) },
  ];
}

/** The floating point operations: additions, multiplications and divisions */
export function floatingShares(data: TypeDataStatistics): Share[] {
  const total = data.FLOATING.TOTAL.num;
  const counts = {
    ADDITIONS: data.FLOATING.ADDITIONS.num,
    MULTIPLICATIONS: data.FLOATING.MULTIPLICATIONS.num,
    DIVISIONS: data.FLOATING.DIVISIONS.num,
  };
  return (Object.keys(counts) as (keyof typeof counts)[]).map((key) => ({ key, value: counts[key], per: percent(counts[key], total) }));
}
