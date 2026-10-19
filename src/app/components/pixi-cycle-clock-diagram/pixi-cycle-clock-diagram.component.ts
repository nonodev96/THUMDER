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
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { DEFAULT_CANVAS_HEIGHT, DEFAULT_CANVAS_WIDTH } from "@app/CONSTANTS";
import type { DiagramLabel } from "@core/machine/cycle-diagram.model";
import { MachineService } from "@core/machine/machine.service";
import { PIXI } from "@core/machine/pixi";
import { cssColourNumber, LABEL_COLOURS } from "@core/services/theme/palette";
import { ThemeService } from "@core/services/theme/theme.service";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";

// The geometry of the diagram, in units of the drawing (the stage is scaled to the zoom)
const TOP = 40; // the row of the cycles
const COLUMN = 66; // a cycle
const ROW = 30; // an instruction
const CELL_WIDTH = 60;
const CELL_HEIGHT = 22;
const CELL_MARGIN = (COLUMN - CELL_WIDTH) / 2;
const ROW_MARGIN = (ROW - CELL_HEIGHT) / 2;
const RADIUS = 5; // the corners of the cells
const PADDING = 12; // the margin of the texts of the column of the instructions
const END = 16; // the room after the last cycle and the last instruction
const MOVE = 10; // what the arrows, the buttons and the keys move
const EASING = 160; // the milliseconds it takes to follow a new cycle

/** The stalls: their cells are striped, so they are told apart without their colour */
const STALLS = new Set<DiagramLabel>(["R-Stall", "T-Stall", "W-Stall", "Stall", "S-Stall"]);

// The texts are monospaced, so the operands of the instructions line up. Their glyphs are white: each text gets its
// colour with `tint`
const MONOSPACE = ["JetBrains Mono", "Fira Code", "SF Mono", "Menlo", "Consolas", "DejaVu Sans Mono", "Liberation Mono", "monospace"];
const FONTS = {
  text: { name: "thumder-diagram", size: 13, weight: "normal" },
  small: { name: "thumder-diagram-small", size: 11.5, weight: "normal" },
  bold: { name: "thumder-diagram-bold", size: 11.5, weight: "bold" },
} as const;
type Font = (typeof FONTS)[keyof typeof FONTS];
const CHARS = [[" ", "~"], "áéíóúüñÁÉÍÓÚÜÑ¿¡…"];

/**
 * The fonts installed (the diagrams share them): the pixels of the screen per unit of the drawing, and their metrics
 * (the width of a glyph and where the baseline is from the top of the glyphs)
 */
let fontResolution = 0;
const metrics = new Map<string, { advance: number; ascent: number }>();

/** Draws the glyphs of the fonts for `resolution` pixels per unit, so the texts are sharp at that zoom */
function installFonts(resolution: number): void {
  const page = resolution > 2 ? 1024 : 512;
  for (const font of Object.values(FONTS)) {
    // A tall line, so the accents of the capitals (Ó) fit over them
    const lineHeight = Math.ceil(font.size * 1.5);
    const style = new PIXI.TextStyle({ fontFamily: MONOSPACE, fontSize: font.size, fontWeight: font.weight, fill: "#ffffff", lineHeight });
    const installed = PIXI.BitmapFont.from(font.name, style, {
      chars: CHARS,
      resolution,
      padding: 2,
      skipKerning: true,
      scaleMode: PIXI.SCALE_MODES.LINEAR,
      textureWidth: page,
      textureHeight: page,
    });
    metrics.set(font.name, {
      advance: installed.chars["0".charCodeAt(0)]?.xAdvance ?? font.size * 0.6,
      ascent: lineHeight - PIXI.TextMetrics.measureFont(style.toFontString()).descent,
    });
  }
  fontResolution = resolution;
}

/** How wide a text is, in units of the drawing (all the glyphs are as wide) */
function textWidth(text: string, font: Font): number {
  return text.length * (metrics.get(font.name)?.advance ?? font.size * 0.6);
}

/** The text cut with an ellipsis to fit in `width` */
function truncate(text: string, font: Font, width: number): string {
  const room = Math.floor(width / (metrics.get(font.name)?.advance ?? font.size * 0.6));
  return text.length <= room ? text : `${text.slice(0, Math.max(0, room - 1)).trimEnd()}…`;
}

/** An instruction as in a listing: the operation in a column `column` characters wide, and then its operands */
function listing(text: string, column: number): string {
  const [operation = "", ...operands] = text.trim().split(/\s+/);
  return operands.length === 0 ? operation : `${operation.padEnd(column)} ${operands.join(" ")}`;
}

