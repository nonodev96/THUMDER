import * as PIXI from "pixi.js";
import { AfterViewInit, Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MachineService } from "../../__core/machine/machine.service";

@Component({
  selector: 'thumder-pixi-pipeline',
  templateUrl: './pixi-pipeline.component.html',
  styleUrls: ['./pixi-pipeline.component.scss']
})
export class PixiPipelineComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('pixiContainer') public pixiContainer;
  public pApp: PIXI.Application;

  constructor(private machine: MachineService) {
    let width = 1600;
    let height = 900;
    this.pApp = new PIXI.Application({
      width: width,
      height: height,
      backgroundColor: 0x1099bb,
      resolution: 1,
    });
  }

  ngOnInit(): void {
    this.machine.getStepSimulationObservable().subscribe((stepSimulation) => {
      const list_elements = this.machine.getListStatusPipeline(stepSimulation);
      for (const e of list_elements) {
        const instruction = this.machine.getTableCode(e.address).instruction;
        switch (e.stage) {
          case "IF":
            this.machine.pipeline.update_IF_text(instruction);
            break;
          case "ID":
            this.machine.pipeline.update_ID_text(instruction);
            break;
          case "intEX":
            this.machine.pipeline.update_intEX_text(instruction);
            break;
          case "WB":
            this.machine.pipeline.update_WB_text(instruction);
            break;
          case "MEM":
            this.machine.pipeline.update_MEM_text(instruction);
            break;
          default:
            if (e.stage.includes('faddEX')) {
              this.machine.pipeline.update_faddEX_text(instruction, e.unit);
            }
            if (e.stage.includes('fmultEX')) {
              this.machine.pipeline.update_fmultEX_text(instruction, e.unit);
            }
            if (e.stage.includes('fdivEX')) {
              this.machine.pipeline.update_fdivEX_text(instruction, e.unit);
            }
            break;
        }
      }
    });
  }

  ngAfterViewInit(): void {
    this.pApp.stage.addChild(this.machine.pipeline.draw());
    this.pixiContainer.nativeElement.appendChild(this.pApp.view);
    this.resize();
  }

  ngOnDestroy(): void {
    this.pApp.stage.destroy();
    this.pApp.destroy();
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
      case '1':
        this.machine.pipeline.update_IF_text("Prueba");
        break;
      case '2':
        this.machine.pipeline.update_ID_text("Prueba");
        break;
      case '3':
        this.machine.pipeline.update_intEX_text("Prueba");
        break;
      case '4':
        this.machine.pipeline.update_faddEX_text("Prueba");
        break;
      case '5':
        this.machine.pipeline.update_fmultEX_text("Prueba");
        break;
      case '6':
        this.machine.pipeline.update_fdivEX_text("Prueba");
        break;
      case '7':
        this.machine.pipeline.update_MEM_text("Prueba");
        break;
      case '8':
        this.machine.pipeline.update_WB_text("Prueba");
        break;
    }
  }

  private resize() {
    let width = this.pixiContainer.nativeElement.offsetWidth;
    let height = this.pixiContainer.nativeElement.offsetHeight;
    height = height === 0 ? 900 : height;
    this.pApp.renderer.resize(width, height);
  }
}
