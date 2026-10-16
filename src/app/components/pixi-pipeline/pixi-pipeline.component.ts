import {
  type AfterViewInit,
  Component,
  type ElementRef,
  effect,
  inject,
  type OnDestroy,
  signal,
  untracked,
  ViewChild,
} from "@angular/core";
import { DEFAULT_CANVAS_HEIGHT, DEFAULT_CANVAS_WIDTH } from "@app/CONSTANTS";
import { MachineService } from "@core/machine/machine.service";
import { PixiTHUMDER_Pipeline } from "@core/machine/PixiTHUMDER_Pipeline";
import { PIXI } from "@core/machine/pixi";
import { ThemeService } from "@core/services/theme/theme.service";

/**
 * The pipeline is drawn for a wide screen: in a narrower card it is scaled down to fit, but never below this scale (the
 * texts would be unreadable); a phone scrolls it sideways
 */
const MIN_PIPELINE_SCALE = 0.55;
const MARGIN = 16;
/** The zoom of the user, over the scale that fits the card */
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;

@Component({
  selector: "THUMDER-pixi-pipeline",
  templateUrl: "./pixi-pipeline.component.html",
  styleUrls: ["./pixi-pipeline.component.scss"],
})
export class PixiPipelineComponent implements AfterViewInit, OnDestroy {
  private machine = inject(MachineService);

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
    });
    const units = this.machine.state.units();
    this.pipeline = new PixiTHUMDER_Pipeline(units.fadd, units.fmul, units.fdiv);
    // A new configuration can add or remove floating point units, and with them columns of the drawing
    effect(() => {
      const { fadd, fmul, fdiv } = this.machine.state.units();
      this.machine.state.loads();
      untracked(() => {
        this.pipeline.reset(fadd, fmul, fdiv);
        const instructions = this.machine.state.pipeline();
        if (instructions) this.pipeline.processStep(instructions);
        if (this.drawn()) this.resizeCanvas();
      });
    });
    // The instructions of each stage in this cycle
    effect(() => {
      const instructions = this.machine.state.pipeline();
      untracked(() =>
        instructions
          ? this.pipeline.processStep(instructions)
          : this.pipeline.reset(...(Object.values(this.machine.state.units()) as [number, number, number])),
      );
    });
  }

  ngAfterViewInit(): void {
    const canvas = document.createElement("canvas");
    canvas.id = this.idCanvas;
    canvas.style.display = "block";
    this.pApp = new PIXI.Application({
      width: DEFAULT_CANVAS_WIDTH,
      height: DEFAULT_CANVAS_HEIGHT,
      backgroundColor: this.background(),
      // Sharp on high density screens (phones, tablets), at most twice the pixels
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      view: canvas,
    });
    this.pApp.stage.addChild(<any>this.pipeline.draw());
    this.pixiContainer.nativeElement.appendChild(this.pApp.view as unknown as Node);
    canvas.addEventListener("wheel", this.onWheel, { passive: false });

    // The card changes its width with the window, the sidebar and the windows of the multiview
    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(this.pixiContainer.nativeElement);
    this.drawn.set(true);
    this.resizeCanvas();
  }

  ngOnDestroy(): void {
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

  /** Ctrl + wheel zooms (a touchpad sends its pinch like this); the wheel alone scrolls the page */
  private onWheel = (event: WheelEvent): void => {
    if (!event.ctrlKey) return;
    event.preventDefault();
    this.zoomBy(Math.exp(-event.deltaY * 0.002));
  };

  /** Scales the drawing to the width of the card (and to the zoom) and makes the canvas as big as the scaled drawing */
  private resizeCanvas(): void {
    const available = this.pixiContainer.nativeElement.clientWidth;
    // A collapsed card or a hidden window
    if (available === 0) return;
    this.pipeline.scale.set(1);
    const bounds = this.pipeline.getLocalBounds();
    const contentWidth = Math.max(bounds.x + bounds.width + MARGIN, 1);
    const contentHeight = Math.max(bounds.y + bounds.height + MARGIN, 1);
    const scale = Math.min(1, Math.max(MIN_PIPELINE_SCALE, available / contentWidth)) * this.zoom;
    this.pipeline.scale.set(scale);
    this.pApp.renderer.resize(Math.max(available, Math.ceil(contentWidth * scale)), Math.ceil(contentHeight * scale));
  }
}