/** The colours of the diagram (theme.scss): the surfaces of the theme, each stage with its own and the stalls in amber */
function palette(dark: boolean) {
  const labels = Object.fromEntries(Object.entries(LABEL_COLOURS).map(([label, name]) => [label, cssColourNumber(name)])) as Record<
    DiagramLabel,
    number
  >;
  return {
    labels,
    cellText: cssColourNumber("on-stage", "#0f172a"),
    background: cssColourNumber("diagram-bg", "#ffffff"),
    stripe: cssColourNumber("diagram-stripe", "#f8fafc"),
    head: cssColourNumber("diagram-head", "#f1f5f9"),
    grid: cssColourNumber("diagram-grid", "#e9eef4"),
    border: cssColourNumber("diagram-border", "#cbd5e1"),
    text: cssColourNumber("diagram-text", "#1e293b"),
    muted: cssColourNumber("diagram-muted", "#64748b"),
    hover: cssColourNumber("diagram-hover", "#eef2ff"),
    now: cssColourNumber("diagram-now", "#4f46e5"),
    onNow: cssColourNumber("on-primary", "#ffffff"),
    selected: cssColourNumber("diagram-selected", "#4f46e5"),
    // The arrows come with the colours of the light theme (engine/simulator.ts): these are the ones of this theme
    arrows: new Map([
      [cssColourNumber("forwarding", "#16a34a"), cssColourNumber("diagram-forwarding", "#16a34a")],
      [cssColourNumber("stall-arrow", "#dc2626"), cssColourNumber("diagram-stall-arrow", "#dc2626")],
    ]),
    // How dark the shadows of the headers and the band of the current cycle are
    shadow: dark ? 0.45 : 0.09,
    band: dark ? 0.12 : 0.06,
  };
}
type Palette = ReturnType<typeof palette>;

type Point = { x: number; y: number };

/** The label, the colour and what it means of each entry of the legend */
const legend = (labels: DiagramLabel[]) => labels.map((label) => ({ label, colour: `var(--thumder-${LABEL_COLOURS[label]})` }));

/**
 * The cycle clock diagram, drawn from its model (MachineService.diagram): the instructions on the left, the cycles above
 * and, in each cell, the stage or the stall of the instruction in that cycle. It only draws the rows and the cycles that
 * are visible, with a fixed set of PixiJS objects that it reuses, and only when something changes (no animation loop).
 * It follows the last cycle unless the user moves back. It moves with the arrows of its card, the keys (when it has the
 * focus), the mouse and the finger, and zooms with the buttons, + and -, Ctrl + wheel and two fingers.
 */
@Component({
  selector: "THUMDER-pixi-cycle-clock-diagram",
  templateUrl: "./pixi-cycle-clock-diagram.component.html",
  styleUrls: ["./pixi-cycle-clock-diagram.component.scss"],
  imports: [TranslatePipe],
})
export class PixiCycleClockDiagramComponent implements AfterViewInit, OnDestroy {
  machine = inject(MachineService);
  private translate = inject(TranslateService);
  private theme = inject(ThemeService);

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

  /** The legend under the canvas: the stages, and the stalls with what each one means */
  public readonly stages = legend(["IF", "ID", "intEX", "MEM", "WB", "faddEX", "fmultEX", "fdivEX"]);
  public readonly stalls = legend(["R-Stall", "W-Stall", "S-Stall", "T-Stall", "Stall", "Aborted"]).map((entry) => ({
    ...entry,
    striped: STALLS.has(entry.label),
    meaning: `MACHINE.DIAGRAM_LEGEND_${entry.label === "Stall" ? "STALL" : entry.label === "Aborted" ? "ABORTED" : entry.label[0]}`,
  }));

  public pApp!: PIXI.Application;
  private readonly idCanvas: string = "pixi-cycle-clock-diagram-id";
  private canvas?: HTMLCanvasElement;
  private resizeObserver?: ResizeObserver;

  /** What is visible: the drawing moved this much to the left and up, in units of the drawing */
  public scrollX = 0;
  public scrollY = 0;
  /** What is drawn: the same, or on its way there after a new cycle */
  private shown: Point = { x: 0, y: 0 };
  private easing: (Point & { start: number }) | null = null;
  private frame = 0;
  private readonly reducedMotion = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null;
  /** Following the last cycle and the last instruction (until the user moves back) */
  private followX = true;
  private followY = true;
  /** The zoom of the user (buttons of the card, pinch, Ctrl + wheel and the keys + - 0) */
  public zoom = 1;
  private width = 0;
  private height = 0;
  /** The row (index) and the cycle under the mouse (-1: in a header) */
  private hover: { row: number; cycle: number } | null = null;
  /** The texts of the canvas, in the language of the interface */
  private words = { instruction: "", cycle: "", empty: "" };
  private colours: Palette | null = null;
  private fontTimer?: ReturnType<typeof setTimeout>;
  private pendingResolution = 0;

  // The objects of the drawing, reused on every render: the cells under the headers, then the row of the cycles, the
  // column of the instructions and the corner
  private readonly grid = new PIXI.Graphics();
  private readonly cells = new PIXI.Graphics();
  private readonly arrows = new PIXI.Graphics();
  private readonly outline = new PIXI.Graphics();
  private readonly top = new PIXI.Graphics();
  private readonly side = new PIXI.Graphics();
  private readonly corner = new PIXI.Graphics();
  private readonly cellTexts: PIXI.BitmapText[] = [];
  private readonly hintTexts: PIXI.BitmapText[] = [];
  private readonly cycleTexts: PIXI.BitmapText[] = [];
  private readonly numberTexts: PIXI.BitmapText[] = [];
  private readonly rowTexts: PIXI.BitmapText[] = [];
  private readonly cornerTexts: PIXI.BitmapText[] = [];
  private readonly cellLabels = new PIXI.Container();
  private readonly cellLayer = new PIXI.Container();
  private readonly topLabels = new PIXI.Container();
  private readonly topLayer = new PIXI.Container();
  private readonly sideLabels = new PIXI.Container();
  private readonly sideLayer = new PIXI.Container();
  private readonly cornerLayer = new PIXI.Container();
  private drawn = false;

