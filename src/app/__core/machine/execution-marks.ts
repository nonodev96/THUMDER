// Where each instruction is in the cycle shown, for the editor and the code view: the stage of the pipeline of DLX, or
// the state in the machine of SuperDLX. In DLX the editor showed only the instruction just fetched, while the registers
// change with the one in WB; in SuperDLX the one just fetched can be dozens of instructions ahead of the ones that
// commit. Now every instruction in flight is marked, with what it is doing.
import type { TypeAddress, TypePipelineInstructions } from "@app/Types";
import type { SuperscalarEvent } from "@core/engine/simulator";
import type { SuperscalarSnapshot } from "@core/engine/superscalar";
import { toAddress } from "@core/numbers";

/** A stage of DLX, or a state of SuperDLX (the names of OpState) */
export type ExecutionKind =
  | "IF"
  | "ID"
  | "intEX"
  | "faddEX"
  | "fmultEX"
  | "fdivEX"
  | "MEM"
  | "WB"
  | "queue"
  | "window"
  | "executing"
  | "address"
  | "memory"
  | "done"
  | "committed"
  | "squashed";

/** What the instructions of an address are doing, and how many of them (a loop can have several at once) */
export type ExecutionMark = { kind: ExecutionKind; count: number }[];

/** The marks of the cycle, by address, and the address the editor follows */
export type Execution = { marks: Map<TypeAddress, ExecutionMark>; focus: TypeAddress | null };

/** The marks of a line of the source, the most advanced first */
export type LineMark = { line: number; marks: ExecutionMark };

/** The order of the kinds: the most advanced first (it gives the colour of a line with several) */
const ORDER: readonly ExecutionKind[] = [
  "committed",
  "WB",
  "done",
  "MEM",
  "memory",
  "address",
  "fdivEX",
  "fmultEX",
  "faddEX",
  "intEX",
  "executing",
  "ID",
  "window",
  "IF",
  "queue",
  "squashed",
];

const rank = (kind: ExecutionKind) => ORDER.indexOf(kind);

/** Adds kinds to the mark of their address, and sorts each mark */
class Marks {
  private readonly counts = new Map<TypeAddress, Map<ExecutionKind, number>>();

  public add(address: TypeAddress | undefined, kind: ExecutionKind): void {
    if (!address) return;
    const kinds = this.counts.get(address) ?? new Map<ExecutionKind, number>();
    kinds.set(kind, (kinds.get(kind) ?? 0) + 1);
    this.counts.set(address, kinds);
  }

  public result(): Map<TypeAddress, ExecutionMark> {
    return new Map([...this.counts].map(([address, kinds]) => [address, sorted([...kinds].map(([kind, count]) => ({ kind, count })))]));
  }
}

const sorted = (mark: ExecutionMark): ExecutionMark => [...mark].sort((a, b) => rank(a.kind) - rank(b.kind));

/** DLX: the stage of each instruction of the pipeline (not the ones it does not draw: bubbles) */
export function pipelineExecution(pipeline: TypePipelineInstructions | null, fetched: TypeAddress | null = null): Execution {
  const marks = new Marks();
  if (pipeline !== null) {
    for (const stage of ["IF", "ID", "intEX", "MEM", "WB"] as const) {
      if (pipeline[stage].draw !== false) marks.add(pipeline[stage].address, stage);
    }
    for (const unit of ["faddEX", "fmultEX", "fdivEX"] as const) {
      for (const cell of pipeline[unit]) if (cell.draw !== false) marks.add(cell.address, unit);
    }
  }
  return { marks: marks.result(), focus: fetched ?? (pipeline?.IF.address || null) };
}

/**
 * SuperDLX: the state of each instruction in the machine (the queue and the reorder buffers), and the ones that
 * committed or were squashed in this cycle (they are no longer in the machine). The editor follows the last one that
 * committed: how far the program has really gone; without one, the oldest instruction in flight
 */
export function superscalarExecution(snapshot: SuperscalarSnapshot | null, events: readonly SuperscalarEvent[]): Execution {
  const marks = new Marks();
  if (snapshot === null) return { marks: marks.result(), focus: null };
  for (const op of snapshot.queue) marks.add(toAddress(op.pc), "queue");
  const inFlight: { row: number; pc: number }[] = [];
  for (const side of ["int", "fp"] as const) {
    for (const entry of snapshot.rob[side].entries) {
      const kind: ExecutionKind = entry.state === "fetched" ? "queue" : entry.state === "committed" ? "done" : entry.state;
      marks.add(toAddress(entry.pc), kind);
      inFlight.push(entry);
    }
  }
  let lastCommitted: SuperscalarEvent | null = null;
  for (const event of events) {
    if (event.kind === "C") {
      marks.add(toAddress(event.pc), "committed");
      if (lastCommitted === null || event.row > lastCommitted.row) lastCommitted = event;
    } else if (event.kind === "X") {
      marks.add(toAddress(event.pc), "squashed");
    }
  }
  const oldest = inFlight.sort((a, b) => a.row - b.row)[0] ?? snapshot.queue[0];
  const focus = lastCommitted ?? oldest;
  return { marks: marks.result(), focus: focus ? toAddress(focus.pc) : null };
}

/** The marks by line of the source (the instructions with no line, of the modules, are left out) */
export function marksByLine(marks: Map<TypeAddress, ExecutionMark>, lineOf: (address: TypeAddress) => number | undefined): LineMark[] {
  const lines = new Map<number, Map<ExecutionKind, number>>();
  for (const [address, mark] of marks) {
    const line = lineOf(address);
    if (line === undefined || line <= 0) continue;
    const kinds = lines.get(line) ?? new Map<ExecutionKind, number>();
    for (const { kind, count } of mark) kinds.set(kind, (kinds.get(kind) ?? 0) + count);
    lines.set(line, kinds);
  }
  return [...lines]
    .map(([line, kinds]) => ({ line, marks: sorted([...kinds].map(([kind, count]) => ({ kind, count }))) }))
    .sort((a, b) => a.line - b.line);
}

/** The names of the stages of DLX (the states of SuperDLX are translated: SUPERSCALAR.STATE) */
export const STAGE_LABELS: Partial<Record<ExecutionKind, string>> = {
  IF: "IF",
  ID: "ID",
  intEX: "EX",
  faddEX: "EX fadd",
  fmultEX: "EX fmul",
  fdivEX: "EX fdiv",
  MEM: "MEM",
  WB: "WB",
};

/** The text of a mark: what each instruction does, with how many when there are several ("En la ventana ×2") */
export function markLabel(mark: ExecutionMark, name: (kind: ExecutionKind) => string): string {
  return mark.map(({ kind, count }) => (count > 1 ? `${name(kind)} ×${count}` : name(kind))).join(", ");
}
