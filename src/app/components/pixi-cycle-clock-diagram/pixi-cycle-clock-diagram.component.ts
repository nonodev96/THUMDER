import {
  type AfterViewInit,
  Component,
  type ElementRef,
  EventEmitter,
  effect,
  HostListener,
  inject,
  type OnDestroy,
  Output,
  untracked,
  ViewChild,
} from "@angular/core";
import { DEFAULT_CANVAS_HEIGHT, DEFAULT_CANVAS_WIDTH } from "@app/CONSTANTS";
import type { DiagramLabel } from "@core/machine/cycle-diagram.model";
import { MachineService } from "@core/machine/machine.service";
import { PIXI } from "@core/machine/pixi";
import { ThemeService } from "@core/services/theme/theme.service";
import { TranslateService } from "@ngx-translate/core";

// The geometry of the diagram, in units of the drawing (the stage is scaled to the zoom)
const LEFT = 200; // the column of the instructions
const TOP = 80; // the row of the cycles
const COLUMN = 87.5; // a cycle
const ROW = 37.5; // an instruction
const CELL_WIDTH = 75;
const CELL_HEIGHT = 25;
const CELL_MARGIN = (COLUMN - CELL_WIDTH) / 2;
const ROW_MARGIN = (ROW - CELL_HEIGHT) / 2;
const MOVE = 10; // what the arrows, the buttons and the keys move

/** The colour of the border of each cell: each stage has its own, and the stalls are shades of yellow */
const COLOURS: Record<DiagramLabel, number> = {
  IF: 0xffff00,
  ID: 0xff9900,
  intEX: 0xff0000,
  MEM: 0x00ff00,
  WB: 0xff00ff,
  faddEX: 0x00ccff,
  fmultEX: 0x3399ff,
  fdivEX: 0x9966ff,
  Aborted: 0xcccccc,
  "R-Stall": 0xffaf00,
  "T-Stall": 0xffbf00,
  "W-Stall": 0xffcf00,
  Stall: 0xffdf00,
  "S-Stall": 0xffef00,
};

const FONT = "thumder-diagram";

/**
 * The cycle clock diagram, drawn from its model (MachineService.diagram). It only draws the rows and the cycles that are
 * visible, with a fixed set of PixiJS objects that it reuses, and only when something changes (no animation loop). It
 * follows the last cycle unless the user moves back. It moves with the arrows of its card, the keys (when it has the
 * focus), the mouse and the finger, and zooms with the buttons, + and -, Ctrl + wheel and two fingers.
 */
@Component({
  selector: "THUMDER-pixi-cycle-clock-diagram",
  templateUrl: "./pixi-cycle-clock-diagram.component.html",
  styleUrls: ["./pixi-cycle-clock-diagram.component.scss"],
})
export class PixiCycleClockDiagramComponent implements AfterViewInit, OnDestroy {
  machine = inject(MachineService);
  private translate = inject(TranslateService);

  @ViewChild("pixiCycleContainer")
  public pixiContainer!: ElementRef<HTMLDivElement>;

  /** Whether the diagram has the focus (the view shows a closed hand) */
  @Output()
  public inCanvasEventEmitter: EventEmitter<boolean> = new EventEmitter<boolean>();

  /**
   * The cell chosen with a click or a tap, to explain it (EDU-01): the id of its row (the index changes when the oldest
   * rows go) and its cycle
   */
  @Output()
  public cellSelected = new EventEmitter<{ id: number; cycle: number } | null>();
  public selected: { id: number; cycle: number } | null = null;
  /** Where the pointer went down: a click that does not move selects a cell */
  private pressed: { x: number; y: number } | null = null;

  public pApp!: PIXI.Application;
  private readonly idCanvas: string = "pixi-cycle-clock-diagram-id";
  private resizeObserver?: ResizeObserver;

  /** What is visible: the drawing moved this much to the left and up, in units of the drawing */
  public scrollX = 0;
  public scrollY = 0;
  /** Following the last cycle and the last instruction (until the user moves back) */
  private followX = true;
  private followY = true;
  /** The zoom of the user (buttons of the card, pinch, Ctrl + wheel and the keys + - 0) */
  public zoom = 1;
  private width = 0;
  private height = 0;

  // The objects of the drawing, reused on every render
  private readonly cells = new PIXI.Graphics();
  private readonly arrows = new PIXI.Graphics();
  private readonly headers = new PIXI.Graphics();
  private readonly cellTexts: PIXI.BitmapText[] = [];
  private readonly rowTexts: PIXI.BitmapText[] = [];
  private readonly cycleTexts: PIXI.BitmapText[] = [];
  private readonly cellLayer = new PIXI.Container();
  private readonly headerLayer = new PIXI.Container();
  private title!: PIXI.Text;
  private drawn = false;