  // Dragging the diagram with a finger or the mouse: where the pointer was
  private drag: { x: number; y: number; pointerId: number } | null = null;
  // Two fingers on the canvas zoom it: where they are, and their distance the last time the zoom changed
  private readonly pointers = new Map<number, { x: number; y: number }>();
  private pinchDistance: number | null = null;

  /** The colour of the canvas, which follows the theme */
  private background(): number {
    return this.theme.colour("canvas-bg", "#f8fafc", "#0f172a");
  }

  constructor() {
    // The colours follow the theme (UI-07)
    effect(() => {
      const colour = this.background();
      if (this.pApp?.renderer) this.pApp.renderer.background.color = colour;
      this.colours = null;
      untracked(() => this.render());
    });
    // A new cycle, a new program or a new configuration: draw again (easing towards the new cycle)
    effect(() => {
      this.machine.state.diagram();
      untracked(() => this.render(true));
    });
    // The headers, the text without a program and the description of the canvas, in each language
    this.translate
      .stream(["MACHINE.INSTRUCTION", "MACHINE.DIAGRAM_CYCLE", "MACHINE.DIAGRAM_EMPTY", "MACHINE.CYCLE_CLOCK_DIAGRAM_KEYS"])
      .pipe(takeUntilDestroyed())
      .subscribe((texts: Record<string, string>) => {
        this.words = {
          instruction: texts["MACHINE.INSTRUCTION"],
          cycle: texts["MACHINE.DIAGRAM_CYCLE"],
          empty: texts["MACHINE.DIAGRAM_EMPTY"],
        };
        this.canvas?.setAttribute("aria-label", texts["MACHINE.CYCLE_CLOCK_DIAGRAM_KEYS"]);
        this.render();
      });
  }

  ngAfterViewInit(): void {
    const canvas = document.createElement("canvas");
    canvas.id = this.idCanvas;
    canvas.style.display = "block";
    // The frame around it shows the focus (see the styles)
    canvas.style.outline = "none";
    canvas.style.cursor = "grab";
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
    canvas.addEventListener("pointerleave", this.onPointerLeave);
    canvas.addEventListener("wheel", this.onWheel, { passive: false });
    canvas.addEventListener("keydown", this.onKeydown);
    canvas.addEventListener("focus", () => this.onFocus(true));
    canvas.addEventListener("blur", () => this.onFocus(false));
    this.canvas = canvas;
    this.pApp = new PIXI.Application({
      width: DEFAULT_CANVAS_WIDTH,
      height: DEFAULT_CANVAS_HEIGHT,
      backgroundColor: this.background(),
      // Smooth edges for the rounded cells and the curves of the arrows
      antialias: true,
      // Sharp on high density screens (phones, tablets), at most twice the pixels
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      // Drawn only when something changes
      autoStart: false,
      view: canvas,
    });
    this.cellLayer.addChild(this.grid, this.cells, this.cellLabels, this.arrows, this.outline);
    this.topLayer.addChild(this.top, this.topLabels);
    this.sideLayer.addChild(this.side, this.sideLabels);
    this.cornerLayer.addChild(this.corner);
    this.pApp.stage.addChild(this.cellLayer, this.topLayer, this.sideLayer, this.cornerLayer);
    this.pixiContainer.nativeElement.appendChild(this.pApp.view as unknown as Node);

    // The card changes its width with the window, the sidebar and the windows of the multiview
    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(this.pixiContainer.nativeElement);
    this.drawn = true;
    this.resizeCanvas();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    clearTimeout(this.fontTimer);
    cancelAnimationFrame(this.frame);
    this.pApp?.destroy(false, { children: true });
  }

  // Window resizes also change the height of the canvas (the width comes from the ResizeObserver)
  @HostListener("window:resize")
  public onResize(): void {
    this.resizeCanvas();
  }

  /** A narrow card (a phone, a window of the multiview): the diagram is smaller and its instructions narrower */
  private get narrow(): boolean {
    return this.width < 600;
  }

  private get scale(): number {
    return (this.narrow ? 0.85 : 1) * this.zoom;
  }

  /** The width of the column of the instructions */
  private get left(): number {
    return this.narrow ? 160 : 228;
  }

  /** The size of the area of the cells, in units of the drawing */
  private get viewWidth(): number {
    return this.width / this.scale - this.left;
  }

  private get viewHeight(): number {
    return this.height / this.scale - TOP;
  }

  public get maxScrollX(): number {
    return Math.max(0, (this.machine.diagram.cycles - this.machine.diagram.firstCycle) * COLUMN - this.viewWidth + END);
  }

  private get maxScrollY(): number {
    return Math.max(0, this.machine.diagram.rows.length * ROW - this.viewHeight + END / 2);
  }

