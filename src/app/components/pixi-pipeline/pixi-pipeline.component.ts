import * as PIXI from "pixi.js";
import { AfterViewInit, Component, HostListener, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { MachineService } from "../../__core/machine/machine.service";
import { PixiTHUMDER_Pipeline } from "../../__core/machine/PixiTHUMDER_Pipeline";
import { Subscription } from "rxjs";
import { TypeCycleCell, TypeCycleCellUnit, TypePipelineInstructions } from "../../Types";

@Component({
  selector:    "thumder-pixi-pipeline",
  templateUrl: "./pixi-pipeline.component.html",
  styleUrls:   ["./pixi-pipeline.component.scss"]
})
export class PixiPipelineComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild("pixiContainer") public pixiContainer;
  public pApp: PIXI.Application;
  private pipeline: PixiTHUMDER_Pipeline;
  private stepSimulationSubscription: Subscription = new Subscription();

  constructor(private machine: MachineService) {
    this.pipeline = this.machine.pipeline;
  }


  ngOnInit(): void {
    this.stepSimulationSubscription = this.machine.getStepSimulationObservable().subscribe((stepSimulation) => {
      // const {IF, ID, intEX, MEM, WB} = stepSimulation.pipeline;
      // const {faddEX, fmultEX, fdivEX} = stepSimulation.pipeline;
      // this.pipeline.update_IF_text(this.machine.getCode(IF.address).instruction ?? '');
      // this.pipeline.update_ID_text(this.machine.getCode(ID.address).instruction ?? '');
      // this.pipeline.update_intEX_text(this.machine.getCode(intEX.address).instruction ?? '');
      // this.pipeline.update_WB_text(this.machine.getCode(MEM.address).instruction ?? '');
      // this.pipeline.update_MEM_text(this.machine.getCode(WB.address).instruction ?? '');
      // for (const faddEX_unit of faddEX) {
      //   this.pipeline.update_faddEX_text(faddEX_unit.unit, this.machine.getCode(faddEX_unit.address).instruction ?? '');
      // }
      // for (const fmultEX_unit of fmultEX) {
      //   this.pipeline.update_fmultEX_text(fmultEX_unit.unit, this.machine.getCode(fmultEX_unit.address).instruction ?? '');
      // }
      // for (const fdivEX_unit of fdivEX) {
      //   this.pipeline.update_fdivEX_text(fdivEX_unit.unit, this.machine.getCode(fdivEX_unit.address).instruction ?? '');
      // }

      const instructions: TypePipelineInstructions = {
        IF:      this.getInstructionItem(stepSimulation.pipeline.IF),
        ID:      this.getInstructionItem(stepSimulation.pipeline.ID),
        intEX:   this.getInstructionItem(stepSimulation.pipeline.intEX),
        MEM:     this.getInstructionItem(stepSimulation.pipeline.MEM),
        WB:      this.getInstructionItem(stepSimulation.pipeline.WB),
        faddEX:  this.getInstruction(stepSimulation.pipeline.faddEX),
        fmultEX: this.getInstruction(stepSimulation.pipeline.fmultEX),
        fdivEX:  this.getInstruction(stepSimulation.pipeline.fdivEX),
      };

      this.pipeline.processStep(instructions);
    });
  }

  ngAfterViewInit(): void {
    const width = 1600;
    const height = 975;
    this.pApp = new PIXI.Application({
      width:           width,
      height:          height,
      backgroundColor: 0xEEEEEE,
      resolution:      1
    });
    this.pApp.stage.addChild(<any>this.pipeline.draw());
    this.pixiContainer.nativeElement.appendChild(this.pApp.view);
    this.resize();
  }

  ngOnDestroy(): void {
    this.pApp.stage.destroy();
    this.pApp.destroy();
    this.stepSimulationSubscription.unsubscribe();
  }

  @HostListener("window:resize", ["$event"])
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

  private getInstructionItem(item: TypeCycleCell) {
    return {
      text: this.machine.getCode(item.address).instruction,
      draw: item.draw
    };
  }

  private getInstruction(item: TypeCycleCellUnit[]) {
    return item.map((v) => {
      return {
        unit: v.unit,
        text: this.machine.getCode(v.address).instruction,
        draw: v.draw
      };
    });
  }
}