  // Dragging the diagram with a finger or the mouse: where the pointer was
  private drag: { x: number; y: number; pointerId: number } | null = null;
  // Two fingers on the canvas zoom it: where they are, and their distance the last time the zoom changed
  private readonly pointers = new Map<number, { x: number; y: number }>();
  private pinchDistance: number | null = null;

  private theme = inject(ThemeService);

  /** The colour of the canvas: light grey, or dark with the dark theme */
  private background(): number {
    return this.theme.dark() ? 0x2b3035 : 0xeeeeee;
  }

  constructor() {
    // The background follows the theme (UI-07)
    effect(() => {
      const colour = this.background();
      if (this.pApp?.renderer) this.pApp.renderer.background.color = colour;
      untracked(() => this.render());
    });
    // A new cycle, a new program or a new configuration: draw again
    effect(() => {
      this.machine.state.diagram();
      untracked(() => this.render());
    });
  }

  ngAfterViewInit(): void {
    if (!PIXI.BitmapFont.available[FONT]) {
      // White glyphs: each text gets its colour with `tint`
      PIXI.BitmapFont.from(FONT, { fontFamily: "Arial", fontSize: 15, fill: "#ffffff" }, { chars: PIXI.BitmapFont.ASCII, resolution: 2 });
    }
    const canvas = document.createElement("canvas");
    canvas.id = this.idCanvas;
    canvas.style.display = "block";
    // The diagram moves with the pointer instead of scrolling the page (see onPointerMove)
    canvas.style.touchAction = "none";
    // It takes the focus, and only then the keys move it (not the arrows of the editor or the tables)
    canvas.tabIndex = 0;
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", this.translate.instant("MACHINE.CYCLE_CLOCK_DIAGRAM_KEYS"));
    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerup", this.onPointerUp);
    canvas.addEventListener("pointercancel", this.onPointerUp);
    canvas.addEventListener("wheel", this.onWheel, { passive: false });
    canvas.addEventListener("keydown", this.onKeydown);
    canvas.addEventListener("focus", () => this.inCanvasEventEmitter.emit(true));
    canvas.addEventListener("blur", () => this.inCanvasEventEmitter.emit(false));
    this.pApp = new PIXI.Application({
      width: DEFAULT_CANVAS_WIDTH,
      height: DEFAULT_CANVAS_HEIGHT,
      backgroundColor: this.background(),
      // Sharp on high density screens (phones, tablets), at most twice the pixels
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      // Drawn only when something changes
      autoStart: false,
      view: canvas,
    });
    this.title = new PIXI.Text("Cycle clock", { fontFamily: "Arial", fontSize: 30, fill: "white" });
    this.cellLayer.addChild(this.cells, this.arrows);
    this.headerLayer.addChild(this.headers, this.title);
    this.pApp.stage.addChild(this.cellLayer, this.headerLayer);
    this.pixiContainer.nativeElement.appendChild(this.pApp.view as unknown as Node);

    // The card changes its width with the window, the sidebar and the windows of the multiview
    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(this.pixiContainer.nativeElement);
    this.drawn = true;
    this.resizeCanvas();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.pApp?.destroy(false, { children: true });
  }

  // Window resizes also change the height of the canvas (the width comes from the ResizeObserver)
  @HostListener("window:resize")
  public onResize(): void {
    this.resizeCanvas();
  }

  private get scale(): number {
    return (this.width < 600 ? 0.7 : 1) * this.zoom;
  }

  /** The size of the area of the cells, in units of the drawing */
  private get viewWidth(): number {
    return this.width / this.scale - LEFT;
  }

  private get viewHeight(): number {
    return this.height / this.scale - TOP;
  }

  private get maxScrollX(): number {
    return Math.max(0, (this.machine.diagram.cycles - this.machine.diagram.firstCycle) * COLUMN - this.viewWidth + CELL_MARGIN);
  }

  private get maxScrollY(): number {
    return Math.max(0, this.machine.diagram.rows.length * ROW - this.viewHeight + ROW_MARGIN);
  }

  /** Moves the drawing (positive: to see the cycles on the right and the instructions below) */
  public scrollBy(dx: number, dy: number): void {
    this.scrollX = Math.min(this.maxScrollX, Math.max(0, this.scrollX + dx));
    this.scrollY = Math.min(this.maxScrollY, Math.max(0, this.scrollY + dy));
    // At the end, it follows the new cycles again
    if (dx !== 0) this.followX = this.scrollX >= this.maxScrollX;
    if (dy !== 0) this.followY = this.scrollY >= this.maxScrollY;
    this.render();
  }