  /** Moves the drawing to (x, y); at the end of an axis it follows the new cycles or instructions again */
  private scrollTo(x: number, y: number, movesX = true, movesY = true): void {
    this.easing = null;
    this.scrollX = Math.min(this.maxScrollX, Math.max(0, x));
    this.scrollY = Math.min(this.maxScrollY, Math.max(0, y));
    if (movesX) this.followX = this.scrollX >= this.maxScrollX;
    if (movesY) this.followY = this.scrollY >= this.maxScrollY;
    this.render();
  }

  /** Moves the drawing (positive: to see the cycles on the right and the instructions below), from where it is drawn */
  public scrollBy(dx: number, dy: number): void {
    const from = this.easing ? this.shown : { x: this.scrollX, y: this.scrollY };
    this.scrollTo(from.x + dx, from.y + dy, dx !== 0, dy !== 0);
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

  /** The frame shows the focus when it comes from the keyboard */
  private onFocus(focused: boolean): void {
    this.pixiContainer.nativeElement.classList.toggle("focused", focused && !!this.canvas?.matches(":focus-visible"));
    this.inCanvasEventEmitter.emit(focused);
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
    else if (event.key === "Home" || event.code === "KeyR") this.scrollTo(0, 0);
    else if (event.key === "End") this.scrollTo(this.maxScrollX, this.maxScrollY);
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
      this.setCursor("grabbing");
    }
  };

  /** The drawing follows the pointer; without a button, the row and the cycle under the mouse are highlighted */
  private onPointerMove = (event: PointerEvent): void => {
    if (this.pointers.has(event.pointerId)) this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (this.pointers.size === 2 && this.pinchDistance) {
      const distance = this.fingersDistance;
      this.zoomBy(distance / this.pinchDistance);
      this.pinchDistance = distance;
      return;
    }
    if (this.drag !== null && this.drag.pointerId === event.pointerId) {
      const scale = this.scale;
      this.scrollBy((this.drag.x - event.clientX) / scale, (this.drag.y - event.clientY) / scale);
      this.drag.x = event.clientX;
      this.drag.y = event.clientY;
    }
    if (event.pointerType === "mouse") this.hoverAt(event);
  };

  private onPointerUp = (event: PointerEvent): void => {
    if (event.type === "pointerup" && this.pressed && Math.hypot(event.clientX - this.pressed.x, event.clientY - this.pressed.y) < 6) {
      this.selectAt(event);
    }
    this.pressed = null;
    this.pointers.delete(event.pointerId);
    if (this.pointers.size < 2) this.pinchDistance = null;
    if (this.pointers.size === 0 || this.drag?.pointerId === event.pointerId) this.drag = null;
    if (event.pointerType === "mouse") this.hoverAt(event, true);
  };

  private onPointerLeave = (): void => {
    if (this.drag !== null) return;
    this.setCursor("grab");
    if (this.hover === null) return;
    this.hover = null;
    this.render();
  };

  private setCursor(cursor: string): void {
    if (this.canvas && this.canvas.style.cursor !== cursor) this.canvas.style.cursor = cursor;
  }

  /** The row (index) and the cycle under the pointer: -1 in the headers, null outside the diagram */
  private spotAt(event: PointerEvent): { row: number; cycle: number } | null {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const scale = this.scale;
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;
    const diagram = this.machine.diagram;
    const cycle = x < this.left ? -1 : diagram.firstCycle + Math.floor((x - this.left + this.shown.x) / COLUMN);
    const row = y < TOP ? -1 : Math.floor((y - TOP + this.shown.y) / ROW);
    const spot = { row: row < diagram.rows.length ? row : -1, cycle: cycle < diagram.cycles ? cycle : -1 };
    return spot.row < 0 && spot.cycle < 0 ? null : spot;
  }

  /** Highlights the row and the cycle under the mouse, drawing again only when they change */
  private hoverAt(event: PointerEvent, force = false): void {
    const spot = this.spotAt(event);
    if (this.drag === null) {
      const filled = spot !== null && this.machine.diagram.cell(spot.row, spot.cycle) !== undefined;
      this.setCursor(filled ? "pointer" : "grab");
    }
    if (!force && spot?.row === this.hover?.row && spot?.cycle === this.hover?.cycle) return;
    this.hover = spot;
    this.render();
  }

