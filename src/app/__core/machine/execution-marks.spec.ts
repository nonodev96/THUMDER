import type { TypeAddress, TypePipelineCellInstruction, TypePipelineInstructions } from "@app/Types";
import type { SuperscalarEvent } from "@core/engine/simulator";
import type { SuperscalarSnapshot } from "@core/engine/superscalar";
import { describe, expect, it } from "vitest";
import { marksByLine, markLabel, pipelineExecution, superscalarExecution } from "./execution-marks";

const cell = (address: string, draw: TypePipelineCellInstruction["draw"] = true): TypePipelineCellInstruction => ({
  text: "x",
  draw,
  address: address as TypeAddress,
});
const empty: TypePipelineCellInstruction = { text: "", draw: false };

function pipeline(stages: Partial<TypePipelineInstructions>): TypePipelineInstructions {
  return { IF: empty, ID: empty, intEX: empty, MEM: empty, WB: empty, faddEX: [], fmultEX: [], fdivEX: [], ...stages };
}

/** A machine of SuperDLX with these instructions in the queue and in the ROB of the integers */
function snapshot(queue: number[], rob: { row: number; pc: number; state: string }[]): SuperscalarSnapshot {
  return {
    queue: queue.map((pc, row) => ({ row: 100 + row, pc })),
    rob: { int: { head: 0, entries: rob.map((entry) => ({ ...entry, slot: 0, dest: "R1" })) }, fp: { head: 0, entries: [] } },
  } as unknown as SuperscalarSnapshot;
}

describe("Where each instruction is, for the editor", () => {
  it("in DLX, the stage of each instruction of the pipeline, and the editor follows the one fetched", () => {
    const { marks, focus } = pipelineExecution(
      pipeline({ IF: cell("0x00000110"), ID: cell("0x0000010C"), intEX: cell("0x00000108"), WB: cell("0x00000100"), MEM: cell("0x00000104", false) }),
    );
    expect(marks.get("0x00000110")).toEqual([{ kind: "IF", count: 1 }]);
    expect(marks.get("0x00000108")).toEqual([{ kind: "intEX", count: 1 }]);
    expect(marks.get("0x00000100")).toEqual([{ kind: "WB", count: 1 }]);
    // A bubble is not an instruction
    expect(marks.has("0x00000104")).toBe(false);
    expect(focus).toBe("0x00000110");
    expect(pipelineExecution(null)).toEqual({ marks: new Map(), focus: null });
  });

  it("in DLX, an instruction in two stages at once (a short loop) has both, the most advanced first", () => {
    const { marks } = pipelineExecution(pipeline({ IF: cell("0x00000100"), WB: cell("0x00000100"), faddEX: [{ ...cell("0x00000104"), unit: 0 }] }));
    expect(marks.get("0x00000100")).toEqual([
      { kind: "WB", count: 1 },
      { kind: "IF", count: 1 },
    ]);
    expect(marks.get("0x00000104")).toEqual([{ kind: "faddEX", count: 1 }]);
  });

  it("in SuperDLX, the state of each instruction, the ones that committed in this cycle, and the editor follows the last one", () => {
    const machine = snapshot(
      [0x120, 0x124],
      [
        { row: 7, pc: 0x10c, state: "window" },
        { row: 5, pc: 0x108, state: "executing" },
        { row: 6, pc: 0x10c, state: "window" },
        { row: 4, pc: 0x104, state: "done" },
      ],
    );
    const events: SuperscalarEvent[] = [
      { row: 2, pc: 0x100, kind: "C" },
      { row: 3, pc: 0x104, kind: "C" },
      { row: 9, pc: 0x130, kind: "X" },
    ];
    const { marks, focus } = superscalarExecution(machine, events);
    expect(marks.get("0x00000120")).toEqual([{ kind: "queue", count: 1 }]);
    expect(marks.get("0x0000010C")).toEqual([{ kind: "window", count: 2 }]);
    expect(marks.get("0x00000108")).toEqual([{ kind: "executing", count: 1 }]);
    // An older instance of the same instruction committed while a newer one is done
    expect(marks.get("0x00000104")).toEqual([
      { kind: "committed", count: 1 },
      { kind: "done", count: 1 },
    ]);
    expect(marks.get("0x00000130")).toEqual([{ kind: "squashed", count: 1 }]);
    expect(focus).toBe("0x00000104");
  });

  it("in SuperDLX, without commits the editor follows the oldest instruction in flight", () => {
    const machine = snapshot([0x120], [{ row: 8, pc: 0x10c, state: "window" }, { row: 6, pc: 0x108, state: "executing" }]);
    expect(superscalarExecution(machine, []).focus).toBe("0x00000108");
    expect(superscalarExecution(snapshot([0x120], []), []).focus).toBe("0x00000120");
    expect(superscalarExecution(null, [{ row: 1, pc: 0x100, kind: "C" }])).toEqual({ marks: new Map(), focus: null });
  });

  it("joins the marks by line, without the instructions of the modules, and writes them", () => {
    const marks = superscalarExecution(
      snapshot([], [{ row: 1, pc: 0x100, state: "window" }, { row: 2, pc: 0x104, state: "memory" }, { row: 3, pc: 0x200, state: "done" }]),
      [],
    ).marks;
    const lines = new Map<string, number>([
      ["0x00000100", 12],
      ["0x00000104", 12],
    ]);
    const byLine = marksByLine(marks, (address) => lines.get(address));
    expect(byLine).toEqual([
      {
        line: 12,
        marks: [
          { kind: "memory", count: 1 },
          { kind: "window", count: 1 },
        ],
      },
    ]);
    const names: Record<string, string> = { memory: "Lee la memoria", window: "En la ventana" };
    expect(markLabel(byLine[0].marks, (kind) => names[kind])).toBe("Lee la memoria, En la ventana");
    expect(markLabel([{ kind: "window", count: 3 }], (kind) => names[kind])).toBe("En la ventana ×3");
  });
});
