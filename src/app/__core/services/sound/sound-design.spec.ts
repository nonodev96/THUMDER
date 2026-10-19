import type { TypeCycleCell, TypePipeline, TypeStall } from "@app/Types";
import {
  BAR,
  type CycleSounds,
  chordAt,
  cycleNotes,
  cycleSounds,
  EVENT_NOTES,
  FIRST_MELODY,
  frequency,
  gainOf,
  MAX_VOICES,
  type Melody,
  type Note,
  noteGap,
  notesPerCycle,
  type Occupancy,
  PREVIEW,
  PREVIEW_CYCLE_MS,
  PROGRESSION,
  RANGES,
  SCALE,
  type SoundStage,
  type StageSound,
} from "@core/services/sound/sound-design";
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

/** A cycle of the design: its events (stage, kind, row) and the row of the newest instruction */
const cycle = (position: number, ...events: [SoundStage, StageSound["kind"], number][]): Pick<CycleSounds, "sounds" | "position"> => ({
  position,
  sounds: events.map(([stage, kind, row]) => ({ stage, kind, address: row * 4 })),
});
/** A full pipeline: the instruction `row` is fetched while the four before it go on */
const full = (row: number) =>
  cycle(row, ["IF", "enter", row], ["ID", "enter", row - 1], ["EX", "enter", row - 2], ["MEM", "enter", row - 3], ["WB", "enter", row - 4]);

/** Plays cycles one after another, as SoundService does */
const play = (cycles: Pick<CycleSounds, "sounds" | "position">[], cycleMs = 250, start: Melody = FIRST_MELODY) => {
  let melody = start;
  return cycles.map((value) => {
    const played = cycleNotes(value, cycleMs, melody);
    melody = played.melody;
    return played.notes;
  });
};

/** The most notes that sound at the same time */
const polyphony = (notes: Note[]) => Math.max(0, ...notes.map(({ at }) => notes.filter((note) => note.at <= at && at < note.at + note.length).length));

describe("what happens in a cycle", () => {
  it("the stage each instruction enters, in the order of the pipeline, with its address and the newest row", () => {
    const { sounds, position } = cycleSounds(pipeline({ WB: cell(1), IF: cell(5), intEX: cell(3), ID: cell(4), MEM: cell(2) }), new Map());
    expect(sounds.map((sound) => `${sound.stage}:${sound.kind}`)).toEqual(["IF:enter", "ID:enter", "EX:enter", "MEM:enter", "WB:enter"]);
    expect(sounds[0].address).toBe(20);
    expect(position).toBe(5);
  });

  it("an instruction that stays in its stage is not new, but a stall and an aborted one always count", () => {
    let previous: Occupancy = new Map();
    ({ occupancy: previous } = cycleSounds(pipeline({ ID: cell(2) }, [cell(1)]), previous));
    const next = cycleSounds(pipeline({ ID: cell(2, "R-Stall"), IF: cell(3, "Aborted") }, [cell(1)]), previous);
    expect(next.sounds).toEqual([
      { stage: "IF", kind: "abort", address: 12 },
      { stage: "ID", kind: "stall", address: 8 },
    ]);
  });

  it("an empty pipeline has nothing, and each kind of a stage counts once (several floating units)", () => {
    expect(cycleSounds(pipeline({}), new Map())).toMatchObject({ sounds: [], position: -1 });
    expect(cycleSounds(pipeline({}, [cell(1), cell(2)]), new Map()).sounds).toEqual([{ stage: "fmul", kind: "enter", address: 4 }]);
  });
});

