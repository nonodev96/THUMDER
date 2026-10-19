import { type AfterViewInit, Component, ElementRef, effect, inject, type OnDestroy, signal, untracked, ViewChild } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import type { TypePipelineInstructions } from "@app/Types";
import { ConfigService } from "@core/config/config.service";
import { MachineService } from "@core/machine/machine.service";
import { type PipelineLabels, type PipelineUnits, PixiTHUMDER_Pipeline } from "@core/machine/PixiTHUMDER_Pipeline";
import { PIXI } from "@core/machine/pixi";
import { ThemeService } from "@core/services/theme/theme.service";
import { TranslateService } from "@ngx-translate/core";
import { map } from "rxjs";

/**
 * The pipeline is drawn for a wide screen: in a narrower card it is scaled down to fit, but never below this scale (the
 * texts would be unreadable); then the card scrolls it sideways
 */
const MIN_PIPELINE_SCALE = 0.7;
const MARGIN = 16;
/** The zoom of the user, over the scale that fits the card */
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
/** How long the instructions take to go to their next stage, step by step */
const STEP_DURATION = 600;

@Component({
  selector: "THUMDER-pixi-pipeline",
  templateUrl: "./pixi-pipeline.component.html",
  styleUrls: ["./pixi-pipeline.component.scss"],
  host: { "[class.pannable]": "pannable()", "[class.panning]": "panning()" },
})
export class PixiPipelineComponent implements AfterViewInit, OnDestroy {
  private machine = inject(MachineService);
  private config = inject(ConfigService);
  private translate = inject(TranslateService);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  @ViewChild("pixiPipelineContainer")
  public pixiContainer!: ElementRef<HTMLDivElement>;

  public pApp!: PIXI.Application;

  /** The drawing of the pipeline (PixiJS); what it shows comes from the state of the machine */
  private readonly pipeline: PixiTHUMDER_Pipeline;
  private readonly idCanvas: string = "pixi-pipeline";
  private resizeObserver?: ResizeObserver;
  private readonly drawn = signal(false);
  /** The zoom of the user (buttons of the card, Ctrl + wheel and the pinch of a touchpad), over the scale that fits */
  public zoom = 1;
  /** The frame of the animation that is coming (0: none) */
  private frame = 0;
  /** The drawing is wider than the card: it can be dragged sideways */
  public readonly pannable = signal(false);
  public readonly panning = signal(false);
  private drag: { x: number; scroll: number; pointerId: number } | null = null;

  private theme = inject(ThemeService);
  private readonly lang = toSignal(this.translate.onLangChange.pipe(map((event) => event.lang)), {
    initialValue: this.translate.getCurrentLang() ?? "",
  });

  /** The colour of the canvas, which follows the theme */
  private background(): number {
    return this.theme.colour("canvas-bg", "#f8fafc", "#0f172a");
  }

  /** The floating point units of the program loaded: how many of each kind and their cycles */
  private unitsConfig(): PipelineUnits {
    const { fadd, fmul, fdiv } = this.machine.state.units();
    const delays = this.machine.floatingPointStageConfiguration;
    return {
      faddEX: { count: fadd, delay: delays?.addition.delay ?? 0 },
      fmultEX: { count: fmul, delay: delays?.multiplication.delay ?? 0 },
      fdivEX: { count: fdiv, delay: delays?.division.delay ?? 0 },
    };
  }

  private labels(): PipelineLabels {
    const t = (key: string, params?: object) => this.translate.instant(key, params);
    return {
      stages: {
        IF: t("DATAPATH.STAGE_IF"),
        ID: t("DATAPATH.STAGE_ID"),
        intEX: t("DATAPATH.STAGE_EX"),
        MEM: t("DATAPATH.STAGE_MEM"),
        WB: t("DATAPATH.STAGE_WB"),
      },
      empty: t("DATAPATH.EMPTY"),
      registers: t("DATAPATH.REGISTERS"),
      units: (count, cycles) => t("DATAPATH.UNITS", { count, cycles }),
    };
  }

  constructor() {
    this.pipeline = new PixiTHUMDER_Pipeline(this.unitsConfig(), this.labels());
    // The background follows the theme (UI-07)
    effect(() => {
      const colour = this.background();
      if (this.pApp?.renderer) {
        this.pApp.renderer.background.color = colour;
        this.pApp.render();
      }
    });
    // A new configuration can add or remove floating point units, and with them boxes of the drawing; a new theme or
    // language changes its colours and its texts
    effect(() => {
      this.machine.state.units();
      this.machine.state.loads();
      this.theme.dark();
      this.lang();
      untracked(() => {
        this.pipeline.reset(this.unitsConfig(), this.labels());
        const instructions = this.machine.state.pipeline();
        if (instructions) this.pipeline.processStep(instructions, { duration: 0, progress: this.progress(instructions) });
        if (this.drawn()) this.resizeCanvas();
      });
    });
    // The instructions of each stage in this cycle: they move to their new place
    effect(() => {
      const instructions = this.machine.state.pipeline();
      untracked(() => {
        if (!instructions) {
          this.pipeline.reset(this.unitsConfig(), this.labels());
          this.render();
          return;
        }
        if (this.pipeline.processStep(instructions, { duration: this.duration(), progress: this.progress(instructions) })) this.animate();
        else this.render();
      });
    });
  }

