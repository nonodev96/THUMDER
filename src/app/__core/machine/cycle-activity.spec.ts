import type { TypeCycleCell, TypePipeline, TypePipelineInstructions } from "@app/Types";
import { describe, expect, it } from "vitest";
import { cycleActivity, forwardingOf, hex32 } from "./cycle-activity";
import { CycleDiagramModel } from "./cycle-diagram.model";

const none = { text: "", draw: false as const };
const instructions = (cells: Partial<TypePipelineInstructions>): TypePipelineInstructions => ({
  IF: none,
  ID: none,
  intEX: none,
  MEM: none,
  WB: none,
  faddEX: [],
  fmultEX: [],
  fdivEX: [],
  ...cells,
});
// lw r5,0x1004(r3) at 0x114, addi r1,r0,5 at 0x110
const words: Record<string, number> = { "0x00000114": 0x8c651004, "0x00000110": 0x20010005 };
const wordAt = (address: string) => words[address] ?? null;

const emptyCell: TypeCycleCell = { address: "" as `0x${string}`, addressRow: -1, draw: false };
const cell = (addressRow: number, draw: TypeCycleCell["draw"] = true): TypeCycleCell => ({ address: "0x00000100", addressRow, draw });
const pipeline = (cells: Partial<TypePipeline>): TypePipeline =>
  ({ IF: emptyCell, ID: emptyCell, intEX: emptyCell, MEM: emptyCell, WB: emptyCell, faddEX: [], fmultEX: [], fdivEX: [], ...cells }) as TypePipeline;

describe("cycleActivity", () => {
  it("decodes the instruction of each stage and keeps its id, its address and its stall", () => {
    const activity = cycleActivity(
      instructions({
        IF: { text: "lw r5,Table(R3)", draw: true, address: "0x00000114", id: 4 },
        ID: { text: "addi r1,r0,5", draw: "R-Stall", address: "0x00000110", id: 3 },
      }),
      null,
      new CycleDiagramModel(),
      wordAt,
    );
    expect(activity.stages.IF).toMatchObject({ id: 4, address: 0x114, stall: null, text: "lw r5,Table(R3)" });
    expect(activity.stages.IF?.decoded?.def.mnemonic).toBe("LW");
    expect(activity.stages.ID).toMatchObject({ id: 3, stall: "R-Stall" });
    expect(activity.stages.ID?.use?.intWrites).toEqual([1]);
    expect(activity.stages.intEX).toBeNull();
  });

  it("separates the registers written in WB from the registers of the pipeline, and sees a taken branch", () => {
    const activity = cycleActivity(
      instructions({}),
      {
        step: 7,
        registers: [
          { typeRegister: "Control", register: "PC", hexadecimalValue: "0x00000130" },
          { typeRegister: "Control", register: "BTA", hexadecimalValue: "0x00000130" },
          { typeRegister: "Integer", register: "R1", hexadecimalValue: "0x00000005" },
        ],
        memory: [{ typeData: "HalfWord", address: "0x00001000", value: "0x0007" }],
        reads: [],
      },
      new CycleDiagramModel(),
      wordAt,
    );
    expect(activity.step).toBe(7);
    expect(activity.written.get("PC")).toBe(0x130);
    expect(activity.writeBack).toEqual([{ name: "R1", value: 5 }]);
    expect(activity.branch).toEqual({ target: 0x130, taken: true });
    expect(activity.stores).toEqual([{ address: 0x1000, bytes: 2, value: "0x0007" }]);
  });

  it("finds the forwarding of a cycle in the green arrows of the diagram", () => {
    const diagram = new CycleDiagramModel();
    diagram.addInstruction("addi r1,r0,5");
    diagram.addInstruction("add r2,r1,r1");
    diagram.addCycle(pipeline({ MEM: cell(0), intEX: cell(1) }), 4);
    diagram.addArrow({ fromRow: 0, fromCycle: 3, toRow: 1, toCycle: 4, color: 0x16a34a });
    // A red arrow (the cause of a stall) is not forwarding
    diagram.addArrow({ fromRow: 0, fromCycle: 3, toRow: 1, toCycle: 4, color: 0xdc2626 });
    expect(forwardingOf(diagram, 4)).toEqual([{ from: "EX/MEM", to: "EX", producer: "addi r1,r0,5", consumer: "add r2,r1,r1" }]);
    expect(forwardingOf(diagram, 5)).toEqual([]);
  });

  it("writes 32 bits in hexadecimal", () => {
    expect(hex32(42)).toBe("0x0000002A");
    expect(hex32(-1)).toBe("0xFFFFFFFF");
  });
});
