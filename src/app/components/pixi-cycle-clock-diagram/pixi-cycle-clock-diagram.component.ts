import {
  type AfterViewInit,
  Component,
  type ElementRef,
  EventEmitter,
  HostListener,
  type OnDestroy,
  type OnInit,
  Output,
  ViewChild,
} from "@angular/core";
import * as PIXI from "pixi.js";
import { Subscription } from "rxjs";
import { MachineService } from "@core/machine/machine.service";
import { DEFAULT_CANVAS_HEIGHT, DEFAULT_CANVAS_WIDTH } from "@app/CONSTANTS";

@Component({
  selector: "THUMDER-pixi-cycle-clock-diagram",
  templateUrl: "./pixi-cycle-clock-diagram.component.html",
  styleUrls: ["./pixi-cycle-clock-diagram.component.scss"],
  standalone: false,
})
export class PixiCycleClockDiagramComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild("pixiCycleContainer")
  public pixiContainer!: ElementRef<HTMLDivElement>;

  @Output()
  public inCanvasEventEmitter: EventEmitter<boolean> = new EventEmitter<boolean>();

  public pApp!: PIXI.Application;
  private inCanvas: boolean = false;
  private ticker!: PIXI.Ticker;
  private keysDown = new Set<string>();
  private stepSimulationSubscription: Subscription = new Subscription();
  private readonly idCanvas: string = "pixi-cycle-clock-diagram-id";

  constructor(public machine: MachineService) {
  }

  ngOnInit(): void {
    this.stepSimulationSubscription = this.machine.getStepSimulationObservable().subscribe((stepSimulation) => {
      if (stepSimulation.isNewInstruction === true) {
        this.machine.cycleClockDiagram.addInstruction(this.machine.code.getOrDefaultValue(stepSimulation.pipeline.IF.address)?.instruction ?? "");
      }
      for (const arrow of stepSimulation.pipeline.arrows) {
        const arrowDraw = {
          start: {
            instruction: arrow.fromAddressRow,
            step: arrow.fromStep,
          },
          to: {
            instruction: arrow.toAddressRow,
            step: arrow.toStep,
          },
        };
        const color = parseInt(String(arrow.color), 16);
        this.machine.cycleClockDiagram.addArrow(arrowDraw, color);
      }
      this.machine.cycleClockDiagram.nextStep(stepSimulation.pipeline, stepSimulation.step);
    });
  }

  ngAfterViewInit(): void {
    const canvas = document.createElement("canvas");
    canvas.id = this.idCanvas;
    this.pApp = new PIXI.Application({
      width: DEFAULT_CANVAS_WIDTH,
      height: DEFAULT_CANVAS_HEIGHT,
      backgroundColor: 0xeeeeee,
      resolution: 1,
      view: canvas,
    });
    this.pApp.stage.addChild(<any>this.machine.cycleClockDiagram.draw());
    this.pixiContainer.nativeElement.appendChild(this.pApp.view as unknown as Node);

    this.ticker = PIXI.Ticker.shared;
    const fps = new PIXI.Text("FPS: 0", { fill: 0xffffff, fontSize: 12 });
    fps.position.x = 0;
    fps.position.y = 0;
    fps.zIndex = 100;
    this.pApp.ticker.add((/*delta*/) => {
      fps.text = `FPS: ${this.ticker.FPS.toFixed(2)}`;
    });
    this.pApp.ticker.add((delta) => this.gameLoop(delta));

    this.resizeCanvas();
  }

  ngOnDestroy(): void {
    this.pApp.stage.destroy();
    this.pApp.destroy();
    this.stepSimulationSubscription.unsubscribe();
  }

  private gameLoop(delta: number): void {
    this.play(delta);
  }

  private play(_delta: number): void {
    if (this.keysDown.has("ArrowLeft") || this.keysDown.has("KeyJ")) {
      this.machine.cycleClockDiagram.moveRight();
    }
    if (this.keysDown.has("ArrowRight") || this.keysDown.has("KeyL")) {
      this.machine.cycleClockDiagram.moveLeft();
    }
    if (this.keysDown.has("ArrowUp") || this.keysDown.has("KeyI")) {
      this.machine.cycleClockDiagram.moveBottom();
    }
    if (this.keysDown.has("ArrowDown") || this.keysDown.has("KeyK")) {
      this.machine.cycleClockDiagram.moveTop();
    }
    if (this.keysDown.has("KeyR")) {
      this.machine.cycleClockDiagram.reset();
    }
  }

  @HostListener("window:resize", ["$event"])
  public onResize(event: any): void {
    event.preventDefault();
    event.stopPropagation();
    this.resizeCanvas();
  }

  @HostListener("document:keydown", ["$event"])
  public handleKeyboardEvent(event: KeyboardEvent): void {
    if (this.inCanvas) {
      this.keysDown.add(event.code);
      if (["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
      }
    }
  }

  @HostListener("document:keyup", ["$event"])
  public handleKeyUpEvent(event: KeyboardEvent): void {
    this.keysDown.delete(event.code);
  }

  @HostListener("window:blur")
  public onWindowBlur(): void {
    this.keysDown.clear();
  }

  @HostListener("document:click", ["$event", "$event.target"])
  public handleOnClick(_event: MouseEvent, targetElement: HTMLElement): void {
    if (!targetElement) {
      return;
    }
    this.inCanvas = targetElement.id === this.idCanvas;
    this.inCanvasEventEmitter.emit(this.inCanvas);
  }

  public moveBottom(): void {
    this.machine.cycleClockDiagram.moveBottom();
  }

  public moveTop(): void {
    this.machine.cycleClockDiagram.moveTop();
  }

  public moveRight(): void {
    this.machine.cycleClockDiagram.moveRight();
  }

  public moveLeft(): void {
    this.machine.cycleClockDiagram.moveLeft();
  }

  public reset(): void {
    this.machine.cycleClockDiagram.reset();
  }

  private resizeCanvas(): void {
    const width = this.pixiContainer.nativeElement.offsetWidth;
    let height = this.pixiContainer.nativeElement.offsetHeight;
    height = height === 0 ? 900 : height;
    this.pApp.renderer.resize(width, height);
    this.machine.cycleClockDiagram.borderTopWidth = width;
    this.machine.cycleClockDiagram.borderLeftHeight = height;
  }
}
