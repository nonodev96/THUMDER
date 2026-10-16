import { DEFAULT_DATA_STATISTICS } from "@app/CONSTANTS";
import { ManagerStatistics } from "@core/DLX/ManagerStatistics";
import { describe, expect, it } from "vitest";

const TOTAL = {
  CYCLES_EXECUTED: { cycles: 42 },
  ID_EXECUTED: { instructions: 30 },
  INSTRUCTIONS_IN_PIPELINE: { instructions_in_pipeline: 3 },
};

describe("ManagerStatistics", () => {
  it("does not change the shared defaults", () => {
    const before = JSON.stringify(DEFAULT_DATA_STATISTICS);
    const statistics = new ManagerStatistics();
    statistics.processResponse({ TOTAL });
    expect(JSON.stringify(DEFAULT_DATA_STATISTICS)).toBe(before);
    expect(new ManagerStatistics().getData()).toEqual(DEFAULT_DATA_STATISTICS);
  });

  it("merges the answers of the server and resets", () => {
    const statistics = new ManagerStatistics();
    statistics.processResponse({ TOTAL });
    expect(statistics.getData().TOTAL.CYCLES_EXECUTED.cycles).toBe(42);
    expect(statistics.getData().HARDWARE).toEqual(DEFAULT_DATA_STATISTICS.HARDWARE);
    statistics.reset();
    expect(statistics.getData()).toEqual(DEFAULT_DATA_STATISTICS);
  });
});
