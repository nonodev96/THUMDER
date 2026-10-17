import type { TypeCycleCell, TypePipeline, TypeStall } from "@app/Types";
import { cycleSounds, gainOf, type Occupancy, STAGE_NOTES, strumGap } from "@core/services/sound/sound-design";
import { describe, expect, it } from "vitest";

const empty: TypeCycleCell = { address: "" as `0x${string}`, addressRow: 0, draw: false };
const cell = (row: number, draw: true | TypeStall = true): TypeCycleCell => ({ address: `0x${(row * 4).toString(16).padStart(8, "0")}`, addressRow: row, draw });
const pipeline = (stages: Partial<Record<"IF" | "ID" | "intEX" | "MEM" | "WB", TypeCycleCell>>, fmult: TypeCycleCell[] = []): TypePipeline => ({
  IF: empty,
  ID: empty,
  intEX: empty,
  MEM: empty,
  WB: empty,
  ...stages,
  faddEX: [{ ...empty, unit: 0 }],
  fmultEX: fmult.length ? fmult.map((value, unit) => ({ ...value, unit })) : [{ ...empty, unit: 0 }],
  fdivEX: [{ ...empty, unit: 0 }],
  arrows: [],
});

describe("the sounds of the pipeline", () => {
  it("plays the stage each instruction enters, in the order of the pipeline", () => {
    const { sounds } = cycleSounds(pipeline({ WB: cell(1), IF: cell(5), intEX: cell(3), ID: cell(4), MEM: cell(2) }), new Map());
    expect(sounds.map((sound) => `${sound.stage}:${sound.kind}`)).toEqual(["IF:enter", "ID:enter", "EX:enter", "MEM:enter", "WB:enter"]);
  });

  it("does not sound again an instruction that stays in its stage, but a stall and an aborted one always sound", () => {
    let previous: Occupancy = new Map();
    ({ occupancy: previous } = cycleSounds(pipeline({ ID: cell(2) }, [cell(1)]), previous));
    const next = cycleSounds(pipeline({ ID: cell(2, "R-Stall"), IF: cell(3, "Aborted") }, [cell(1)]), previous);
    expect(next.sounds).toEqual([
      { stage: "IF", kind: "abort" },
      { stage: "ID", kind: "stall" },
    ]);
  });

  it("an empty pipeline is silent, and each kind of a stage sounds once (several floating units)", () => {
    expect(cycleSounds(pipeline({}), new Map()).sounds).toEqual([]);
    expect(cycleSounds(pipeline({}, [cell(1), cell(2)]), new Map()).sounds).toEqual([{ stage: "fmul", kind: "enter" }]);
  });

  it("uses notes of one scale, a volume on a curve and a strum that fits the cycle", () => {
    const pentatonic = [0, 2, 4, 7, 9].map((step) => step % 12);
    for (const frequency of Object.values(STAGE_NOTES)) {
      const semitones = Math.round(12 * Math.log2(frequency / 261.63));
      expect(pentatonic).toContain(((semitones % 12) + 12) % 12);
    }
    expect(gainOf(0)).toBe(0);
    expect(gainOf(100)).toBeCloseTo(0.9);
    expect(gainOf(50)).toBeLessThan(gainOf(100) / 2);
    expect(strumGap(25)).toBeGreaterThanOrEqual(0.008);
    expect(strumGap(1000)).toBe(0.03);
  });
});
