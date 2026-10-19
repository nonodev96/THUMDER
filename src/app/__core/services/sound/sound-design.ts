// What the simulation sounds like (SoundService plays it). The cycles are the beats of a short piece in C major: the
// newest instruction fetched says where the piece is, a bar every four instructions over the chords of the canon of
// Pachelbel, so a pipeline that waits holds its chord. A cycle plays at most three notes, one after another, as an
// arpeggio that fits in the cycle, and each note has a role:
// - the pulse (low): an instruction fetched in IF, the root or the fifth of the chord;
// - the middle: the instructions going on through ID, EX and MEM, on the strong beats, and a colour note (the ninth)
//   when one enters a floating point unit;
// - the melody (high, a bell): an instruction that completes in WB, a step along the chord from the note before, chosen
//   by its address (the same code, the same steps: a loop sounds as a motif).
// What goes wrong takes the place of the pulse: a stall is a soft muted low note (a tick-tock while it lasts) and an
// instruction aborted by a taken branch falls a third or a fourth. Each voice moves to the nearest note of the next
// chord. Pure TypeScript, without the Web Audio API, to be tested.
import type { TypePipeline, TypeStall } from "@app/Types";

export type SoundStage = "IF" | "ID" | "EX" | "MEM" | "WB" | "fadd" | "fmul" | "fdiv";

/** enter: the instruction arrived at the stage; stall: it waits there; abort: a taken branch discarded it */
export type StageSound = { stage: SoundStage; kind: "enter" | "stall" | "abort"; address: number };

/** The order of the stages in the pipeline */
export const STAGE_ORDER: SoundStage[] = ["IF", "ID", "EX", "fadd", "fmul", "fdiv", "MEM", "WB"];

/** Where each instruction was in the cycle before: stage (and unit) → the row of the instruction */
export type Occupancy = Map<string, number>;

/** What happened in a cycle: the sounds, where each instruction is and the row of the newest one (-1: none) */
export type CycleSounds = { sounds: StageSound[]; occupancy: Occupancy; position: number };

/**
 * The events of a cycle: each stage an instruction has just entered, each stalled one and each aborted one (each kind
 * once per stage). An instruction that goes on in the same stage (a floating unit of several cycles) is not new.
 * Returns, too, where each instruction is, for the next cycle, and the row of the newest instruction
 */
export function cycleSounds(pipeline: TypePipeline, previous: Occupancy): CycleSounds {
  const occupancy: Occupancy = new Map();
  const found = new Map<string, StageSound>();
  let position = -1;
  const visit = (stage: SoundStage, key: string, cell: { address: string; addressRow: number; draw: boolean | TypeStall }) => {
    if (!cell.address || cell.draw === false) return;
    occupancy.set(key, cell.addressRow);
    position = Math.max(position, cell.addressRow);
    let kind: StageSound["kind"] | null;
    if (cell.draw === "Aborted") kind = "abort";
    else if (cell.draw !== true) kind = "stall";
    else kind = previous.get(key) === cell.addressRow ? null : "enter";
    const address = Number.parseInt(cell.address, 16) || 0;
    if (kind !== null && !found.has(`${stage}:${kind}`)) found.set(`${stage}:${kind}`, { stage, kind, address });
  };
  visit("IF", "IF", pipeline.IF);
  visit("ID", "ID", pipeline.ID);
  visit("EX", "EX", pipeline.intEX);
  visit("MEM", "MEM", pipeline.MEM);
  visit("WB", "WB", pipeline.WB);
  const units: [SoundStage, keyof Pick<TypePipeline, "faddEX" | "fmultEX" | "fdivEX">][] = [
    ["fadd", "faddEX"],
    ["fmul", "fmultEX"],
    ["fdiv", "fdivEX"],
  ];
  for (const [stage, name] of units) {
    for (const [index, cell] of (pipeline[name] ?? []).entries()) visit(stage, `${stage}${cell.unit ?? index}`, cell);
  }
  const sounds = [...found.values()].sort((a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage));
  return { sounds, occupancy, position };
}