describe("the music of the cycles", () => {
  it("never more than three notes, one after another, all of them starting in the first half of the cycle", () => {
    for (const cycleMs of [0, 50, 90, 120, 150, 200, 250, 300, 1000, 5000]) {
      const count = notesPerCycle(cycleMs);
      expect(count).toBeGreaterThanOrEqual(1);
      expect(count).toBeLessThanOrEqual(MAX_VOICES);
      const [notes] = play([full(9)], cycleMs);
      expect(notes.length).toBeLessThanOrEqual(count);
      const seconds = Math.max(cycleMs, 90) / 1000;
      for (const [index, note] of notes.entries()) {
        expect(note.at).toBeLessThanOrEqual(seconds * 0.55 + 1e-9);
        if (index > 0) expect(note.at - notes[index - 1].at).toBeGreaterThanOrEqual(0.05 - 1e-9);
      }
    }
    expect(notesPerCycle(250)).toBe(3);
    expect(notesPerCycle(300)).toBe(3);
    expect(notesPerCycle(60)).toBe(1);
    expect(noteGap(5000, 3)).toBe(0.12);
    expect(noteGap(250, 1)).toBe(0);
  });

  it("a full pipeline is an arpeggio from low to high: the pulse, the middle and the melody (a bell)", () => {
    const [notes] = play([full(8)]);
    expect(notes.map((note) => note.timbre)).toEqual(["bass", "pluck", "bell"]);
    expect(notes[0].midi).toBeLessThan(notes[1].midi);
    expect(notes[1].midi).toBeLessThan(notes[2].midi);
    // Running fast, only the most informative one: the instruction that completes
    expect(play([full(8)], 60)[0].map((note) => note.timbre)).toEqual(["bell"]);
    // The middle only sounds on the strong beats
    expect(play([full(9)])[0].map((note) => note.timbre)).toEqual(["bass", "bell"]);
  });

  it("every note is in C major and in the range of its voice, and the melody moves by small steps", () => {
    const notes = play(Array.from({ length: 64 }, (_, row) => full(row + 4))).flat();
    for (const note of notes) expect(SCALE).toContain(note.midi % 12);
    for (const note of notes.filter((value) => value.timbre === "bass")) {
      expect(note.midi).toBeGreaterThanOrEqual(RANGES.pulse[0]);
      expect(note.midi).toBeLessThanOrEqual(RANGES.pulse[1]);
    }
    const melody = notes.filter((note) => note.timbre === "bell").map((note) => note.midi);
    expect(melody.length).toBe(64);
    for (const note of melody) expect(note).toBeGreaterThanOrEqual(RANGES.melody[0]);
    for (const [index, note] of melody.entries()) if (index > 0) expect(Math.abs(note - melody[index - 1])).toBeLessThanOrEqual(7);
    // It does not stay on one note: it walks
    expect(new Set(melody).size).toBeGreaterThan(4);
    // The same code sounds the same: a deterministic design
    expect(play([full(8), full(9), full(10)])).toEqual(play([full(8), full(9), full(10)]));
  });

  it("the chords follow the canon of Pachelbel, a bar every four instructions fetched, and the pulse plays their root", () => {
    expect(PROGRESSION.map((chord) => chord.name)).toEqual(["C", "G", "Am", "Em", "F", "C", "F", "G"]);
    expect(chordAt(0).name).toBe("C");
    expect(chordAt(BAR - 1).name).toBe("C");
    expect(chordAt(BAR).name).toBe("G");
    expect(chordAt(BAR * 2).name).toBe("Am");
    expect(chordAt(BAR * PROGRESSION.length).name).toBe("C");
    for (const chord of PROGRESSION) for (const tone of [chord.root, chord.third, chord.fifth, chord.colour]) expect(SCALE).toContain(tone);
    for (let bar = 0; bar < PROGRESSION.length; bar++) {
      const [notes] = play([full(bar * BAR)]);
      expect(notes[0].midi % 12).toBe(PROGRESSION[bar].root);
    }
  });

  it("a stall is a soft muted low note instead of the pulse (tick-tock and softer while it lasts), and holds the chord", () => {
    const waiting = cycle(5, ["IF", "stall", 5], ["ID", "stall", 4], ["MEM", "enter", 3], ["WB", "enter", 2]);
    const [first, second, third] = play([waiting, waiting, cycle(5, ["IF", "stall", 5], ["ID", "stall", 4])]);
    expect(first.map((note) => note.timbre)).toEqual(["muted", "bell"]);
    expect(second[0].timbre).toBe("muted");
    const chord = chordAt(5);
    expect(first[0].midi % 12).toBe(chord.root);
    expect(second[0].midi % 12).toBe(chord.fifth);
    expect(third[0].midi % 12).toBe(chord.root);
    expect(second[0].gain).toBeLessThan(first[0].gain);
    expect(third[0].gain).toBeLessThan(second[0].gain);
    expect(first[0].midi).toBeLessThanOrEqual(RANGES.pulse[1]);
    // Flowing again, the tick-tock starts from the root
    const [, again] = play([waiting, full(6)]);
    expect(again[0].timbre).toBe("bass");
  });

  it("an aborted instruction falls a third or a fourth (one note that slides down when there is no time for two)", () => {
    const aborted = cycle(7, ["IF", "abort", 7], ["ID", "enter", 6], ["EX", "enter", 5], ["MEM", "enter", 4], ["WB", "enter", 3]);
    const [notes] = play([aborted]);
    expect(notes.map((note) => note.timbre)).toEqual(["pluck", "pluck", "bell"]);
    const fall = notes[0].midi - notes[1].midi;
    expect(fall).toBeGreaterThanOrEqual(3);
    expect(fall).toBeLessThanOrEqual(5);
    const [fast] = play([aborted], 60);
    expect(fast).toHaveLength(1);
    expect(fast[0].bend).toBeLessThanOrEqual(-3);
  });

  it("a floating point unit adds a colour note, the ninth of the chord", () => {
    const [notes] = play([cycle(9, ["IF", "enter", 9], ["fmul", "enter", 7])]);
    expect(notes.map((note) => note.timbre)).toEqual(["bass", "soft"]);
    expect(notes[1].midi % 12).toBe(chordAt(9).colour);
  });
});

describe("the events, the volume and the preview", () => {
  it("each event has its notes, never more than three at a time", () => {
    for (const notes of Object.values(EVENT_NOTES)) {
      expect(notes.length).toBeGreaterThan(0);
      expect(polyphony(notes)).toBeLessThanOrEqual(MAX_VOICES);
      for (const note of notes) expect(note.gain).toBeLessThanOrEqual(0.3);
    }
    expect(frequency(69)).toBeCloseTo(440);
    expect(frequency(60)).toBeCloseTo(261.63, 1);
  });

  it("the volume on a curve", () => {
    expect(gainOf(0)).toBe(0);
    expect(gainOf(100)).toBeCloseTo(0.9);
    expect(gainOf(50)).toBeLessThan(gainOf(100) / 2);
  });

  it("the preview fills a pipeline, waits in a stall, aborts an instruction and changes the chord", () => {
    const cycles = play(PREVIEW, PREVIEW_CYCLE_MS);
    for (const notes of cycles) expect(notes.length).toBeLessThanOrEqual(MAX_VOICES);
    const timbres = cycles.map((notes) => notes.map((note) => note.timbre).join(" "));
    expect(timbres[0]).toBe("bass");
    expect(timbres).toContain("muted bell");
    expect(timbres.some((value) => value.startsWith("pluck pluck"))).toBe(true);
    expect(new Set(PREVIEW.map((value) => chordAt(value.position).name)).size).toBeGreaterThan(2);
  });
});
