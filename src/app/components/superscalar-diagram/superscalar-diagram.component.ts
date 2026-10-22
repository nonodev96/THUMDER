import { ChangeDetectionStrategy, Component, computed, inject, signal } from "@angular/core";
import type { TypeAddress } from "@app/Types";
import { poolLabel } from "@components/superscalar-machine/superscalar-machine.component";
import { MachineService } from "@core/machine/machine.service";
import { lastCycle, type TimelineCell, type TimelineRow, timelineCell } from "@core/machine/superscalar-timeline";
import { TranslatePipe } from "@ngx-translate/core";
import { VirtualTableColumnDirective, VirtualTableComponent } from "@shared/components/virtual-table/virtual-table.component";
import { download } from "@shared/utils/download";

const at = (pc: number) => `0x${(pc >>> 0).toString(16).toUpperCase().padStart(8, "0")}` as TypeAddress;

/** The widths of the diagram, in cycles */
const WIDTHS = [16, 32, 64] as const;
/** The most instructions the diagram draws at once */
const MAX_ROWS = 150;

export type DiagramTab = "diagram" | "events";

/** The cells of the legend, in the order an instruction goes through them */
export const CELLS: TimelineCell[] = ["F", "q", "D", "w", "E", "M", "W", "r", "C", "X"];

/** The history of SuperDLX as a table: an instruction in each row, the cycle of each event (EDU-06) */
export function timelineToCsv(rows: readonly TimelineRow[], text: (pc: number) => string): string {
  const cell = (value: number | undefined) => (value === undefined ? "" : String(value));
  const lines = ["row,address,instruction,unit,fetch,decode,issue,memory,result,commit,squashed,mispredicted"];
  for (const row of rows) {
    lines.push(
      [
        row.row,
        at(row.pc),
        `"${text(row.pc).replace(/"/g, '""')}"`,
        row.pool ?? "",
        row.fetch,
        cell(row.dispatch),
        cell(row.issue),
        cell(row.memory),
        cell(row.complete),
        cell(row.commit),
        cell(row.squash),
        row.mispredicted ? 1 : 0,
      ].join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}

/**
 * The cycles of SuperDLX: each instruction in a row, in fetch order, with what it does in each cycle (fetch, queue,
 * decode, window, unit, memory, result, ROB, commit, squashed), as the history of WinSuperDLX. Two views: the diagram of
 * the last cycles, that can go back, and the table with the cycle of each event of every instruction. Choosing an
 * instruction says how long it waited in each place.
 */
@Component({
  selector: "thumder-superscalar-diagram",
  templateUrl: "./superscalar-diagram.component.html",
  styleUrls: ["./superscalar-diagram.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, VirtualTableComponent, VirtualTableColumnDirective],
})
export class SuperscalarDiagramComponent {
  private machine = inject(MachineService);

  public readonly cells = CELLS;
  public readonly widths = WIDTHS;
  public readonly tab = signal<DiagramTab>("diagram");
  public readonly width = signal<number>(WIDTHS[1]);
  /** The last cycle shown (null: the current one, following the simulation) */
  public readonly until = signal<number | null>(null);
  public readonly selected = signal<number | null>(null);

  /** The cycles run */
  public readonly cycles = computed(() => {
    this.machine.state.timeline();
    return this.machine.timeline.cycles;
  });

  /** The cycles drawn: the last `width` up to `until` */
  public readonly window = computed(() => {
    const last = Math.max(0, Math.min(this.until() ?? Number.POSITIVE_INFINITY, this.cycles() - 1));
    const first = Math.max(0, last - this.width() + 1);
    return { first, last, cycles: Array.from({ length: last - first + 1 }, (_, i) => first + i) };
  });

  /** The instructions in the machine in those cycles, with their cells */
  public readonly diagram = computed(() => {
    this.machine.state.timeline();
    const { first, last, cycles } = this.window();
    const rows = this.machine.timeline.between(first, last);
    const shown = rows.slice(-MAX_ROWS);
    return {
      cut: rows.length - shown.length,
      rows: shown.map((row) => ({ row, cells: cycles.map((cycle) => timelineCell(row, cycle)) })),
    };
  });

  /** Every instruction kept, for the table of events */
  public readonly rows = computed(() => {
    this.machine.state.timeline();
    return this.tab() === "events" ? this.machine.timeline.rows : [];
  });

  public readonly eventColumns = ["Instruction", "Unit", "F", "D", "I", "M", "W", "C"];

  /** The instruction chosen and how long it was in each place */
  public readonly detail = computed(() => {
    this.machine.state.timeline();
    const chosen = this.selected();
    if (chosen === null) return null;
    const row = this.machine.timeline.rows.find((other) => other.row === chosen);
    if (row === undefined) return null;
    const span = (from: number | undefined, to: number | undefined) =>
      from === undefined || to === undefined ? null : Math.max(0, to - from);
    return {
      row,
      queue: span(row.fetch, row.dispatch),
      window: span(row.dispatch, row.issue),
      unit: span(row.issue, row.complete),
      rob: span(row.complete, row.commit),
      total: row.commit === undefined ? null : row.commit - row.fetch + 1,
    };
  });

  public text(pc: number): string {
    this.machine.state.code();
    return this.machine.code.get(at(pc))?.instruction ?? at(pc);
  }

  public poolLabel = poolLabel;

  public select(row: number): void {
    this.selected.set(this.selected() === row ? null : row);
  }

  /** Back or forward a width of cycles (forward to the current one follows the simulation again) */
  public move(direction: -1 | 1): void {
    const { last } = this.window();
    const next = last + direction * this.width();
    this.until.set(next >= this.cycles() - 1 ? null : Math.max(this.width() - 1, next));
  }

  public follow(): void {
    this.until.set(null);
  }

  public isFollowing(): boolean {
    return this.until() === null;
  }

  public trackByRow = (_index: number, row: TimelineRow) => row.row;

  public rowClass = (row: TimelineRow) => (row.squash !== undefined ? "ss-squashed" : row.mispredicted ? "ss-mispredicted" : "");

  public cellLabel(cell: TimelineCell | null): string {
    return cell === null ? "" : `SUPERSCALAR.CELL.${cell}`;
  }

  /** Whether an instruction is still in the machine */
  public inFlight(row: TimelineRow): boolean {
    return lastCycle(row) === Number.POSITIVE_INFINITY;
  }

  public exportCsv(): void {
    download(
      "superdlx-ciclos.csv",
      timelineToCsv(this.machine.timeline.rows, (pc) => this.text(pc)),
      "text/csv",
    );
  }
}