// ─── The music ────────────────────────────────────────────────────────────────────────────────────────────────────

/** The pitch classes of C major (0 is C): every note of a cycle is one of them */
export const SCALE = [0, 2, 4, 5, 7, 9, 11];

/** A chord: its root, third and fifth, and a colour note of the scale that sounds well over it */
export type Chord = { name: string; root: number; third: number; fifth: number; colour: number };

/** The chords of the piece, a bar each: the canon of Pachelbel (I–V–vi–iii–IV–I–IV–V), back to the start after V */
export const PROGRESSION: Chord[] = [
  { name: "C", root: 0, third: 4, fifth: 7, colour: 2 },
  { name: "G", root: 7, third: 11, fifth: 2, colour: 9 },
  { name: "Am", root: 9, third: 0, fifth: 4, colour: 11 },
  { name: "Em", root: 4, third: 7, fifth: 11, colour: 2 },
  { name: "F", root: 5, third: 9, fifth: 0, colour: 7 },
  { name: "C", root: 0, third: 4, fifth: 7, colour: 2 },
  { name: "F", root: 5, third: 9, fifth: 0, colour: 7 },
  { name: "G", root: 7, third: 11, fifth: 2, colour: 9 },
];

/** The instructions fetched in a bar */
export const BAR = 4;

/** The chord of the bar of an instruction (its row) */
export function chordAt(position: number): Chord {
  return PROGRESSION[Math.floor(Math.max(0, position) / BAR) % PROGRESSION.length];
}

/** The MIDI notes each voice moves in (60 is C4): the pulse low, the middle around C4 and the melody above */
export const RANGES = { pulse: [45, 59], middle: [57, 74], melody: [67, 81] } as const;

/**
 * The steps of the melody along the notes of the chord, by the address of the instruction that completes: runs up and
 * down, eleven of them so that they do not repeat with the bars
 */
export const MOTION = [1, 1, -1, -1, 1, -1, 1, 1, -1, -1, -1];

/** The sound of a note: SoundService has a recipe for each */
export type Timbre = "bass" | "pluck" | "bell" | "muted" | "soft" | "clash";

export type Note = {
  /** Seconds from the start of the cycle (or of the event) */
  at: number;
  /** MIDI number: 60 is C4, 69 is A4 (440 Hz) */
  midi: number;
  timbre: Timbre;
  /** The gain at its peak, before the volume */
  gain: number;
  /** Seconds until it fades out (the next cycle may cut it sooner) */
  length: number;
  /** Semitones it slides while it sounds (negative: down) */
  bend?: number;
  /** Where it sounds, from the left (-1) to the right (1) */
  pan?: number;
};

/** The frequency of a MIDI note, in Hz */
export function frequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

/** The last note of each voice (to move to the nearest note of the next chord) and the cycles the pipeline has waited */
export type Melody = { pulse: number; middle: number; melody: number; stalls: number };

/** Where the voices start: C3, E4 and C5 */
export const FIRST_MELODY: Melody = { pulse: 48, middle: 64, melody: 72, stalls: 0 };

/** The notes of some pitch classes in a range, the lowest first */
function notesOf(pitchClasses: number[], [low, high]: readonly [number, number]): number[] {
  const notes: number[] = [];
  for (let midi = low; midi <= high; midi++) if (pitchClasses.includes(midi % 12)) notes.push(midi);
  return notes;
}

/** The note of a pitch class in a range nearest to the note before (the lower one if two are as near) */
function nearest(pitchClass: number, before: number, range: readonly [number, number]): number {
  const notes = notesOf([pitchClass], range);
  return notes.reduce((best, note) => (Math.abs(note - before) < Math.abs(best - before) ? note : best), notes[0]);
}

// ─── The time ─────────────────────────────────────────────────────────────────────────────────────────────────────

