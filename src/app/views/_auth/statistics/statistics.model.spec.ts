import { DEFAULT_DATA_STATISTICS } from "@app/CONSTANTS";
import type { TypeDataStatistics } from "@app/Types";
import { describe, expect, it } from "vitest";
import { branchShares, cycleShares, instructionMix, rawCauses, stallShares, summarize } from "./statistics.model";

/** The statistics of a run: 100 cycles, 60 instructions and 30 stall cycles */
function run(): TypeDataStatistics {
  const data = structuredClone(DEFAULT_DATA_STATISTICS) as TypeDataStatistics;
  data.TOTAL.CYCLES_EXECUTED.cycles = 100;
  data.TOTAL.ID_EXECUTED.instructions = 60;
  data.TOTAL.INSTRUCTIONS_IN_PIPELINE.instructions_in_pipeline = 3;
  data.STALLS.RAW_STALLS.num = 20;
  data.STALLS.LD_STALLS.num = 8;
  data.STALLS.BRANCH_STALLS.num = 4;
  data.STALLS.FLOATING_POINT_STALLS.num = 3;
  data.STALLS.WAW_STALLS.num = 1;
  data.STALLS.STRUCTURAL_STALLS.num = 2;
  data.STALLS.CONTROL_STALLS.num = 6;
  data.STALLS.TRAP_STALLS.num = 1;
  data.STALLS.TOTAL.num = 30;
  data.CONDITIONAL.TOTAL.num = 10;
  data.CONDITIONAL.TAKEN.num = 6;
  data.LOAD_STORE.LOADS.num = 12;
  data.LOAD_STORE.STORES.num = 5;
  data.FLOATING.TOTAL.num = 7;
  data.FLOATING.ADDITIONS.num = 4;
  data.FLOATING.MULTIPLICATIONS.num = 2;
  data.FLOATING.DIVISIONS.num = 1;
  data.TRAPS.TOTAL.num = 2;
  return data;
}

describe("the statistics view", () => {
  it("sums up a run: CPI, the stall cycles and their main cause", () => {
    const summary = summarize(run());
    expect(summary).toMatchObject({ cycles: 100, instructions: 60, cpi: 1.67, stalls: 30, stallsPer: 30, inPipeline: 3 });
    expect(summary.mainCause).toEqual({ key: "RAW", value: 20, per: 20 });
  });

  it("splits the cycles in the ones without a stall and each kind of stall, 100% in all", () => {
    const cycles = cycleShares(run());
    expect(cycles.map((share) => share.key)).toEqual(["FREE", "RAW", "WAW", "STRUCTURAL", "CONTROL", "TRAP"]);
    expect(cycles[0]).toEqual({ key: "FREE", value: 70, per: 70 });
    expect(cycles.reduce((sum, share) => sum + share.value, 0)).toBe(100);
    expect(stallShares(run()).find((share) => share.key === "CONTROL")).toEqual({ key: "CONTROL", value: 6, per: 6 });
  });

  it("gives the causes of the RAW stalls, the rest as others", () => {
    expect(rawCauses(run())).toEqual([
      { key: "LOAD", value: 8, per: 40 },
      { key: "BRANCH", value: 4, per: 20 },
      { key: "FLOATING", value: 3, per: 15 },
      { key: "OTHER", value: 5, per: 25 },
    ]);
  });

  it("groups the instructions, the integer ones as the rest, and splits the branches", () => {
    const mix = instructionMix(run());
    expect(mix.find((share) => share.key === "OTHER")).toEqual({ key: "OTHER", value: 60 - 12 - 5 - 10 - 7 - 2, per: 40 });
    expect(mix.reduce((sum, share) => sum + share.value, 0)).toBe(60);
    expect(branchShares(run())).toEqual([
      { key: "TAKEN", value: 6, per: 60 },
      { key: "NOT_TAKEN", value: 4, per: 40 },
    ]);
  });

  it("has no causes nor CPI before running", () => {
    const empty = structuredClone(DEFAULT_DATA_STATISTICS) as TypeDataStatistics;
    expect(summarize(empty)).toMatchObject({ cycles: 0, cpi: 0, stallsPer: 0, mainCause: null });
    expect(cycleShares(empty).every((share) => share.per === 0)).toBe(true);
  });
});
