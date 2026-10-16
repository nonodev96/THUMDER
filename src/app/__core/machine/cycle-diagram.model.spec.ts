import type { TypeCycleCell, TypePipeline } from "@app/Types";
import { describe, expect, it } from "vitest";
import { CycleDiagramModel } from "./cycle-diagram.model";

const empty: TypeCycleCell = { address: "" as `0x${string}`, addressRow: -1, draw: false };
const cell = (addressRow: number, draw: TypeCycleCell["draw"] = true): TypeCycleCell => ({ address: "0x00000100", addressRow, draw });
const pipeline = (cells: Partial<TypePipeline>): TypePipeline =>
  ({ IF: empty, ID: empty, intEX: empty, MEM: empty, WB: empty, faddEX: [], fmultEX: [], fdivEX: [], ...cells }) as TypePipeline;

describe("CycleDiagramModel", () => {
  it("keeps a row per instruction and the stage of each one in each cycle", () => {
    const diagram = new CycleDiagramModel();
    expect(diagram.addInstruction("addi r1,r0,1")).toBe(0);
    diagram.addCycle(pipeline({ IF: cell(0) }), 0);
    expect(diagram.addInstruction("lw r2,0(r1)")).toBe(1);
    diagram.addCycle(pipeline({ IF: cell(1), ID: cell(0) }), 1);
    diagram.addCycle(pipeline({ IF: cell(1, "R-Stall"), intEX: cell(0) }), 2);
    expect(diagram.rows).toEqual(["addi r1,r0,1", "lw r2,0(r1)"]);
    expect(diagram.cycles).toBe(3);
    expect(diagram.cellsOf(0)).toEqual([
      [0, "IF"],
      [1, "ID"],
      [2, "intEX"],
    ]);
    expect(diagram.cell(1, 2)).toBe("R-Stall");
    expect(diagram.cell(1, 0)).toBeUndefined();
  });

  it("places the floating point units, and ignores what is not drawn", () => {
    const diagram = new CycleDiagramModel();
    diagram.addInstruction("addd f0,f2,f4");
    diagram.addCycle(pipeline({ faddEX: [{ ...cell(0), unit: 0 }], fdivEX: [{ ...cell(0, false), unit: 0 }] }), 4);
    expect(diagram.cellsOf(0)).toEqual([[4, "faddEX"]]);
    expect(diagram.cycles).toBe(5);
  });

  it("creates the rows it has not seen, keeps the arrows and starts again on reset", () => {
    const diagram = new CycleDiagramModel();
    diagram.addCycle(pipeline({ WB: cell(2) }), 0);
    expect(diagram.rows).toEqual(["", "", ""]);
    diagram.addArrow({ fromRow: 0, fromCycle: 1, toRow: 1, toCycle: 2, color: 0xff0000 });
    expect(diagram.arrows).toHaveLength(1);
    diagram.reset();
    expect([diagram.rows.length, diagram.arrows.length, diagram.cycles]).toEqual([0, 0, 0]);
  });
});

describe("CycleDiagramModel with a history", () => {
  it("keeps the last cycles, and the rows go when they have nothing newer", () => {
    const diagram = new CycleDiagramModel();
    diagram.limit = 3;
    diagram.addInstruction("a");
    diagram.addCycle(pipeline({ IF: cell(0) }), 0);
    diagram.addInstruction("b");
    diagram.addCycle(pipeline({ IF: cell(1), ID: cell(0) }), 1);
    diagram.addArrow({ fromRow: 0, fromCycle: 1, toRow: 1, toCycle: 2, color: 1 });
    diagram.addCycle(pipeline({ ID: cell(1) }), 2);
    diagram.addCycle(pipeline({ intEX: cell(1) }), 3);
    expect([diagram.firstCycle, diagram.cycles]).toEqual([1, 4]);
    // "a" was last seen in cycle 1: still kept
    expect(diagram.rows).toEqual(["a", "b"]);
    diagram.addCycle(pipeline({ MEM: cell(1) }), 4);
    expect(diagram.firstCycle).toBe(2);
    expect(diagram.rows).toEqual(["b"]);
    expect(diagram.firstRow).toBe(1);
    expect(diagram.indexOf(1)).toBe(0);
    expect(diagram.indexOf(0)).toBe(-1);
    expect(diagram.textOf(1)).toBe("b");
    expect(diagram.cellsOf(0).map(([cycle]) => cycle)).toEqual([2, 3, 4]);
    // The arrows of the rows that went, gone too
    expect(diagram.arrows).toEqual([]);
  });

  it("keeps why each instruction stalls, by row and cycle", () => {
    const diagram = new CycleDiagramModel();
    diagram.addInstruction("lw r3,0(r0)");
    diagram.addInstruction("add r4,r3,r3");
    diagram.addCycle(pipeline({ ID: cell(1, "R-Stall") }), 3);
    diagram.addStalls([{ row: 1, cycle: 3, label: "R-Stall", kind: "raw", cause: 0, register: "R3", forwardingHelps: false }]);
    expect(diagram.stall(1, 3)).toEqual({ label: "R-Stall", kind: "raw", cause: 0, register: "R3", forwardingHelps: false });
    expect(diagram.stall(1, 2)).toBeUndefined();
  });
});