  /** Most of the time between cycles while it runs (nothing when it runs too fast to follow), or a calm step by step */
  private duration(): number {
    if (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches) return 0;
    if (!this.machine.state.running()) return STEP_DURATION;
    const delay = this.config.value().delay;
    return delay < 120 ? 0 : Math.min(STEP_DURATION, Math.round(delay * 0.8));
  }

  /** The cycle of its floating point unit each instruction in one of them is in (from the cycle clock diagram) */
  private progress(instructions: TypePipelineInstructions): Map<number, number> {
    const progress = new Map<number, number>();
    const diagram = this.machine.diagram;
    const step = this.machine.state.step();
    for (const unit of ["faddEX", "fmultEX", "fdivEX"] as const) {
      for (const cell of instructions[unit]) {
        if (cell.id === undefined || cell.draw === false) continue;
        const row = diagram.indexOf(cell.id);
        if (row < 0) continue;
        let cycles = 0;
        while (diagram.cell(row, step - cycles) === unit) cycles++;
        progress.set(cell.id, Math.max(1, cycles));
      }
    }
    return progress;
  }

  ngAfterViewInit(): void {
    const canvas = document.createElement("canvas");
    canvas.id = this.idCanvas;
    canvas.style.display = "block";
    this.pApp = new PIXI.Application({
      width: 1200,
      height: 600,
      backgroundColor: this.background(),
      antialias: true,
      // Sharp on high density screens (phones, tablets), at most twice the pixels
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      // Drawn only when something changes (and on each frame while the instructions move)
      autoStart: false,
      view: canvas,
    });
    this.pApp.stage.addChild(this.pipeline.draw() as PIXI.DisplayObject);
    this.pixiContainer.nativeElement.appendChild(this.pApp.view as unknown as Node);
    canvas.addEventListener("wheel", this.onWheel, { passive: false });
    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerup", this.onPointerUp);
    canvas.addEventListener("pointercancel", this.onPointerUp);

    // The card changes its width with the window, the sidebar and the windows of the multiview
    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(this.host.nativeElement);
    this.drawn.set(true);
    this.resizeCanvas();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frame);
    this.resizeObserver?.disconnect();
    this.pApp.stage.destroy({ children: true });
    this.pApp.destroy();
  }

  public zoomBy(factor: number): void {
    this.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, this.zoom * factor));
    this.resizeCanvas();
  }

  public resetZoom(): void {
    this.zoom = 1;
    this.resizeCanvas();
  }

  private render(): void {
    if (this.drawn()) this.pApp.render();
  }

  /** The frames of the movement of a cycle */
  private animate(): void {
    if (this.frame !== 0 || !this.drawn()) return;
    const frame = (now: number) => {
      const moving = this.pipeline.tick(now);
      this.pApp.render();
      this.frame = moving ? requestAnimationFrame(frame) : 0;
    };
    this.frame = requestAnimationFrame(frame);
  }

  /** Ctrl + wheel zooms (a touchpad sends its pinch like this); the wheel alone scrolls the page */
  private onWheel = (event: WheelEvent): void => {
    if (!event.ctrlKey) return;
    event.preventDefault();
    this.zoomBy(Math.exp(-event.deltaY * 0.002));
  };

  /** With the mouse, the drawing is dragged sideways when it is wider than the card (a finger scrolls it natively) */
  private onPointerDown = (event: PointerEvent): void => {
    if (event.pointerType !== "mouse" || event.button !== 0 || !this.pannable()) return;
    this.drag = { x: event.clientX, scroll: this.host.nativeElement.scrollLeft, pointerId: event.pointerId };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.panning.set(true);
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (this.drag === null || this.drag.pointerId !== event.pointerId) return;
    this.host.nativeElement.scrollLeft = this.drag.scroll - (event.clientX - this.drag.x);
  };

  private onPointerUp = (event: PointerEvent): void => {
    if (this.drag?.pointerId !== event.pointerId) return;
    this.drag = null;
    this.panning.set(false);
  };

  /** Scales the drawing to the width of the card (and to the zoom) and makes the canvas as big as the scaled drawing */
  private resizeCanvas(): void {
    const available = this.host.nativeElement.clientWidth;
    // A collapsed card or a hidden window
    if (available === 0) return;
    this.pipeline.scale.set(1);
    const bounds = this.pipeline.getLocalBounds();
    const contentWidth = Math.max(bounds.x + bounds.width + MARGIN, 1);
    const contentHeight = Math.max(bounds.y + bounds.height + MARGIN, 1);
    const scale = Math.min(1.25, Math.max(MIN_PIPELINE_SCALE, available / contentWidth)) * this.zoom;
    this.pipeline.scale.set(scale);
    // The texts with enough pixels for the scale and the screen
    this.pipeline.setResolution(Math.min(4, Math.max(2, (window.devicePixelRatio || 1) * scale)));
    const width = Math.ceil(contentWidth * scale);
    this.pApp.renderer.resize(Math.max(available, width), Math.ceil(contentHeight * scale));
    this.pannable.set(width > available + 1);
    this.pApp.render();
  }
}
