import * as PIXI from "pixi.js";
import { Component, HostListener, OnInit, AfterViewInit, ViewChild, OnDestroy, Output, EventEmitter } from "@angular/core";
import { MachineService } from "../../__core/machine/machine.service";
import { TypeArrowDirection } from "../../__core/machine/PixiTHUMDER_CycleClockDiagram";
import { Subscription } from "rxjs";
import * as Keyboard from "pixi.js-keyboard";

@Component({
  selector:    "thumder-pixi-cycle-clock-diagram",
  templateUrl: "./pixi-cycle-clock-diagram.component.html",
  styleUrls:   [ "./pixi-cycle-clock-diagram.component.scss" ]
})
export class PixiCycleClockDiagramComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild("pixiContainer")
  public pixiContainer;

  public pApp: PIXI.Application;
  private inCanvas: boolean = false;
  private loader: PIXI.Loader;
  private ticker: PIXI.Ticker;
  private keyboard;
  private stepSimulationSubscription: Subscription = new Subscription();
  private readonly idCanvas = "pixi-cycle-clock-diagram-id";

  @Output()
  public inCanvasEventEmitter = new EventEmitter<boolean>();

  constructor(public machine: MachineService) {
    this.keyboard = Keyboard;
  }

  ngOnInit(): void {
    this.stepSimulationSubscription = this.machine.getStepSimulationObservable().subscribe((stepSimulation) => {
      if (stepSimulation.isNewInstruction === true) {
        this.machine.cycleClockDiagram.addInstruction(this.machine.code.getOrDefaultValue(stepSimulation.pipeline.IF.address).instruction);
      }
      for (const arrow of stepSimulation.pipeline.arrows) {
        const arrowDraw = {
          start: {
            instruction: arrow.fromAddressRow,
            step:        arrow.fromStep
          },
          to:    {
            instruction: arrow.toAddressRow,
            step:        arrow.toStep
          }
        };
        this.machine.cycleClockDiagram.addArrow(arrowDraw);
      }
      this.machine.cycleClockDiagram.nextStep(stepSimulation.pipeline, stepSimulation.step);
    });
  }

  ngAfterViewInit(): void {
    const width = 1600;
    const height = 975;
    const canvas = document.createElement("canvas");
    canvas.id = this.idCanvas;

    this.pApp = new PIXI.Application({
      width:           width,
      height:          height,
      backgroundColor: 0xEEEEEE,
      resolution:      1,
      view:            canvas
    });
    this.pApp.stage.addChild(<any>this.machine.cycleClockDiagram.draw());
    this.pixiContainer.nativeElement.appendChild(this.pApp.view);

    this.loader = PIXI.Loader.shared;
    this.ticker = PIXI.Ticker.shared;

    this.loader.load((/*loader, resources*/) => {

      this.resize();
      const fps = new PIXI.Text("FPS: 0", { fill: 0xFFFFFF, fontSize: 12 });
      fps.position.x = 0 /*this.pApp.view.width - 200*/;
      fps.position.y = 0 /*25*/;
      fps.zIndex = 100;
      this.pApp.ticker.add((/*delta*/) => {
        fps.text = `FPS: ${ this.ticker.FPS.toFixed(2) }`;
      });
      this.pApp.ticker.add((delta) => this.gameLoop(delta));
    });
  }

  ngOnDestroy(): void {
    this.pApp.stage.destroy();
    this.pApp.destroy();
    this.stepSimulationSubscription.unsubscribe();
  }

  private gameLoop(delta: number): void {
    this.play(delta);
    this.keyboard.update();
  }

  private play(_delta: number): void {
    if (this.keyboard.isKeyDown("ArrowLeft", "KeyA", "KeyJ")) {
      this.machine.cycleClockDiagram.moveRight();
    }
    if (this.keyboard.isKeyDown("ArrowRight", "KeyD", "KeyL")) {
      this.machine.cycleClockDiagram.moveLeft();
    }
    if (this.keyboard.isKeyDown("ArrowUp", "KeyW", "KeyI")) {
      this.machine.cycleClockDiagram.moveBottom();
    }
    if (this.keyboard.isKeyDown("ArrowDown", "KeyS", "KeyK")) {
      this.machine.cycleClockDiagram.moveTop();
    }
    if (this.keyboard.isKeyDown("KeyR")) {
      this.machine.cycleClockDiagram.reset();
    }
  }

  @HostListener("window:resize", [ "$event" ])
  onResize(event: any): void {
    event.preventDefault();
    event.stopPropagation();
    this.resize();
  }

  @HostListener("document:keydown", [ "$event" ])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (this.inCanvas && event.key === "ArrowDown") {
      event.preventDefault();
    }
    if (this.inCanvas && event.key === "ArrowUp") {
      event.preventDefault();
    }
  }

  @HostListener("document:click", [ "$event", "$event.target" ])
  handleOnClick(event: MouseEvent, targetElement: HTMLElement): void {
    if (!targetElement) {
      return;
    }
    this.inCanvas = targetElement.id === this.idCanvas;
    this.inCanvasEventEmitter.emit(this.inCanvas);
  }

  moveBottom(): void {
    this.machine.cycleClockDiagram.moveBottom();
  }

  moveTop(): void {
    this.machine.cycleClockDiagram.moveTop();
  }

  moveRight(): void {
    this.machine.cycleClockDiagram.moveRight();
  }

  moveLeft(): void {
    this.machine.cycleClockDiagram.moveLeft();
  }

  addArrow(instructionArrow: TypeArrowDirection): void {
    this.machine.cycleClockDiagram.addArrow(instructionArrow);
  }

  reset(): void {
    this.machine.cycleClockDiagram.reset();
  }

  private resize(): void {
    const width = this.pixiContainer.nativeElement.offsetWidth;
    let height = this.pixiContainer.nativeElement.offsetHeight;
    height = height === 0 ? 900 : height;
    this.pApp.renderer.resize(width, height);
    this.machine.cycleClockDiagram.borderTopWidth = width;
    this.machine.cycleClockDiagram.borderLeftHeight = height;
  }
}
