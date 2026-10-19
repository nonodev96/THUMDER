import type { TypePipelineCellInstruction, TypePipelineInstructions, TypeStall } from "@app/Types";
import { type Decoded, decode, type RegisterUse, registerUse } from "@core/engine/isa";
import type { CycleDiagramModel } from "@core/machine/cycle-diagram.model";
import type { CycleChanges } from "@core/machine/machine.service";

// What the pipeline does in a cycle, for the datapath and the texts of each stage: the instruction of each stage (with
// its word decoded), the registers and the memory it touched and the forwarding used. Pure TypeScript.

export type StageKey = "IF" | "ID" | "intEX" | "MEM" | "WB";
export type UnitKey = "faddEX" | "fmultEX" | "fdivEX";

export const STAGE_KEYS: readonly StageKey[] = ["IF", "ID", "intEX", "MEM", "WB"];
export const UNIT_KEYS: readonly UnitKey[] = ["faddEX", "fmultEX", "fdivEX"];

/** An instruction in a stage: its id (the row of the cycle diagram), its text, its address, its stall and its word */
export type Occupant = {
  id: number | null;
  text: string;
  address: number | null;
  stall: TypeStall | null;
  decoded: Decoded | null;
  use: RegisterUse | null;
};

/** A forwarding used in the cycle: from which register of the pipeline, to which stage, and the two instructions */
export type ForwardingUse = { from: "EX/MEM" | "MEM/WB"; to: "EX" | "ID"; producer: string; consumer: string };

export type CycleActivity = {
  step: number;
  stages: Record<StageKey, Occupant | null>;
  units: Record<UnitKey, (Occupant | null)[]>;
  /** The registers written in the cycle (PC, IMAR, IR, A, B, BTA, ALU, DMAR, SDR, LDR, R1..R31, F0..F31, FPSR) */
  written: ReadonlyMap<string, number>;
  /** The general purpose registers written in WB, in order */
  writeBack: { name: string; value: number }[];
  reads: readonly { address: number; bytes: number }[];
  stores: readonly { address: number; bytes: number; value: string }[];
  /** A branch or a jump resolved in ID: its target, and whether it is taken (the instruction in IF is aborted) */
  branch: { target: number; taken: boolean } | null;
  forwarding: ForwardingUse[];
};

/** The colour of the arrows of forwarding of the simulator (engine/simulator.ts, --thumder-forwarding) */
const FORWARDING = 0x16a34a;

const BYTES: Record<string, number> = { Byte: 1, ASCII: 1, HalfWord: 2, Word: 4, Float: 4, Double: 8 };

/** A value of 32 bits in hexadecimal: 0x0000002A */
export const hex32 = (value: number) => `0x${(value >>> 0).toString(16).toUpperCase().padStart(8, "0")}`;

/** The instructions of the cycle, with their words decoded (`wordAt`: the word of the code at an address) */
export function cycleActivity(
  pipeline: TypePipelineInstructions | null,
  changes: CycleChanges | null,
  diagram: CycleDiagramModel,
  wordAt: (address: string) => number | null,
): CycleActivity {
  const occupant = (cell: TypePipelineCellInstruction | undefined): Occupant | null => {
    if (!cell || cell.draw === false || !cell.text) return null;
    const word = cell.address ? wordAt(cell.address) : null;
    const decoded = word === null ? null : decode(word);
    return {
      id: cell.id ?? null,
      text: cell.text,
      address: cell.address ? Number.parseInt(cell.address, 16) >>> 0 : null,
      stall: cell.draw === true ? null : cell.draw,
      decoded,
      use: decoded ? registerUse(decoded) : null,
    };
  };
  const written = new Map<string, number>();
  const writeBack: { name: string; value: number }[] = [];
  for (const change of changes?.registers ?? []) {
    const value = Number.parseInt(change.hexadecimalValue, 16) >>> 0;
    written.set(String(change.register), value);
    if (change.typeRegister !== "Control" || change.register === "FPSR") writeBack.push({ name: String(change.register), value });
  }
  const stages = {
    IF: occupant(pipeline?.IF),
    ID: occupant(pipeline?.ID),
    intEX: occupant(pipeline?.intEX),
    MEM: occupant(pipeline?.MEM),
    WB: occupant(pipeline?.WB),
  };
  const target = written.get("BTA");
  const pc = written.get("PC");
  return {
    step: changes?.step ?? 0,
    stages,
    units: {
      faddEX: (pipeline?.faddEX ?? []).map(occupant),
      fmultEX: (pipeline?.fmultEX ?? []).map(occupant),
      fdivEX: (pipeline?.fdivEX ?? []).map(occupant),
    },
    written,
    writeBack,
    reads: changes?.reads ?? [],
    stores: (changes?.memory ?? []).map((store) => ({
      address: Number.parseInt(store.address, 16) >>> 0,
      bytes: BYTES[store.typeData] ?? 4,
      value: store.value,
    })),
    branch: target === undefined ? null : { target, taken: pc === target },
    forwarding: forwardingOf(diagram, changes?.step ?? -1),
  };
}

/** The forwarding of a cycle: the green arrows of the cycle diagram that arrive in it */
export function forwardingOf(diagram: CycleDiagramModel, cycle: number): ForwardingUse[] {
  const used: ForwardingUse[] = [];
  for (const arrow of diagram.arrows) {
    if (arrow.color !== FORWARDING || arrow.toCycle !== cycle) continue;
    used.push({
      from: diagram.cell(arrow.fromRow, cycle) === "WB" ? "MEM/WB" : "EX/MEM",
      to: diagram.cell(arrow.toRow, cycle) === "ID" ? "ID" : "EX",
      producer: diagram.rows[arrow.fromRow] ?? "",
      consumer: diagram.rows[arrow.toRow] ?? "",
    });
  }
  return used;
}