  /** The cell under the pointer, if it has something */
  private selectAt(event: PointerEvent): void {
    const spot = this.spotAt(event);
    if (spot === null || spot.row < 0 || spot.cycle < 0) return;
    const diagram = this.machine.diagram;
    this.select(diagram.cell(spot.row, spot.cycle) === undefined ? null : { id: diagram.firstRow + spot.row, cycle: spot.cycle });
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
      this.easing = null;
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

  /**
   * The fonts for the size of the texts on the screen: the first time at once, and after a zoom when it settles (not on
   * every step of a pinch), so they are sharp at any zoom and on any screen
   */
  private sharpen(scale: number): void {
    const wanted = Math.max(0.5, Math.round(scale * this.pApp.renderer.resolution * 8) / 8);
    if (fontResolution === 0) installFonts(wanted);
    if (wanted === fontResolution) {
      clearTimeout(this.fontTimer);
      this.pendingResolution = 0;
    } else if (wanted !== this.pendingResolution) {
      clearTimeout(this.fontTimer);
      this.pendingResolution = wanted;
      this.fontTimer = setTimeout(() => {
        this.pendingResolution = 0;
        installFonts(wanted);
        this.render();
      }, 150);
    }
  }

  /**
   * Where the drawing is drawn: where it is or, after a new cycle that it follows, on its way there (a short ease out,
   * one frame at a time, unless the system asks for less motion)
   */
  private ease(before: Point, animate: boolean): Point {
    const [dx, dy] = [this.scrollX - before.x, this.scrollY - before.y];
    if (animate && !this.reducedMotion?.matches && dx >= 0 && dy >= 0 && dx + dy > 0 && dx <= 4 * COLUMN && dy <= 4 * ROW) {
      this.easing = { ...this.shown, start: performance.now() };
    }
    const easing = this.easing;
    const t = easing ? Math.min(1, (performance.now() - easing.start) / EASING) : 1;
    if (easing && t < 1) {
      const k = 1 - (1 - t) ** 3;
      this.shown = { x: easing.x + (this.scrollX - easing.x) * k, y: easing.y + (this.scrollY - easing.y) * k };
      if (this.frame === 0) {
        this.frame = requestAnimationFrame(() => {
          this.frame = 0;
          this.render();
        });
      }
    } else {
      this.easing = null;
      this.shown = { x: this.scrollX, y: this.scrollY };
    }
    return this.shown;
  }

  /** `count` texts of a pool, created only when the pool is too small; the rest are hidden */
  private static texts(pool: PIXI.BitmapText[], layer: PIXI.Container, count: number): PIXI.BitmapText[] {
    while (pool.length < count) {
      const text = new PIXI.BitmapText("", { fontName: FONTS.small.name, fontSize: FONTS.small.size });
      pool.push(text);
      layer.addChild(text);
    }
    pool.forEach((text, i) => {
      text.visible = i < count;
    });
    return pool.slice(0, count);
  }

  /**
   * Writes a text with its font and colour: its left side at `x` and its line centred on `middle`, on whole pixels of the
   * screen so it is sharp
   */
  private put(text: PIXI.BitmapText, value: string, font: Font, x: number, middle: number, tint: number): void {
    if (text.fontName !== font.name) text.fontName = font.name;
    if (text.fontSize !== font.size) text.fontSize = font.size;
    if (text.text !== value) text.text = value;
    text.tint = tint;
    // The baseline, under the middle by half the height of the capitals
    const y = middle + font.size * 0.34 - (metrics.get(font.name)?.ascent ?? font.size);
    text.position.set(this.snap(x), this.snap(y));
  }

  private snap(value: number): number {
    const pixels = this.scale * this.pApp.renderer.resolution;
    return Math.round(value * pixels) / pixels;
  }

  /** A shadow that fades from an edge: a header over what goes under it */
  private static shadow(graphics: PIXI.Graphics, x: number, y: number, length: number, down: boolean, alpha: number): void {
    const steps = 6;
    const size = 1.5;
    for (let i = 0; i < steps; i++) {
      graphics.beginFill(0x000000, alpha * (1 - i / steps) ** 2);
      if (down) graphics.drawRect(x, y + i * size, length, size);
      else graphics.drawRect(x + i * size, y, size, length);
      graphics.endFill();
    }
  }

  /** The stripes of a stall, inside its cell */
  private static stripes(graphics: PIXI.Graphics, x: number, y: number, colour: number): void {
    const inset = 1.5;
    const height = CELL_HEIGHT - 2 * inset;
    graphics.lineStyle({ width: 1.25, color: colour, alpha: 0.16, cap: PIXI.LINE_CAP.BUTT });
    for (let offset = -height; offset < CELL_WIDTH; offset += 6) {
      // The line from (offset, bottom) up to the right, cut by the sides of the cell
      const from = Math.max(0, inset - offset);
      const to = Math.min(height, CELL_WIDTH - inset - offset);
      if (to <= from) continue;
      graphics.moveTo(x + offset + from, y + inset + height - from).lineTo(x + offset + to, y + inset + height - to);
    }
    graphics.lineStyle(0);
  }

  /**
   * An arrow from a cell to another one, a soft curve between their corners that face each other (the next instruction
   * is a row below and a cycle later: it goes through the gap between the cells, not over their labels). First its
   * halo, which separates it from the cells, then its line, a dot where it starts and its head
   */
  private static arrow(graphics: PIXI.Graphics, from: Point, to: Point, shift: number, colour: number, halo: boolean): void {
    const [dx, dy] = [Math.sign(to.x - from.x), Math.sign(to.y - from.y)];
    // It starts inside the corner of the first cell and its tip stops on the rim of the second, before its label
    const corner = (cell: Point, sideX: number, sideY: number, inset: number): Point => ({
      x: cell.x + (sideX >= 0 ? CELL_WIDTH - inset - 2 : inset + 2),
      y: cell.y + (sideY > 0 ? CELL_HEIGHT - inset : sideY < 0 ? inset : CELL_HEIGHT / 2),
    });
    const start = corner(from, dx, dy, 4);
    const end = corner(to, dx === 0 ? 1 : -dx, -dy, 2);
    end.x += shift;
    // The curve bows a little to a side of the straight line
    const length = Math.hypot(end.x - start.x, end.y - start.y) || 1;
    const bend = Math.min(5, length * 0.18);
    const control = {
      x: (start.x + end.x) / 2 - (bend * (end.y - start.y)) / length,
      y: (start.y + end.y) / 2 + (bend * (end.x - start.x)) / length,
    };
    // The direction of the head: the curve arrives from its control point
    const last = Math.hypot(end.x - control.x, end.y - control.y) || 1;
    const [ux, uy] = [(end.x - control.x) / last, (end.y - control.y) / last];
    const head = 7;
    const base = { x: end.x - head * ux, y: end.y - head * uy };
    const wing = 4.25;
    const triangle = [end.x, end.y, base.x - wing * uy, base.y + wing * ux, base.x + wing * uy, base.y - wing * ux];
    const width = halo ? 5 : 2;
    graphics
      .lineStyle({ width, color: colour, alpha: 1, cap: PIXI.LINE_CAP.ROUND, join: PIXI.LINE_JOIN.ROUND })
      .moveTo(start.x, start.y)
      .quadraticCurveTo(control.x, control.y, base.x, base.y);
    graphics.lineStyle({ width: halo ? 3 : 0, color: colour, join: PIXI.LINE_JOIN.ROUND });
    graphics
      .beginFill(colour)
      .drawCircle(start.x, start.y, halo ? 3.5 : 2.25)
      .drawPolygon(triangle)
      .endFill();
    graphics.lineStyle(0);
  }

  /** Draws what is visible of the model */
  private render(animate = false): void {
    if (!this.drawn || this.width === 0) return;
    const diagram = this.machine.diagram;
    const scale = this.scale;
    this.sharpen(scale);
    const before = { x: this.scrollX, y: this.scrollY };
    if (this.followX) this.scrollX = this.maxScrollX;
    if (this.followY) this.scrollY = this.maxScrollY;
    this.scrollX = Math.min(this.scrollX, this.maxScrollX);
    this.scrollY = Math.min(this.scrollY, this.maxScrollY);
    const { x: scrollX, y: scrollY } = this.ease(before, animate);
    this.pApp.stage.scale.set(scale);

    this.colours ??= palette(this.theme.dark());
    const colours = this.colours;
    const left = this.left;
    const width = this.width / scale;
    const height = this.height / scale;
    // A pixel of the screen, for the lines
    const hair = 1 / scale;

    const first = diagram.firstCycle;
    const firstColumn = first + Math.max(0, Math.floor(scrollX / COLUMN));
    const lastColumn = Math.min(diagram.cycles - 1, first + Math.floor((scrollX + this.viewWidth) / COLUMN));
    const firstRow = Math.max(0, Math.floor(scrollY / ROW));
    const lastRow = Math.min(diagram.rows.length - 1, Math.floor((scrollY + this.viewHeight) / ROW));
    // Where the column of a cycle and the row of an instruction start, and where their cell is
    const columnX = (cycle: number) => left + (cycle - first) * COLUMN - scrollX;
    const rowY = (row: number) => TOP + row * ROW - scrollY;
    const cellAt = (row: number, cycle: number): Point => ({ x: columnX(cycle) + CELL_MARGIN, y: rowY(row) + ROW_MARGIN });
    const now = diagram.cycles - 1;
    const hover = this.hover;

    // The chosen cell (gone with its row, or with a new program)
    let chosen = this.selected === null ? -1 : diagram.indexOf(this.selected.id);
    if (this.selected !== null && (chosen < 0 || diagram.cell(chosen, this.selected.cycle) === undefined)) {
      this.selected = null;
      chosen = -1;
      this.cellSelected.emit(null);
    }

    // The rows in stripes, the row and the cycle under the mouse, the current cycle and a line between the cycles
    const grid = this.grid.clear();
    grid.beginFill(colours.background).drawRect(0, 0, width, height).endFill();
    for (let row = firstRow; row <= lastRow; row++) {
      const fill = hover?.row === row ? colours.hover : (diagram.firstRow + row) % 2 === 1 ? colours.stripe : -1;
      if (fill >= 0)
        grid
          .beginFill(fill)
          .drawRect(left, rowY(row), width - left, ROW)
          .endFill();
    }
    if (hover !== null && hover.cycle >= firstColumn && hover.cycle <= lastColumn) {
      grid
        .beginFill(colours.hover, 0.7)
        .drawRect(columnX(hover.cycle), TOP, COLUMN, height - TOP)
        .endFill();
    }
    if (now >= firstColumn && now <= lastColumn) {
      grid
        .beginFill(colours.now, colours.band)
        .drawRect(columnX(now), TOP, COLUMN, height - TOP)
        .endFill();
    }
    for (let cycle = firstColumn; cycle <= lastColumn + 1; cycle++) {
      grid
        .beginFill(colours.grid)
        .drawRect(this.snap(columnX(cycle)), TOP, hair, height - TOP)
        .endFill();
    }

    // The cells: the colour of their stage or stall, with stripes in the stalls, and their label in the middle
    const cells = this.cells.clear();
    const labels: [DiagramLabel, number, number][] = [];
    for (let row = firstRow; row <= lastRow; row++) {
      for (let cycle = firstColumn; cycle <= lastColumn; cycle++) {
        const label = diagram.cell(row, cycle);
        if (label === undefined) continue;
        const { x, y } = cellAt(row, cycle);
        cells
          .lineStyle({ width: hair, color: colours.cellText, alpha: 0.16, alignment: 0.5 })
          .beginFill(colours.labels[label] ?? colours.labels.Aborted)
          .drawRoundedRect(x, y, CELL_WIDTH, CELL_HEIGHT, RADIUS)
          .endFill()
          .lineStyle(0);
        if (STALLS.has(label)) PixiCycleClockDiagramComponent.stripes(cells, x, y, colours.cellText);
        labels.push([label, x, y]);
      }
    }
    const cellTexts = PixiCycleClockDiagramComponent.texts(this.cellTexts, this.cellLabels, labels.length);
    labels.forEach(([label, x, y], i) => {
      this.put(cellTexts[i], label, FONTS.bold, x + (CELL_WIDTH - textWidth(label, FONTS.bold)) / 2, y + CELL_HEIGHT / 2, colours.cellText);
      cellTexts[i].alpha = label === "Aborted" ? 0.7 : 1;
    });

    // Without cycles, what to do: in lines that fit, in the middle
    const lines: string[] = [];
    if (diagram.cycles === 0) {
      const room = Math.floor(Math.min(440, width - left - 32) / textWidth("0", FONTS.text));
      for (const word of this.words.empty.split(" ")) {
        if (lines.length > 0 && `${lines[lines.length - 1]} ${word}`.length <= room) lines[lines.length - 1] += ` ${word}`;
        else lines.push(word);
      }
    }
    const hint = PixiCycleClockDiagramComponent.texts(this.hintTexts, this.cellLayer, lines.length);
    lines.forEach((line, i) => {
      const middle = TOP + (height - TOP) / 2 + (i - (lines.length - 1) / 2) * 20;
      this.put(hint[i], line, FONTS.text, left + (width - left - textWidth(line, FONTS.text)) / 2, middle, colours.muted);
    });

    // The arrows that touch what is visible, over the cells: several into a cell arrive one under another
    this.arrows.clear();
    const visible = diagram.arrows.filter(
      (arrow) =>
        Math.max(arrow.fromRow, arrow.toRow) >= firstRow &&
        Math.min(arrow.fromRow, arrow.toRow) <= lastRow &&
        Math.max(arrow.fromCycle, arrow.toCycle) >= firstColumn &&
        Math.min(arrow.fromCycle, arrow.toCycle) <= lastColumn,
    );
    const into = new Map<string, number>();
    for (const arrow of visible) into.set(`${arrow.toRow}:${arrow.toCycle}`, (into.get(`${arrow.toRow}:${arrow.toCycle}`) ?? 0) + 1);
    const arrived = new Map<string, number>();
    const paths = visible.map((arrow) => {
      const key = `${arrow.toRow}:${arrow.toCycle}`;
      const count = into.get(key) ?? 1;
      const index = arrived.get(key) ?? 0;
      arrived.set(key, index + 1);
      return {
        from: cellAt(arrow.fromRow, arrow.fromCycle),
        to: cellAt(arrow.toRow, arrow.toCycle),
        shift: (index - (count - 1) / 2) * 6,
        colour: colours.arrows.get(arrow.color) ?? arrow.color,
      };
    });
    for (const path of paths) PixiCycleClockDiagramComponent.arrow(this.arrows, path.from, path.to, path.shift, colours.background, true);
    for (const path of paths) PixiCycleClockDiagramComponent.arrow(this.arrows, path.from, path.to, path.shift, path.colour, false);

    // The chosen cell: a ring in the colour of the brand
    const outline = this.outline.clear();
    if (this.selected !== null && chosen >= firstRow && chosen <= lastRow) {
      const { x, y } = cellAt(chosen, this.selected.cycle);
      outline
        .lineStyle({ width: 5, color: colours.selected, alpha: 0.22, alignment: 0.5 })
        .drawRoundedRect(x - 3, y - 3, CELL_WIDTH + 6, CELL_HEIGHT + 6, RADIUS + 3)
        .lineStyle({ width: 2, color: colours.selected, alpha: 1, alignment: 0.5 })
        .drawRoundedRect(x - 2, y - 2, CELL_WIDTH + 4, CELL_HEIGHT + 4, RADIUS + 2)
        .lineStyle(0);
    }
    const chosenCycle = this.selected?.cycle ?? -1;

    // The row of the cycles: the current one in a pill, the one under the mouse and the chosen one stronger
    const top = this.top.clear();
    top.beginFill(colours.head).drawRect(0, 0, width, TOP).endFill();
    if (hover !== null && hover.cycle >= firstColumn && hover.cycle <= lastColumn) {
      top.beginFill(colours.hover).drawRect(columnX(hover.cycle), 0, COLUMN, TOP).endFill();
    }
    if (now >= firstColumn && now <= lastColumn) {
      top
        .beginFill(colours.now)
        .drawRoundedRect(columnX(now) + 9, TOP / 2 - 10, COLUMN - 18, 20, 10)
        .endFill();
    }
    top
      .beginFill(colours.border)
      .drawRect(0, TOP - hair, width, hair)
      .endFill();
    if (scrollY > 0) PixiCycleClockDiagramComponent.shadow(top, left, TOP, width - left, true, colours.shadow);
    const visibleCycles = Math.max(0, lastColumn - firstColumn + 1);
    const cycleTexts = PixiCycleClockDiagramComponent.texts(this.cycleTexts, this.topLabels, visibleCycles);
    for (let i = 0; i < visibleCycles; i++) {
      const cycle = firstColumn + i;
      const value = `${cycle}`;
      const strong = cycle === now || cycle === chosenCycle || cycle === hover?.cycle;
      const font = strong ? FONTS.bold : FONTS.small;
      const tint = cycle === now ? colours.onNow : cycle === chosenCycle ? colours.selected : strong ? colours.text : colours.muted;
      this.put(cycleTexts[i], value, font, columnX(cycle) + (COLUMN - textWidth(value, font)) / 2, TOP / 2, tint);
    }

    // The column of the instructions: their number and their text, as in a listing
    const side = this.side.clear();
    side
      .beginFill(colours.background)
      .drawRect(0, TOP, left, height - TOP)
      .endFill();
    const digits = Math.max(2, `${diagram.firstRow + diagram.rows.length}`.length);
    const numbersEnd = PADDING + textWidth("0".repeat(digits), FONTS.small);
    const textX = numbersEnd + 10;
    const visibleRows = Math.max(0, lastRow - firstRow + 1);
    const numberTexts = PixiCycleClockDiagramComponent.texts(this.numberTexts, this.sideLabels, visibleRows);
    const rowTexts = PixiCycleClockDiagramComponent.texts(this.rowTexts, this.sideLabels, visibleRows);
    for (let i = 0; i < visibleRows; i++) {
      const row = firstRow + i;
      const y = rowY(row);
      const fill = hover?.row === row ? colours.hover : (diagram.firstRow + row) % 2 === 1 ? colours.stripe : -1;
      if (fill >= 0) side.beginFill(fill).drawRect(0, y, left, ROW).endFill();
      if (row === chosen)
        side
          .beginFill(colours.selected)
          .drawRoundedRect(0, y + 5, 3, ROW - 10, 1.5)
          .endFill();
      const strong = row === chosen || row === hover?.row;
      const number = `${diagram.firstRow + row + 1}`;
      this.put(
        numberTexts[i],
        number,
        FONTS.small,
        numbersEnd - textWidth(number, FONTS.small),
        y + ROW / 2,
        strong ? colours.text : colours.muted,
      );
      // In a narrow card the operands go right after the operation, so more of them fit
      const text = truncate(listing(diagram.rows[row], this.narrow ? 0 : 5), FONTS.text, left - textX - PADDING / 2);
      this.put(rowTexts[i], text, FONTS.text, textX, y + ROW / 2, row === chosen ? colours.selected : colours.text);
    }
    side
      .beginFill(colours.border)
      .drawRect(left - hair, TOP, hair, height - TOP)
      .endFill();
    if (scrollX > 0) PixiCycleClockDiagramComponent.shadow(side, left, TOP, height - TOP, false, colours.shadow);

    // The corner, over everything: what the column and the row are
    const corner = this.corner.clear();
    corner.beginFill(colours.head).drawRect(0, 0, left, TOP).endFill();
    corner
      .beginFill(colours.border)
      .drawRect(0, TOP - hair, left, hair)
      .drawRect(left - hair, 0, hair, TOP)
      .endFill();
    if (scrollX > 0) PixiCycleClockDiagramComponent.shadow(corner, left, 0, TOP, false, colours.shadow);
    if (scrollY > 0) PixiCycleClockDiagramComponent.shadow(corner, 0, TOP, left, true, colours.shadow);
    const [hash, instruction, cycle] = PixiCycleClockDiagramComponent.texts(this.cornerTexts, this.cornerLayer, 3);
    // The name of the row of the cycles only when both fit
    const instructionLabel = truncate(this.words.instruction.toLocaleUpperCase(), FONTS.bold, left - textX - PADDING);
    const room = left - PADDING - textX - textWidth(instructionLabel, FONTS.bold) - 12;
    const cycleLabel = textWidth(this.words.cycle, FONTS.bold) <= room ? this.words.cycle.toLocaleUpperCase() : "";
    const cycleX = left - PADDING - textWidth(cycleLabel, FONTS.bold);
    this.put(hash, "#", FONTS.bold, numbersEnd - textWidth("#", FONTS.bold), TOP / 2, colours.muted);
    this.put(instruction, instructionLabel, FONTS.bold, textX, TOP / 2, colours.muted);
    this.put(cycle, cycleLabel, FONTS.bold, cycleX, TOP / 2, colours.muted);
    this.pApp.render();
  }
}
