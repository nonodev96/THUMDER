import type { SuperscalarEvent } from "@core/engine/simulator";
import type { PoolKey, Side } from "@core/engine/superscalar-config";

/** An instruction of SuperDLX, from fetch to commit: the cycle of each of its events */
export type TimelineRow = {
  /** The number of the instruction, in fetch order */
  row: number;
  pc: number;
  side: Side;
  pool: PoolKey | null;
  fetch: number;
  dispatch?: number;
  issue?: number;
  memory?: number;
  complete?: number;
  commit?: number;
  squash?: number;
  /** A branch whose prediction was wrong */
  mispredicted?: boolean;
  /** NOP and J: done in fetch, they only wait to commit */
  retired?: boolean;
};

/**
 * What an instruction is doing in a cycle, as the diagram draws it: fetch (F), in the queue (q), decode (D), waiting
 * in its window (w), in its unit (E), memory access (M), result (W), waiting in the ROB (r), commit (C), squashed (X)
 */
export type TimelineCell = "F" | "q" | "D" | "w" | "E" | "M" | "W" | "r" | "C" | "X";

/** The cell of an instruction in a cycle, or null if it is not in the machine in that cycle */
export function timelineCell(row: TimelineRow, cycle: number): TimelineCell | null {
  if (cycle < row.fetch) return null;
  if (row.squash !== undefined && cycle >= row.squash) return cycle === row.squash ? "X" : null;
  // A store writes the memory after it commits
  const written = row.memory !== undefined && row.commit !== undefined && row.memory > row.commit;
  if (row.commit !== undefined && cycle > row.commit) return written && cycle === row.memory ? "M" : null;
  if (cycle === row.commit) return "C";
  if (cycle === row.fetch) return "F";
  if (row.retired) return "r";
  if (row.dispatch === undefined || cycle < row.dispatch) return "q";
  if (cycle === row.dispatch) return "D";
  if (row.complete !== undefined && cycle === row.complete) return "W";
  if (row.complete !== undefined && cycle > row.complete) return "r";
  if (row.issue === undefined || cycle < row.issue) return "w";
  if (row.memory !== undefined && !written && cycle >= row.memory) return "M";
  return "E";
}

/** The last cycle an instruction is in the machine (infinite while it is) */
export function lastCycle(row: TimelineRow): number {
  if (row.squash !== undefined) return row.squash;
  if (row.commit === undefined) return Number.POSITIVE_INFINITY;
  return Math.max(row.commit, row.memory ?? 0);
}

/**
 * The history of SuperDLX for the diagram of cycles: the instructions in fetch order, with their events. It keeps the
 * last `limit` instructions (the oldest go). It lives in MachineService, so it is complete when its view opens.
 */
export class SuperscalarTimeline {
  /** The instructions kept */
  public limit = 2000;
  /** The cycles run */
  public cycles = 0;
  private readonly byRow = new Map<number, TimelineRow>();

  public reset(): void {
    this.byRow.clear();
    this.cycles = 0;
  }

  /** The events of a cycle */
  public add(cycle: number, events: readonly SuperscalarEvent[]): void {
    this.cycles = Math.max(this.cycles, cycle + 1);
    for (const event of events) {
      if (event.kind === "F") {
        const row: TimelineRow = { row: event.row, pc: event.pc, side: event.side ?? "int", pool: event.pool ?? null, fetch: cycle };
        if (event.retired) row.retired = true;
        this.byRow.set(event.row, row);
        continue;
      }
      const row = this.byRow.get(event.row);
      if (row === undefined) continue;
      switch (event.kind) {
        case "D":
          row.dispatch = cycle;
          break;
        case "I":
          row.issue = cycle;
          if (event.mispredicted) row.mispredicted = true;
          break;
        case "M":
          row.memory = cycle;
          break;
        case "W":
          row.complete = cycle;
          break;
        case "C":
          row.commit = cycle;
          break;
        case "X":
          row.squash = cycle;
          break;
      }
    }
    if (this.byRow.size > this.limit) {
      const extra = this.byRow.size - this.limit;
      let removed = 0;
      for (const key of this.byRow.keys()) {
        if (removed++ >= extra) break;
        this.byRow.delete(key);
      }
    }
  }

  /** The instructions, in fetch order */
  public get rows(): TimelineRow[] {
    return [...this.byRow.values()];
  }

  public get size(): number {
    return this.byRow.size;
  }

  /** The instructions in the machine at some cycle between `from` and `to` (both included) */
  public between(from: number, to: number): TimelineRow[] {
    return this.rows.filter((row) => row.fetch <= to && lastCycle(row) >= from);
  }
}
