import * as PIXI from 'pixi.js';
import { Component, HostListener, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { ArrowDirection, Pipe, PixiJSPipeline, defaultPipe } from "./PixiJSPipeline";

@Component({
  selector: 'thumder-pipeline-pixi',
  templateUrl: './pixi-pipeline.component.html',
  styleUrls: ['./pixi-pipeline.component.scss']
})
export class PixiPipelineComponent implements OnInit, AfterViewInit {

  @ViewChild('pixiContainer') pixiContainer;
  public pApp: PIXI.Application;

  public pipeline: PixiJSPipeline;

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

    this.pipeline = new PixiJSPipeline();
    this.pipeline.addInstruction("hello");
    this.pipeline.addInstruction("hello");
    this.pipeline.addInstruction("hello");
    this.pipeline.addInstruction("hello");

    this.pApp.stage.addChild(this.pipeline.draw());
  }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    this.pixiContainer.nativeElement.appendChild(this.pApp.view);
    this.resize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    // event.target.innerWidth;
    this.resize();
  }

  @HostListener('document:keypress', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    event.preventDefault();
    event.stopPropagation();
    switch (event.key) {
      case 'i':
        this.pipeline.moveBottom();
        break;
      case 'k':
        this.pipeline.moveTop();
        break;
      case 'j':
        this.pipeline.moveRight();
        break;
      case 'l':
        this.pipeline.moveLeft();
        break;
      case 'n':
        this.pipeline.nextStep();
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
    this.pipeline.moveBottom();
  }

  public moveTop() {
    this.pipeline.moveTop();
  }

  public moveRight() {
    this.pipeline.moveRight();
  }

  public moveLeft() {
    this.pipeline.moveLeft();
  }

  public nextStep() {
    this.pipeline.nextStep();
  }

  public nextStepX10() {
    for (let i = 0; i < 10; i++) {
      this.pipeline.nextStep();
    }
  }

  public addArrow(instructionArrow: ArrowDirection) {
    this.pipeline.addArrow(instructionArrow);
  }

  public reset() {
    this.pipeline.reset();
  }

  private resize() {
    let width = this.pixiContainer.nativeElement.offsetWidth;
    let height = this.pixiContainer.nativeElement.offsetHeight;
    height = height === 0 ? 900 : height
    this.pApp.renderer.resize(width, height);
    this.pipeline.borderTop.width = width;
    this.pipeline.borderLeft.height = height;
  }
}
