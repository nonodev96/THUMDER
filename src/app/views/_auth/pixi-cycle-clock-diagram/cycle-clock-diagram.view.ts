import { Component, computed, inject, signal, ViewChild } from "@angular/core";
import { PixiCycleClockDiagramComponent } from "@components/pixi-cycle-clock-diagram/pixi-cycle-clock-diagram.component";
import { SuperscalarDiagramComponent } from "@components/superscalar-diagram/superscalar-diagram.component";
import { diagramToCsv, diagramToSvg } from "@core/machine/diagram-export";
import { MachineService } from "@core/machine/machine.service";
import { explainCell, stallCells } from "@core/machine/stall-explanation";
import { TranslatePipe } from "@ngx-translate/core";
import { DropdownDirective } from "@shared/directives/bootstrap/dropdown.directive";
import { download } from "@shared/utils/download";
import { CardDirective, CardWidgetDirective } from "../../../__shared/directives/card/card.directive";
import { DetailsDirective } from "../../../__shared/directives/details/details.directive";

/** The cycles of the table of the diagram */
const TABLE_CYCLES = 30;

@Component({
  selector: "view-cycle-clock-diagram",
  templateUrl: "./cycle-clock-diagram.view.html",
  imports: [
    CardDirective,
    CardWidgetDirective,
    DetailsDirective,
    PixiCycleClockDiagramComponent,
    SuperscalarDiagramComponent,
    TranslatePipe,
    DropdownDirective,
  ],
})
export class CycleClockDiagramView {
  private machine = inject(MachineService);

  /** SuperDLX has its own diagram: the events of each instruction (fetch, decode, issue, result, commit) */
  public readonly superscalar = computed(() => this.machine.state.architecture() === "superdlx");

  @ViewChild(PixiCycleClockDiagramComponent)
  public pixi_CycleClockDiagramComponent!: PixiCycleClockDiagramComponent;

  public inCanvas: boolean = false;

  /** The cell chosen in the diagram (the id of its row and its cycle) */
  public readonly selected = signal<{ id: number; cycle: number } | null>(null);

  /** What the chosen cell means (EDU-01) */
  public readonly explanation = computed(() => {
    this.machine.state.diagram();
    const cell = this.selected();
    if (cell === null) return [];
    const row = this.machine.diagram.indexOf(cell.id);
    return row < 0 ? [] : explainCell(this.machine.diagram, row, cell.cycle, this.machine.enabledForwarding);
  });

  public handleInCanvas($event: boolean): void {
    this.inCanvas = $event;
  }

  /** The stall before or after the chosen cell (the first one, with none chosen) */
  public goToStall(direction: 1 | -1): void {
    const diagram = this.machine.diagram;
    const stalls = stallCells(diagram).map(([row, cycle]) => ({ id: diagram.firstRow + row, cycle }));
    if (stalls.length === 0) {
      this.pixi_CycleClockDiagramComponent.select(null);
      this.noStalls.set(true);
      return;
    }
    this.noStalls.set(false);
    const current = this.selected();
    const index = current === null ? -1 : stalls.findIndex((cell) => cell.cycle === current.cycle && cell.id === current.id);
    const after = (cell: { id: number; cycle: number }) =>
      current === null || cell.cycle > current.cycle || (cell.cycle === current.cycle && cell.id > current.id);
    const next =
      index >= 0
        ? stalls[(index + direction + stalls.length) % stalls.length]
        : direction === 1
          ? (stalls.find(after) ?? stalls[0])
          : ([...stalls].reverse().find((cell) => !after(cell)) ?? stalls[stalls.length - 1]);
    this.pixi_CycleClockDiagramComponent.select(next);
  }

  public readonly noStalls = signal(false);

  /** The diagram as a table (A11Y-01): the last cycles, for the screen readers and for reading it in text */
  public readonly asTable = signal(false);
  public readonly table = computed(() => {
    this.machine.state.diagram();
    const diagram = this.machine.diagram;
    if (!this.asTable()) return { cycles: [] as number[], rows: [] as { text: string; cells: string[] }[] };
    const first = Math.max(diagram.firstCycle, diagram.cycles - TABLE_CYCLES);
    const cycles = Array.from({ length: diagram.cycles - first }, (_, i) => first + i);
    const rows = diagram.rows
      .map((text, row) => ({ text, cells: cycles.map((cycle) => diagram.cell(row, cycle) ?? "") }))
      .filter((row) => row.cells.some((cell) => cell !== ""));
    return { cycles, rows };
  });

  public exportCsv(): void {
    download("diagrama-de-ciclos.csv", diagramToCsv(this.machine.diagram), "text/csv");
  }

  public exportSvg(): void {
    download("diagrama-de-ciclos.svg", diagramToSvg(this.machine.diagram), "image/svg+xml");
  }

  public async exportPng(): Promise<void> {
    const blob = await this.pixi_CycleClockDiagramComponent.toPng();
    if (blob) download("diagrama-de-ciclos.png", blob);
  }
}
