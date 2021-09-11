import * as PIXI from 'pixi.js';
import { Component, HostListener, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { ArrowDirection, PixiTHUMDER_CycleClockDiagram } from "./PixiTHUMDER_CycleClockDiagram";

@Component({
  selector: 'thumder-pixi-cycle-clock-diagram',
  templateUrl: './pixi-cycle-clock-diagram.component.html',
  styleUrls: ['./pixi-cycle-clock-diagram.component.scss']
})
export class PixiCycleClockDiagramComponent implements OnInit, AfterViewInit {

  @ViewChild('pixiContainer') pixiContainer;
  public pApp: PIXI.Application;

  public cycleClockDiagram: PixiTHUMDER_CycleClockDiagram;

  constructor() {
    let width = 1600;
    let height = 900;
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
    PIXI.settings.SORTABLE_CHILDREN = true;
    this.pApp = new PIXI.Application({
      width: width,
      height: height,
      backgroundColor: 0x1099bb,
      resolution: 1,
    });

    this.cycleClockDiagram = new PixiTHUMDER_CycleClockDiagram();
    this.cycleClockDiagram.addInstruction("inst 1");
    this.cycleClockDiagram.addInstruction("inst 2");
    this.cycleClockDiagram.addInstruction("inst 3");
    this.cycleClockDiagram.addInstruction("inst 4");

    this.pApp.stage.addChild(this.cycleClockDiagram.draw());
  }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    this.pixiContainer.nativeElement.appendChild(this.pApp.view);
    this.resize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    event.preventDefault();
    event.stopPropagation();
    this.resize();
  }

  @HostListener('document:keypress', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    event.preventDefault();
    event.stopPropagation();
    switch (event.key) {
      case 'i':
        this.cycleClockDiagram.moveBottom();
        break;
      case 'k':
        this.cycleClockDiagram.moveTop();
        break;
      case 'j':
        this.cycleClockDiagram.moveRight();
        break;
      case 'l':
        this.cycleClockDiagram.moveLeft();
        break;
      case 'n':
        this.cycleClockDiagram.nextStep();
        break;
      case 'm':
        this.nextStepX10()
        break;
      case 'r':
        this.reset();
        break;
    }
  }

  public moveBottom() {
    this.cycleClockDiagram.moveBottom();
  }

  public moveTop() {
    this.cycleClockDiagram.moveTop();
  }

  public moveRight() {
    this.cycleClockDiagram.moveRight();
  }

  public moveLeft() {
    this.cycleClockDiagram.moveLeft();
  }

  public nextStep() {
    this.cycleClockDiagram.nextStep();
  }

  public nextStepX10() {
    for (let i = 0; i < 10; i++) {
      this.cycleClockDiagram.nextStep();
    }
  }

  public addArrow(instructionArrow: ArrowDirection) {
    this.cycleClockDiagram.addArrow(instructionArrow);
  }

  public reset() {
    this.cycleClockDiagram.reset();
  }

  private resize() {
    let width = this.pixiContainer.nativeElement.offsetWidth;
    let height = this.pixiContainer.nativeElement.offsetHeight;
    height = height === 0 ? 900 : height
    this.pApp.renderer.resize(width, height);
    this.cycleClockDiagram.borderTop.width = width;
    this.cycleClockDiagram.borderLeft.height = height;
  }
}