/** Never more notes than these sound at a time (a cycle plays at most these) */
export const MAX_VOICES = 3;

/** Running fast, at most a cycle every this many ms sounds: faster, the ear only hears noise (the pipeline is still followed) */
export const MIN_CYCLE_MS = 90;

/** The notes of a cycle start in this part of it: the last one rings before the next cycle */
const SPREAD = 0.55;
/** Seconds between two notes of a cycle: never closer (they would sound together), never further (a slow cycle) */
const GAP_MIN = 0.05;
const GAP_MAX = 0.12;

/** How many notes a cycle of this duration plays: all of them start in its first half, at least 50 ms apart */
export function notesPerCycle(cycleMs: number): number {
  const span = (SPREAD * Math.max(cycleMs, MIN_CYCLE_MS)) / 1000;
  return Math.min(MAX_VOICES, 1 + Math.floor(span / GAP_MIN + 1e-9));
}

/** The seconds between the notes of a cycle that plays `count` of them */
export function noteGap(cycleMs: number, count: number): number {
  if (count <= 1) return 0;
  const span = (SPREAD * Math.max(cycleMs, MIN_CYCLE_MS)) / 1000;
  return Math.min(GAP_MAX, span / (count - 1));
}

/**
 * The notes of a cycle and the voices after it. The most informative events win when there is no time for all of
 * them (an aborted instruction, a stall, an instruction that completes, one fetched, the rest), and they sound from
 * the lowest role to the highest: the pulse (or what went wrong), the middle and the melody
 */
