import type { TypeCycleCell, TypePipeline } from "@app/Types";
import { describe, expect, it } from "vitest";
import { CycleDiagramModel } from "./cycle-diagram.model";
import { diagramToCsv, diagramToSvg } from "./diagram-export";
import { explainCell, stallCells } from "./stall-explanation";

const empty: TypeCycleCell = { address: "" as `0x${string}`, addressRow: -1, draw: false };
const cell = (addressRow: number, draw: TypeCycleCell["draw"] = true): TypeCycleCell => ({ address: "0x00000100", addressRow, draw });
const pipeline = (cells: Partial<TypePipeline>): TypePipeline =>
  ({ IF: empty, ID: empty, intEX: empty, MEM: empty, WB: empty, faddEX: [], fmultEX: [], fdivEX: [], ...cells }) as TypePipeline;

function loadUse(): CycleDiagramModel {
  const diagram = new CycleDiagramModel();
  diagram.addInstruction("lw r3,0(r0)");
  diagram.addCycle(pipeline({ IF: cell(0) }), 0);
  diagram.addInstruction("add r4,r3,r3");
  diagram.addCycle(pipeline({ IF: cell(1), ID: cell(0) }), 1);
  diagram.addCycle(pipeline({ ID: cell(1), intEX: cell(0) }), 2);
  diagram.addCycle(pipeline({ ID: cell(1, "R-Stall"), MEM: cell(0) }), 3);
  diagram.addStalls([{ row: 1, cycle: 3, label: "R-Stall", kind: "raw", cause: 0, register: "R3", forwardingHelps: false }]);
  return diagram;
}

describe("explainCell (EDU-01)", () => {
  it("says the stage of an instruction that is not stalled", () => {
    expect(explainCell(loadUse(), 0, 2, true)).toEqual([{ key: "MACHINE.EXPLAIN_STAGE", params: { instruction: "lw r3,0(r0)", stage: "intEX", cycle: 2 } }]);
    expect(explainCell(loadUse(), 0, 9, true)).toEqual([]);
  });

  it("explains a read after write with its register and its producer, and what forwarding changes", () => {
    const [cause, forwarding] = explainCell(loadUse(), 1, 3, true);
    expect(cause).toEqual({
      key: "MACHINE.EXPLAIN_RAW",
      params: { instruction: "add r4,r3,r3", cause: "lw r3,0(r0)", register: "R3", cycle: 3, label: "R-Stall" },
    });
    expect(forwarding.key).toBe("MACHINE.EXPLAIN_RAW_REAL");
    expect(explainCell(loadUse(), 1, 3, false)[1].key).toBe("MACHINE.EXPLAIN_RAW_NOT_YET");
  });

  it("finds the stalls in order of cycle", () => {
    expect(stallCells(loadUse())).toEqual([[1, 3]]);
  });
});

describe("the export of the diagram (EDU-06)", () => {
  it("writes a table with one row per instruction and one column per cycle", () => {
    expect(diagramToCsv(loadUse())).toBe("Instruction,0,1,2,3\nlw r3,0(r0),IF,ID,intEX,MEM\nadd r4,r3,r3,,IF,ID,R-Stall\n".replace("lw r3,0(r0)", '"lw r3,0(r0)"').replace("add r4,r3,r3,", '"add r4,r3,r3",'));
  });

  it("draws the cells and the texts, escaped", () => {
    const diagram = loadUse();
    const svg = diagramToSvg(diagram);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg.match(/<rect x=/g)).toHaveLength(7);
    expect(svg).toContain(">R-Stall</text>");
    const tricky = new CycleDiagramModel();
    tricky.addInstruction("a<b & c");
    tricky.addCycle(pipeline({ IF: cell(0) }), 0);
    expect(diagramToSvg(tricky)).toContain("a&lt;b &amp; c");
  });
});
