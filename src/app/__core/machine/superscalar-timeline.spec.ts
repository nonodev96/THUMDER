import { SuperscalarTimeline, type TimelineRow, timelineCell } from "@core/machine/superscalar-timeline";
import { describe, expect, it } from "vitest";

const cells = (row: TimelineRow, last: number) => Array.from({ length: last + 1 }, (_, cycle) => timelineCell(row, cycle) ?? ".").join("");

describe("The history of SuperDLX", () => {
  it("draws each instruction through the queue, its window, its unit and the ROB", () => {
    const row: TimelineRow = { row: 0, pc: 0, side: "int", pool: "int.alu", fetch: 0, dispatch: 2, issue: 4, complete: 5, commit: 7 };
    expect(cells(row, 8)).toBe("FqDwEWrC.");
  });

  it("a load accesses the memory, a store writes it after it commits", () => {
    const load: TimelineRow = { row: 0, pc: 0, side: "int", pool: "int.address", fetch: 0, dispatch: 1, issue: 2, memory: 3, complete: 4, commit: 5 };
    expect(cells(load, 6)).toBe("FDEMWC.");
    const store: TimelineRow = { row: 1, pc: 4, side: "int", pool: "int.address", fetch: 0, dispatch: 1, issue: 2, complete: 3, commit: 4, memory: 6 };
    expect(cells(store, 7)).toBe("FDEWC.M.");
  });

  it("a squashed instruction ends with X, and a NOP only waits to commit", () => {
    const squashed: TimelineRow = { row: 0, pc: 0, side: "fp", pool: "fp.add", fetch: 0, dispatch: 1, squash: 3 };
    expect(cells(squashed, 4)).toBe("FDwX.");
    const nop: TimelineRow = { row: 1, pc: 4, side: "int", pool: null, fetch: 0, retired: true, commit: 2 };
    expect(cells(nop, 3)).toBe("FrC.");
  });

  it("keeps the events of each instruction, and only the last ones", () => {
    const timeline = new SuperscalarTimeline();
    timeline.limit = 2;
    timeline.add(0, [
      { row: 0, pc: 0, kind: "F", side: "int", pool: "int.alu" },
      { row: 1, pc: 4, kind: "F", side: "int", pool: "int.branch" },
    ]);
    timeline.add(1, [{ row: 0, pc: 0, kind: "D" }, { row: 1, pc: 4, kind: "D" }, { row: 2, pc: 8, kind: "F", side: "fp", pool: "fp.add" }]);
    timeline.add(2, [{ row: 1, pc: 4, kind: "I", mispredicted: true }, { row: 2, pc: 8, kind: "X" }]);
    expect(timeline.cycles).toBe(3);
    expect(timeline.rows.map((row) => row.row)).toEqual([1, 2]);
    expect(timeline.rows[0]).toMatchObject({ dispatch: 1, issue: 2, mispredicted: true });
    expect(timeline.rows[1].squash).toBe(2);
    expect(timeline.between(3, 10).map((row) => row.row)).toEqual([1]);
  });
});
