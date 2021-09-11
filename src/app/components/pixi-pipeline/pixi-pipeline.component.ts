import * as PIXI from "pixi.js";
import { AfterViewInit, Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { PixiTHUMER_Pipeline } from "./PixiTHUMER_Pipeline";

@Component({
  selector: 'thumder-pixi-pipeline',
  templateUrl: './pixi-pipeline.component.html',
  styleUrls: ['./pixi-pipeline.component.scss']
})
export class PixiPipelineComponent implements OnInit, AfterViewInit {

  @ViewChild('pixiContainer') pixiContainer;
  public pApp: PIXI.Application;

  public pipeline: PixiTHUMER_Pipeline;

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

    this.pipeline = new PixiTHUMER_Pipeline()
    this.pApp.stage.addChild(this.pipeline.draw());
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.pixiContainer.nativeElement.appendChild(this.pApp.view);
    this.resize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    event.preventDefault();
    event.stopPropagation();
    this.resize()
  }

  @HostListener('document:keypress', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    event.preventDefault();
    event.stopPropagation();
    switch (event.key) {
      case '1':
        this.pipeline.update_IF_text("Prueba")
        break;
      case '2':
        this.pipeline.update_ID_text("Prueba")
        break;
      case '3':
        this.pipeline.update_intEX_text("Prueba")
        break;
      case '4':
        this.pipeline.update_faddEX_text("Prueba")
        break;
      case '5':
        this.pipeline.update_fmultEX_text("Prueba")
        break;
      case '6':
        this.pipeline.update_fdivEX_text("Prueba")
        break;
      case '7':
        this.pipeline.update_MEM_text("Prueba")
        break;
      case '8':
        this.pipeline.update_WB_text("Prueba")
        break;
    }
  }

  private resize() {
    let width = this.pixiContainer.nativeElement.offsetWidth;
    let height = this.pixiContainer.nativeElement.offsetHeight;
    height = height === 0 ? 900 : height
    this.pApp.renderer.resize(width, height);
  }
}
