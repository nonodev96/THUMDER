import * as PIXI from 'pixi.js';
import { Component, HostListener, OnInit, AfterViewInit, ViewChild, OnDestroy } from '@angular/core';
import { MachineService } from "../../__core/machine/machine.service";
import { ArrowDirection } from "../../__core/machine/PixiTHUMDER_CycleClockDiagram";

@Component({
  selector: 'thumder-pixi-cycle-clock-diagram',
  templateUrl: './pixi-cycle-clock-diagram.component.html',
  styleUrls: ['./pixi-cycle-clock-diagram.component.scss']
})
export class PixiCycleClockDiagramComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('pixiContainer') pixiContainer;
  pApp: PIXI.Application;

  constructor(public machine: MachineService) {
    const width = 1600;
    const height = 900;
    this.pApp = new PIXI.Application({
      width: width,
      height: height,
      backgroundColor: 0x1099bb,
      resolution: 1,
    });
  }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    this.pApp.stage.addChild(this.machine.cycleClockDiagram.draw());
    this.pixiContainer.nativeElement.appendChild(this.pApp.view);
    this.resize();
  }

  ngOnDestroy(): void {
    this.pApp.stage.destroy();
    this.pApp.destroy();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
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
        this.machine.cycleClockDiagram.moveBottom();
        break;
      case 'k':
        this.machine.cycleClockDiagram.moveTop();
        break;
      case 'j':
        this.machine.cycleClockDiagram.moveRight();
        break;
      case 'l':
        this.machine.cycleClockDiagram.moveLeft();
        break;
      case 'n':
        this.machine.cycleClockDiagram.nextStep();
        break;
      case 'm':
        this.nextStepX10()
        break;
      case 'r':
        this.reset();
        break;
    }
  }

  moveBottom() {
    this.machine.cycleClockDiagram.moveBottom();
  }

  moveTop() {
    this.machine.cycleClockDiagram.moveTop();
  }

  moveRight() {
    this.machine.cycleClockDiagram.moveRight();
  }

  moveLeft() {
    this.machine.cycleClockDiagram.moveLeft();
  }

  nextStep() {
    this.machine.cycleClockDiagram.nextStep();
  }

  nextStepX10() {
    for (let i = 0; i < 10; i++) {
      this.machine.cycleClockDiagram.nextStep();
    }
  }

  addArrow(instructionArrow: ArrowDirection) {
    this.machine.cycleClockDiagram.addArrow(instructionArrow);
  }

  reset() {
    this.machine.cycleClockDiagram.reset();
  }

  debug() {
    this.machine.cycleClockDiagram.addInstruction("instruction 1");
    this.machine.cycleClockDiagram.addInstruction("instruction 2");
    this.machine.cycleClockDiagram.addInstruction("instruction 3");
    this.machine.cycleClockDiagram.addInstruction("instruction 4");
  }

  private resize() {
    const width = this.pixiContainer.nativeElement.offsetWidth;
    let height = this.pixiContainer.nativeElement.offsetHeight;
    height = height === 0 ? 900 : height
    this.pApp.renderer.resize(width, height);
    this.machine.cycleClockDiagram.borderTop.width = width;
    this.machine.cycleClockDiagram.borderLeft.height = height;
  }
}
