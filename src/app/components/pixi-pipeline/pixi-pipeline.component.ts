import * as PIXI from "pixi.js";
import { AfterViewInit, Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MachineService } from "../../__core/machine/machine.service";
import { PixiTHUMDER_Pipeline } from "../../__core/machine/PixiTHUMDER_Pipeline";
import { Utils } from "../../Utils";
import { Subscription } from "rxjs";

@Component({
  selector: 'thumder-pixi-pipeline',
  templateUrl: './pixi-pipeline.component.html',
  styleUrls: ['./pixi-pipeline.component.scss']
})
export class PixiPipelineComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('pixiContainer') public pixiContainer;
  public pApp: PIXI.Application;
  private pipeline: PixiTHUMDER_Pipeline;
  private stepSimulationSubscription: Subscription = new Subscription();

  constructor(private machine: MachineService) {
    const faddEX_count = machine.floatingPointStageConfiguration.addition.count;
    const fmultEX_count = machine.floatingPointStageConfiguration.multiplication.count;
    const fdivEX_count = machine.floatingPointStageConfiguration.division.count;
    this.pipeline = new PixiTHUMDER_Pipeline(faddEX_count, fmultEX_count, fdivEX_count);
  }


  ngOnInit(): void {
    this.stepSimulationSubscription = this.machine.getStepSimulationObservable().subscribe((stepSimulation) => {
      const list_elements = this.machine.getListStatusPipeline(stepSimulation);
      for (const e of list_elements) {
        const code = this.machine.getTableCode(e.address).code;
        const instruction = Utils.convertHexCodeToTextMachineInstructionDLX(code);
        switch (e.stage) {
          case "IF":
            this.pipeline.update_IF_text(instruction);
            break;
          case "ID":
            this.pipeline.update_ID_text(instruction);
            break;
          case "intEX":
            this.pipeline.update_intEX_text(instruction);
            break;
          case "WB":
            this.pipeline.update_WB_text(instruction);
            break;
          case "MEM":
            this.pipeline.update_MEM_text(instruction);
            break;
          default:
            if (e.stage.includes('faddEX')) {
              this.pipeline.update_faddEX_text(e.unit, instruction);
            }
            if (e.stage.includes('fmultEX')) {
              this.pipeline.update_fmultEX_text(e.unit, instruction);
            }
            if (e.stage.includes('fdivEX')) {
              this.pipeline.update_fdivEX_text(e.unit, instruction);
            }
            break;
        }
      }
    });
  }

  ngAfterViewInit(): void {
    const width = 1600;
    const height = 975;
    this.pApp = new PIXI.Application({
      width: width,
      height: height,
      backgroundColor: 0x1099bb,
      resolution: 1,
    });
    this.pApp.stage.addChild(this.pipeline.draw());
    this.pixiContainer.nativeElement.appendChild(this.pApp.view);
    this.resize();
  }

  ngOnDestroy(): void {
    this.pApp.stage.destroy();
    this.pApp.destroy();
    this.stepSimulationSubscription.unsubscribe();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    event.preventDefault();
    event.stopPropagation();
    this.resize();
  }


  private resize() {
    const width = this.pixiContainer.nativeElement.offsetWidth;
    let height = this.pixiContainer.nativeElement.offsetHeight;
    height = height === 0 ? 900 : height;
    this.pApp.renderer.resize(width, height);
  }
}
