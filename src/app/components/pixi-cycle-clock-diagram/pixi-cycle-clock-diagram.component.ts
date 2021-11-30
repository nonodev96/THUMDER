import * as PIXI from 'pixi.js';
import {
  Component,
  HostListener,
  OnInit,
  AfterViewInit,
  ViewChild,
  OnDestroy,
  Output,
  EventEmitter
} from '@angular/core';
import { MachineService } from "../../__core/machine/machine.service";
import { PixiTHUMDER_CycleClockDiagram, TypeArrowDirection } from "../../__core/machine/PixiTHUMDER_CycleClockDiagram";
import { Subscription } from "rxjs";

@Component({
  selector: 'thumder-pixi-cycle-clock-diagram',
  templateUrl: './pixi-cycle-clock-diagram.component.html',
  styleUrls: ['./pixi-cycle-clock-diagram.component.scss']
})
export class PixiCycleClockDiagramComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('pixiContainer')
  public pixiContainer;

  public pApp: PIXI.Application;
  private inCanvas: boolean = false;
  private cycleClockDiagram: PixiTHUMDER_CycleClockDiagram;
  private loader: PIXI.Loader;
  private ticker: PIXI.Ticker;
  private Keyboard;
  private Mouse;
  private stepSimulationSubscription: Subscription = new Subscription();

  private readonly idCanvas = "pixi-cycle-clock-diagram-id";

  @Output()
  public inCanvasEventEmitter = new EventEmitter<boolean>();

  constructor(public machine: MachineService) {
    this.Keyboard = require('pixi.js-keyboard');
    this.Mouse = require('pixi.js-mouse');
    this.cycleClockDiagram = new PixiTHUMDER_CycleClockDiagram();
  }

  ngOnInit(): void {
    this.stepSimulationSubscription = this.machine.getStepSimulationObservable().subscribe((stepSimulation) => {
      const cycle = this.machine.getStatusCycleClockDiagram(stepSimulation);
      this.cycleClockDiagram.addInstruction(cycle.instruction, cycle.cycle, cycle.stepsToWait);
      this.cycleClockDiagram.nextStep(cycle.step);
    });
  }

  ngAfterViewInit(): void {
    const width = 1600;
    const height = 975;
    const canvas = document.createElement("canvas");
    canvas.id = this.idCanvas;

    this.pApp = new PIXI.Application({
      width: width,
      height: height,
      backgroundColor: 0x1099BB,
      resolution: 1,
      view: canvas
    });
    this.pApp.stage.addChild(this.cycleClockDiagram.draw());
    this.pixiContainer.nativeElement.appendChild(this.pApp.view);

    this.loader = PIXI.Loader.shared;
    this.ticker = PIXI.Ticker.shared;

    this.loader.load((loader, resources) => {

      this.resize();
      const fps = new PIXI.Text('FPS: 0', {fill: 0xFFFFFF, fontSize: 12});
      fps.position.x = 0 /*this.pApp.view.width - 200*/;
      fps.position.y = 0 /*25*/;
      fps.zIndex = 100;
      this.pApp.stage.addChild(fps);

      this.pApp.ticker.add((delta) => {
        fps.text = `FPS: ${this.ticker.FPS.toFixed(2)}`;
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
    // Update the current game state:
    this.play(delta);
    this.Keyboard.update();
    this.Mouse.update();
  }

  private play(delta: number): void {
    if (this.Keyboard.isKeyDown('ArrowLeft', 'KeyA', 'KeyJ')) {
      this.cycleClockDiagram.moveRight();
    }
    if (this.Keyboard.isKeyDown('ArrowRight', 'KeyD', 'KeyL')) {
      this.cycleClockDiagram.moveLeft();
    }
    if (this.Keyboard.isKeyDown('ArrowUp', 'KeyW', 'KeyI')) {
      this.cycleClockDiagram.moveBottom();
    }
    if (this.Keyboard.isKeyDown('ArrowDown', 'KeyS', 'KeyK')) {
      this.cycleClockDiagram.moveTop();
    }
    if (this.Keyboard.isKeyDown('KeyR')) {
      this.cycleClockDiagram.reset();
    }
    if (this.Keyboard.isKeyDown('KeyN')) {
      this.nextStep();
    }
    if (this.Keyboard.isKeyDown('KeyM')) {
      this.nextStepX10();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    event.preventDefault();
    event.stopPropagation();
    this.resize();
  }

  // Detengo el movimiento de desplazamiento
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (this.inCanvas && event.key === 'ArrowDown') {
      event.preventDefault();
    }
    if (this.inCanvas && event.key === 'ArrowUp') {
      event.preventDefault();
    }
  }

  @HostListener('document:click', ['$event', '$event.target'])
  handleOnClick(event: MouseEvent, targetElement: HTMLElement): void {
    if (!targetElement) {
      return;
    }
    this.inCanvas = targetElement.id === this.idCanvas;
    this.inCanvasEventEmitter.emit(this.inCanvas);
  }

  moveBottom(): void {
    this.cycleClockDiagram.moveBottom();
  }

  moveTop(): void {
    this.cycleClockDiagram.moveTop();
  }

  moveRight(): void {
    this.cycleClockDiagram.moveRight();
  }

  moveLeft(): void {
    this.cycleClockDiagram.moveLeft();
  }

  nextStep(): void {
    this.cycleClockDiagram.nextStep();
  }

  nextStepX10(): void {
    for (let i = 0; i < 10; i++) {
      this.cycleClockDiagram.nextStep();
    }
  }

  addArrow(instructionArrow: TypeArrowDirection): void {
    this.cycleClockDiagram.addArrow(instructionArrow);
  }

  reset(): void {
    this.cycleClockDiagram.reset();
  }

  debug(): void {
    this.cycleClockDiagram.addInstruction("instruction 1");
    this.cycleClockDiagram.addInstruction("instruction 2");
    this.cycleClockDiagram.addInstruction("instruction 3");
    this.cycleClockDiagram.addInstruction("instruction 4");
  }

  private resize(): void {
    const width = this.pixiContainer.nativeElement.offsetWidth;
    let height = this.pixiContainer.nativeElement.offsetHeight;
    height = height === 0 ? 900 : height;
    this.pApp.renderer.resize(width, height);
    this.cycleClockDiagram.borderTopWidth = width;
    this.cycleClockDiagram.borderLeftHeight = height;
  }
}