export function cycleNotes(
  cycle: Pick<CycleSounds, "sounds" | "position">,
  cycleMs: number,
  before: Melody,
): { notes: Note[]; melody: Melody } {
  const chord = chordAt(cycle.position);
  const beat = Math.max(0, cycle.position) % BAR;
  const has = (kind: StageSound["kind"], stages?: SoundStage[]) =>
    cycle.sounds.find((sound) => sound.kind === kind && (!stages || stages.includes(sound.stage)));
  const abort = has("abort");
  const stall = has("stall");
  const fetched = has("enter", ["IF"]);
  const completed = has("enter", ["WB"]);
  const floating = has("enter", ["fadd", "fmul", "fdiv"]);
  // The middle: only while the pipeline flows, on the strong beats (or a floating unit starts)
  const middle = abort || stall ? undefined : (floating ?? (beat % 2 === 0 ? has("enter", ["ID", "EX", "MEM"]) : undefined));

  // What sounds, by priority, while there is time: an aborted instruction takes two notes when it can
  let free = notesPerCycle(cycleMs);
  const take = (sound: StageSound | undefined, notes = 1) => {
    if (!sound || free === 0) return 0;
    const taken = Math.min(notes, free);
    free -= taken;
    return taken;
  };
  const low = abort ? { kind: "abort", notes: take(abort, 2) } : stall ? { kind: "stall", notes: take(stall) } : null;
  const melodyNotes = take(completed);
  const pulse = low ? 0 : take(fetched);
  const middleNotes = take(middle);

  const melody: Melody = { ...before, stalls: low?.kind === "stall" && low.notes > 0 ? before.stalls + 1 : 0 };
  const notes: Omit<Note, "at">[] = [];
  if (low?.kind === "abort" && low.notes > 0) {
    // A fall from the note of the chord nearest to G4 to the one below it (a third or a fourth)
    const tones = notesOf([chord.root, chord.third, chord.fifth], RANGES.middle);
    const top = tones.reduce((best, note) => (Math.abs(note - 67) <= Math.abs(best - 67) ? note : best), tones[0]);
    const bottom = tones[Math.max(0, tones.indexOf(top) - 1)];
    if (low.notes === 2) {
      notes.push({ midi: top, timbre: "pluck", gain: 0.16, length: 0.22, pan: -0.15 });
      notes.push({ midi: bottom, timbre: "pluck", gain: 0.14, length: 0.4, bend: -0.3, pan: -0.15 });
    } else notes.push({ midi: top, timbre: "pluck", gain: 0.16, length: 0.3, bend: bottom - top, pan: -0.15 });
    melody.middle = bottom;
  } else if (low?.kind === "stall" && low.notes > 0) {
    // Tick-tock while it waits: the root and the fifth, softer and softer
    const pitchClass = before.stalls % 2 === 0 ? chord.root : chord.fifth;
    melody.pulse = nearest(pitchClass, before.pulse, RANGES.pulse);
    const gain = 0.38 * Math.max(0.6, 1 - 0.1 * before.stalls);
    notes.push({ midi: melody.pulse, timbre: "muted", gain, length: 0.18, bend: -0.4 });
  } else if (pulse > 0) {
    // The root on the strong beats (louder on the first of the bar) and the fifth on the others
    melody.pulse = nearest(beat % 2 === 0 ? chord.root : chord.fifth, before.pulse, RANGES.pulse);
    notes.push({ midi: melody.pulse, timbre: "bass", gain: beat === 0 ? 0.3 : 0.24, length: 0.6 });
  }
  if (melodyNotes > 0 && completed) {
    // A step along the notes of the chord from the note before (back when it would leave the range)
    const tones = notesOf([chord.root, chord.third, chord.fifth], RANGES.melody);
    const from = nearestIndex(tones, before.melody);
    const step = MOTION[Math.floor(completed.address / 4) % MOTION.length];
    melody.melody = tones[from + step >= 0 && from + step < tones.length ? from + step : from - step];
  }
  if (middleNotes > 0) {
    // The third (the root when the melody plays it), or the colour of a floating point unit
    const pitchClass = floating ? chord.colour : melodyNotes > 0 && melody.melody % 12 === chord.third ? chord.root : chord.third;
    melody.middle = nearest(pitchClass, before.middle, RANGES.middle);
    notes.push({ midi: melody.middle, timbre: floating ? "soft" : "pluck", gain: floating ? 0.13 : 0.14, length: 0.45, pan: -0.3 });
  }
  if (melodyNotes > 0) notes.push({ midi: melody.melody, timbre: "bell", gain: 0.19, length: 0.9, pan: 0.3 });
  const gap = noteGap(cycleMs, notes.length);
  return { notes: notes.map((note, index) => ({ ...note, at: index * gap })), melody };
}

/** The index of the note of a list nearest to another one (the lower one if two are as near) */
function nearestIndex(notes: number[], before: number): number {
  let best = 0;
  for (const [index, note] of notes.entries()) if (Math.abs(note - before) < Math.abs(notes[best] - before)) best = index;
  return best;
}

// ─── The events ───────────────────────────────────────────────────────────────────────────────────────────────────

/** The events of the simulation that have their own sound */
export type SoundEvent = "load" | "errors" | "error" | "complete" | "breakpoint" | "input" | "clear" | "back";

/** A note of an event */
const note = (at: number, midi: number, timbre: Timbre, gain: number, length: number, extra: Partial<Note> = {}): Note => ({
  at,
  midi,
  timbre,
  gain,
  length,
  ...extra,
});