  // The arrows of the card (their names say where the drawing goes)
  public moveBottom(): void {
    this.scrollBy(0, -MOVE);
  }

  public moveTop(): void {
    this.scrollBy(0, MOVE);
  }

  public moveRight(): void {
    this.scrollBy(-MOVE, 0);
  }

  public moveLeft(): void {
    this.scrollBy(MOVE, 0);
  }

  /** What is visible of the diagram, as a PNG image (EDU-06) */
  public async toPng(): Promise<Blob | null> {
    this.render();
    const canvas = this.pApp.renderer.extract.canvas(this.pApp.stage) as HTMLCanvasElement;
    return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/png"));
  }

  public zoomBy(factor: number): void {
    this.zoom = Math.min(2.5, Math.max(0.4, this.zoom * factor));
    this.resizeCanvas();
  }

  public resetZoom(): void {
    this.zoom = 1;
    this.resizeCanvas();
  }

  /** Ctrl + wheel zooms (a touchpad sends its pinch like this); the wheel alone scrolls the page */
  private onWheel = (event: WheelEvent): void => {
    if (!event.ctrlKey) return;
    event.preventDefault();
    this.zoomBy(Math.exp(-event.deltaY * 0.002));
  };

  /** With the focus: the arrows (or J L I K) move it, + and - zoom, 0 goes back to the initial size, Home (or R) and End */
  private onKeydown = (event: KeyboardEvent): void => {
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-MOVE, 0],
      KeyJ: [-MOVE, 0],
      ArrowRight: [MOVE, 0],
      KeyL: [MOVE, 0],
      ArrowUp: [0, -MOVE],
      KeyI: [0, -MOVE],
      ArrowDown: [0, MOVE],
      KeyK: [0, MOVE],
    };
    const move = moves[event.key] ?? moves[event.code];
    if (move) {
      event.preventDefault();
      this.scrollBy(...move);
    } else if (event.key === "+") this.zoomBy(1.25);
    else if (event.key === "-") this.zoomBy(1 / 1.25);
    else if (event.key === "0") this.resetZoom();
    else if (event.key === "Home" || event.code === "KeyR") this.scrollBy(-this.scrollX, -this.scrollY);
    else if (event.key === "End") this.scrollBy(this.maxScrollX - this.scrollX, this.maxScrollY - this.scrollY);
  };

  private get fingersDistance(): number {
    const [a, b] = [...this.pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  private onPointerDown = (event: PointerEvent): void => {
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    this.pressed = this.pointers.size === 1 ? { x: event.clientX, y: event.clientY } : null;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    if (this.pointers.size === 2) {
      // The second finger: a pinch, not a drag
      this.drag = null;
      this.pinchDistance = this.fingersDistance;
    } else if (this.pointers.size === 1) {
      this.drag = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
    }
  };

  /** The drawing follows the pointer */
  private onPointerMove = (event: PointerEvent): void => {
    if (this.pointers.has(event.pointerId)) this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (this.pointers.size === 2 && this.pinchDistance) {
      const distance = this.fingersDistance;
      this.zoomBy(distance / this.pinchDistance);
      this.pinchDistance = distance;
      return;
    }
    if (this.drag === null || this.drag.pointerId !== event.pointerId) return;
    const scale = this.scale;
    this.scrollBy((this.drag.x - event.clientX) / scale, (this.drag.y - event.clientY) / scale);
    this.drag.x = event.clientX;
    this.drag.y = event.clientY;
  };

  private onPointerUp = (event: PointerEvent): void => {
    if (event.type === "pointerup" && this.pressed && Math.hypot(event.clientX - this.pressed.x, event.clientY - this.pressed.y) < 6) {
      this.selectAt(event);
    }
    this.pressed = null;
    this.pointers.delete(event.pointerId);
    if (this.pointers.size < 2) this.pinchDistance = null;
    if (this.pointers.size === 0 || this.drag?.pointerId === event.pointerId) this.drag = null;
  };

  /** The cell under the pointer, if it has something */
  private selectAt(event: PointerEvent): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const scale = this.scale;
    const x = (event.clientX - rect.left) / scale - LEFT + this.scrollX;
    const y = (event.clientY - rect.top) / scale - TOP + this.scrollY;
    if (x < 0 || y < 0) return;
    const diagram = this.machine.diagram;
    const cycle = diagram.firstCycle + Math.floor(x / COLUMN);
    const row = Math.floor(y / ROW);
    this.select(diagram.cell(row, cycle) === undefined ? null : { id: diagram.firstRow + row, cycle });
  }

  /** Chooses a cell (null: none), and brings it into view */
  public select(cell: { id: number; cycle: number } | null): void {
    this.selected = cell;
    if (cell !== null) {
      const diagram = this.machine.diagram;
      const left = (cell.cycle - diagram.firstCycle) * COLUMN;
      const top = diagram.indexOf(cell.id) * ROW;
      if (left < this.scrollX || left + COLUMN > this.scrollX + this.viewWidth) this.scrollX = Math.max(0, left - this.viewWidth / 2);
      if (top < this.scrollY || top + ROW > this.scrollY + this.viewHeight) this.scrollY = Math.max(0, top - this.viewHeight / 2);
      this.followX = this.scrollX >= this.maxScrollX;
      this.followY = this.scrollY >= this.maxScrollY;
    }
    this.cellSelected.emit(cell);
    this.render();
  }

  /**
   * As wide as the card and as tall as the screen allows (leaving room to scroll the page), between 320 and 900 px. In a
   * narrow card the diagram is drawn smaller, so the column of the instructions leaves room for the cycles.
   */
  private resizeCanvas(): void {
    const width = this.pixiContainer.nativeElement.clientWidth;
    // A collapsed card or a hidden window
    if (width === 0) return;
    this.width = width;
    this.height = Math.round(Math.min(900, Math.max(320, window.innerHeight - 220)));
    this.pApp.renderer.resize(this.width, this.height);
    this.render();
  }

  /** `count` texts of a pool, created only when the pool is too small; the rest are hidden */
  private static texts(pool: PIXI.BitmapText[], layer: PIXI.Container, count: number): PIXI.BitmapText[] {
    while (pool.length < count) {
      const text = new PIXI.BitmapText("", { fontName: FONT, fontSize: 15 });
      pool.push(text);
      layer.addChild(text);
    }
    pool.forEach((text, i) => {
      text.visible = i < count;
    });
    return pool.slice(0, count);
  }

  private static place(text: PIXI.BitmapText, value: string, x: number, y: number, width: number, height: number, tint: number): void {
    if (text.text !== value) text.text = value;
    text.tint = tint;
    text.position.set(x + (width - text.width) / 2, y + (height - text.height) / 2);
  }

  /** Draws what is visible of the model */
  private render(): void {
    if (!this.drawn || this.width === 0) return;
    const diagram = this.machine.diagram;
    if (this.followX) this.scrollX = this.maxScrollX;
    if (this.followY) this.scrollY = this.maxScrollY;
    this.scrollX = Math.min(this.scrollX, this.maxScrollX);
    this.scrollY = Math.min(this.scrollY, this.maxScrollY);
    this.pApp.stage.scale.set(this.scale);

    const first = diagram.firstCycle;
    const firstColumn = first + Math.max(0, Math.floor(this.scrollX / COLUMN));
    const lastColumn = Math.min(diagram.cycles - 1, first + Math.floor((this.scrollX + this.viewWidth) / COLUMN));
    const firstRow = Math.max(0, Math.floor(this.scrollY / ROW));
    const lastRow = Math.min(diagram.rows.length - 1, Math.floor((this.scrollY + this.viewHeight) / ROW));
    const x = (cycle: number) => LEFT + CELL_MARGIN + (cycle - first) * COLUMN - this.scrollX;
    const y = (row: number) => TOP + ROW_MARGIN + row * ROW - this.scrollY;

    // The cells
    this.cells.clear();
    const labels: [DiagramLabel, number, number][] = [];
    for (let row = firstRow; row <= lastRow; row++) {
      for (let cycle = firstColumn; cycle <= lastColumn; cycle++) {
        const label = diagram.cell(row, cycle);
        if (label === undefined) continue;
        this.cells
          .lineStyle(2.5, COLOURS[label] ?? 0xcccccc, 1)
          .beginFill(0xd9d9d9)
          .drawRect(x(cycle), y(row), CELL_WIDTH, CELL_HEIGHT)
          .endFill();
        labels.push([label, x(cycle), y(row)]);
      }
    }
    const cellTexts = PixiCycleClockDiagramComponent.texts(this.cellTexts, this.cellLayer, labels.length);
    labels.forEach(([label, cellX, cellY], i) => {
      PixiCycleClockDiagramComponent.place(cellTexts[i], label, cellX, cellY, CELL_WIDTH, CELL_HEIGHT, 0x111111);
    });

    // The chosen cell (gone with its row, or with a new program)
    const chosen = this.selected === null ? -1 : diagram.indexOf(this.selected.id);
    if (this.selected !== null && (chosen < 0 || diagram.cell(chosen, this.selected.cycle) === undefined)) {
      this.selected = null;
      this.cellSelected.emit(null);
    } else if (this.selected !== null && chosen >= firstRow && chosen <= lastRow) {
      this.cells.lineStyle(4, 0x000000, 1).drawRect(x(this.selected.cycle) - 3, y(chosen) - 3, CELL_WIDTH + 6, CELL_HEIGHT + 6);
    }

    // The arrows that touch what is visible
    this.arrows.clear();
    for (const arrow of diagram.arrows) {
      const rows = [arrow.fromRow, arrow.toRow];
      const cycles = [arrow.fromCycle, arrow.toCycle];
      if (
        Math.max(...rows) < firstRow ||
        Math.min(...rows) > lastRow ||
        Math.max(...cycles) < firstColumn ||
        Math.min(...cycles) > lastColumn
      ) {
        continue;
      }
      const fromX = x(arrow.fromCycle) + CELL_WIDTH / 2 + 15;
      const fromY = y(arrow.fromRow) + CELL_HEIGHT / 2 + 5;
      const toX = x(arrow.toCycle) + CELL_WIDTH / 2 - 15;
      const toY = y(arrow.toRow) + CELL_HEIGHT / 2 - 5;
      const length = Math.hypot(toX - fromX, toY - fromY) || 1;
      const [ux, uy] = [(toX - fromX) / length, (toY - fromY) / length];
      this.arrows.lineStyle(3, arrow.color, 1).moveTo(fromX, fromY).lineTo(toX, toY);
      // The head of the arrow
      for (const side of [1, -1]) {
        this.arrows.moveTo(toX, toY).lineTo(toX - 12 * ux + 6 * side * uy, toY - 12 * uy - 6 * side * ux);
      }
    }

    // The headers, over the cells: the cycles above, the instructions on the left and the title in the corner
    const width = this.width / this.scale;
    const height = this.height / this.scale;
    this.headers.clear();
    this.headers.lineStyle(2.5, 0x222222, 1).beginFill(0x333333).drawRect(0, 0, width, TOP).endFill();
    this.headers.lineStyle(2.5, 0x222222, 1).beginFill(0x333333).drawRect(0, 0, LEFT, height).endFill();
    const visibleCycles = Math.max(0, lastColumn - firstColumn + 1);
    const cycleTexts = PixiCycleClockDiagramComponent.texts(this.cycleTexts, this.headerLayer, visibleCycles);
    for (let i = 0; i < visibleCycles; i++) {
      const cycle = firstColumn + i;
      const cellX = x(cycle);
      if (cellX + CELL_WIDTH < LEFT) {
        cycleTexts[i].visible = false;
        continue;
      }
      this.headers
        .lineStyle(2.5, 0x0033ff, 1)
        .beginFill(0x66ccff)
        .drawRect(cellX, TOP / 2 - CELL_HEIGHT / 2, CELL_WIDTH, CELL_HEIGHT)
        .endFill();
      PixiCycleClockDiagramComponent.place(cycleTexts[i], `${cycle}`, cellX, TOP / 2 - CELL_HEIGHT / 2, CELL_WIDTH, CELL_HEIGHT, 0x002244);
    }
    const visibleRows = Math.max(0, lastRow - firstRow + 1);
    const rowTexts = PixiCycleClockDiagramComponent.texts(this.rowTexts, this.headerLayer, visibleRows);
    for (let i = 0; i < visibleRows; i++) {
      const row = firstRow + i;
      const cellY = y(row);
      if (cellY + CELL_HEIGHT < TOP) {
        rowTexts[i].visible = false;
        continue;
      }
      this.headers
        .lineStyle(2.5, 0x0033ff, 1)
        .beginFill(0x66ccff)
        .drawRect(12.5, cellY, LEFT - 25, CELL_HEIGHT)
        .endFill();
      PixiCycleClockDiagramComponent.place(rowTexts[i], diagram.rows[row], 12.5, cellY, LEFT - 25, CELL_HEIGHT, 0x002244);
    }
    // The corner covers the headers that go under it
    this.headers.lineStyle(2.5, 0x222222, 1).beginFill(0x333333).drawRect(0, 0, LEFT, TOP).endFill();
    this.headerLayer.setChildIndex(this.title, this.headerLayer.children.length - 1);
    this.title.position.set((LEFT - this.title.width) / 2, (TOP - this.title.height) / 2);
    this.pApp.render();
  }
}
