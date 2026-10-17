// What the simulation sounds like (SoundService plays it). Each stage of the pipeline has a note of the pentatonic scale
// of C, so that any group of them sounds well together: when an instruction enters a stage, its note sounds, and a full
// pipeline is a chord played from IF to WB. What goes wrong sounds different: a stalled instruction is a dull knock and
// one aborted by a taken branch falls. Pure TypeScript, without the Web Audio API, to be tested.
import type { TypePipeline, TypeStall } from "@app/Types";

export type SoundStage = "IF" | "ID" | "EX" | "MEM" | "WB" | "fadd" | "fmul" | "fdiv";

/** enter: the instruction arrived at the stage; stall: it waits there; abort: a taken branch discarded it */
export type StageSound = { stage: SoundStage; kind: "enter" | "stall" | "abort" };

/** The note of each stage, in Hz: G4, C5, E5, G5 and C6 for the integer pipeline; A4, D5 and A5 for the floating units */
export const STAGE_NOTES: Record<SoundStage, number> = {
  IF: 392.0,
  ID: 523.25,
  EX: 659.25,
  MEM: 783.99,
  WB: 1046.5,
  fadd: 440.0,
  fmul: 587.33,
  fdiv: 880.0,
};

/** The order in which a cycle is played: as the instructions go through the pipeline */
export const STAGE_ORDER: SoundStage[] = ["IF", "ID", "EX", "fadd", "fmul", "fdiv", "MEM", "WB"];

/** Where each instruction was in the cycle before: stage (and unit) → the row of the instruction */
export type Occupancy = Map<string, number>;

/**
 * The sounds of a cycle: a note for each stage an instruction has just entered, a knock for each stalled one and a fall
 * for the aborted ones (each kind once per stage). An instruction that goes on in the same stage (a floating unit of
 * several cycles) does not sound again. Returns, too, where each instruction is, for the next cycle
 */
export function cycleSounds(pipeline: TypePipeline, previous: Occupancy): { sounds: StageSound[]; occupancy: Occupancy } {
  const occupancy: Occupancy = new Map();
  const found = new Map<string, StageSound>();
  const visit = (stage: SoundStage, key: string, cell: { address: string; addressRow: number; draw: boolean | TypeStall }) => {
    if (!cell.address || cell.draw === false) return;
    occupancy.set(key, cell.addressRow);
    let kind: StageSound["kind"] | null;
    if (cell.draw === "Aborted") kind = "abort";
    else if (cell.draw !== true) kind = "stall";
    else kind = previous.get(key) === cell.addressRow ? null : "enter";
    if (kind !== null && !found.has(`${stage}:${kind}`)) found.set(`${stage}:${kind}`, { stage, kind });
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
  return { sounds, occupancy };
}

/** The events of the simulation that have their own sound */
export type SoundEvent = "load" | "errors" | "error" | "complete" | "breakpoint" | "input" | "clear" | "back";

/** The volume of the configuration (0 to 100) as a gain: the ear hears it better on a curve */
export function gainOf(volume: number): number {
  const level = Math.min(100, Math.max(0, volume)) / 100;
  return level * level * 0.9;
}

/**
 * The time between the notes of a cycle, in seconds: a strum, shorter when the cycles come faster so that a cycle ends
 * before the next one
 */
export function strumGap(cycleMs: number): number {
  return Math.min(0.03, Math.max(0.008, cycleMs / 1000 / 12));
}