/** The notes of each event: never more than MAX_VOICES at a time either */
export const EVENT_NOTES: Record<SoundEvent, Note[]> = {
  // Ready: C, E and G going up
  load: [note(0, 72, "pluck", 0.2, 0.3), note(0.07, 76, "pluck", 0.2, 0.3), note(0.14, 79, "pluck", 0.2, 0.4)],
  // Something is wrong in the program: two low notes that clash
  errors: [note(0, 57, "clash", 0.13, 0.4), note(0, 58, "clash", 0.13, 0.4)],
  // Something went wrong while it ran: the clash, and again lower
  error: [
    note(0, 57, "clash", 0.13, 0.17),
    note(0, 58, "clash", 0.13, 0.17),
    note(0.18, 53, "clash", 0.13, 0.4),
    note(0.18, 54, "clash", 0.13, 0.4),
  ],
  // The end: G, C and E going up, then a low C, a bell and a G that ring together
  complete: [
    note(0, 67, "pluck", 0.18, 0.28),
    note(0.09, 72, "pluck", 0.18, 0.28),
    note(0.18, 76, "pluck", 0.18, 0.3),
    note(0.3, 48, "bass", 0.26, 1.6),
    note(0.4, 84, "bell", 0.12, 1.5, { pan: 0.3 }),
    note(0.52, 79, "soft", 0.09, 1.2, { pan: -0.3 }),
  ],
  // Stop here: two bells going up
  breakpoint: [note(0, 83, "bell", 0.16, 0.7, { pan: 0.2 }), note(0.14, 88, "bell", 0.16, 0.8, { pan: 0.2 })],
  // A question: two soft notes going up, the second one not home yet
  input: [note(0, 76, "soft", 0.16, 0.3), note(0.13, 81, "soft", 0.16, 0.45)],
  // Everything to zero: C, G, E and C going down
  clear: [
    note(0, 84, "pluck", 0.14, 0.16),
    note(0.06, 79, "pluck", 0.14, 0.16),
    note(0.12, 76, "pluck", 0.14, 0.16),
    note(0.18, 72, "pluck", 0.14, 0.3),
  ],
  // A cycle back: a short note that slides down
  back: [note(0, 76, "soft", 0.15, 0.14, { bend: -4 })],
};

/** The volume of the configuration (0 to 100) as a gain: the ear hears it better on a curve */
export function gainOf(volume: number): number {
  const level = Math.min(100, Math.max(0, volume)) / 100;
  return level * level * 0.9;
}

// ─── The preview ──────────────────────────────────────────────────────────────────────────────────────────────────

/** The ms of a cycle of the preview */
export const PREVIEW_CYCLE_MS = 280;

/** The cycles of the preview: a pipeline that fills and flows, a stall, a taken branch and a new bar */
export const PREVIEW: Pick<CycleSounds, "sounds" | "position">[] = (() => {
  const at = (row: number) => 0x100 + row * 4;
  const cycle = (position: number, ...events: [SoundStage, StageSound["kind"], number][]) => ({
    position,
    sounds: events.map(([stage, kind, row]) => ({ stage, kind, address: at(row) })),
  });
  return [
    cycle(0, ["IF", "enter", 0]),
    cycle(1, ["IF", "enter", 1], ["ID", "enter", 0]),
    cycle(2, ["IF", "enter", 2], ["ID", "enter", 1], ["EX", "enter", 0]),
    cycle(3, ["IF", "enter", 3], ["ID", "enter", 2], ["EX", "enter", 1], ["MEM", "enter", 0]),
    cycle(4, ["IF", "enter", 4], ["ID", "enter", 3], ["EX", "enter", 2], ["MEM", "enter", 1], ["WB", "enter", 0]),
    cycle(5, ["IF", "enter", 5], ["ID", "enter", 4], ["EX", "enter", 3], ["MEM", "enter", 2], ["WB", "enter", 1]),
    cycle(5, ["IF", "stall", 5], ["ID", "stall", 4], ["MEM", "enter", 3], ["WB", "enter", 2]),
    cycle(6, ["IF", "enter", 6], ["ID", "enter", 5], ["EX", "enter", 4], ["WB", "enter", 3]),
    cycle(7, ["IF", "abort", 7], ["ID", "enter", 6], ["EX", "enter", 5], ["MEM", "enter", 4]),
    cycle(8, ["IF", "enter", 8], ["EX", "enter", 6], ["MEM", "enter", 5], ["WB", "enter", 4]),
    cycle(9, ["IF", "enter", 9], ["ID", "enter", 8], ["MEM", "enter", 6], ["WB", "enter", 5]),
  ];
})();
