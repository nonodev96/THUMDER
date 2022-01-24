import * as PIXI from "pixi.js";
import { AfterViewInit, Component, HostListener, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { MachineService } from "../../__core/machine/machine.service";
import { PixiTHUMDER_Pipeline } from "../../__core/machine/PixiTHUMDER_Pipeline";
import { Subscription } from "rxjs";

@Component({
  selector:    "thumder-pixi-pipeline",
  templateUrl: "./pixi-pipeline.component.html",
  styleUrls:   [ "./pixi-pipeline.component.scss" ]
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

      this.pipeline.update_IF_text("");
      this.pipeline.update_ID_text("");
      this.pipeline.update_intEX_text("");
      this.pipeline.update_MEM_text("");
      this.pipeline.update_WB_text("");
      if (stepSimulation.pipeline.IF.draw !== false) {
        const instruction = this.machine.getCode(stepSimulation.pipeline.IF.address).instruction;
        this.pipeline.update_IF_text(instruction);
      }
      if (stepSimulation.pipeline.ID.draw !== false) {
        const instruction = this.machine.getCode(stepSimulation.pipeline.ID.address).instruction;
        this.pipeline.update_ID_text(instruction);
      }
      if (stepSimulation.pipeline.intEX.draw !== false) {
        const instruction = this.machine.getCode(stepSimulation.pipeline.intEX.address).instruction;
        this.pipeline.update_intEX_text(instruction);
      }
      if (stepSimulation.pipeline.MEM.draw !== false) {
        const instruction = this.machine.getCode(stepSimulation.pipeline.MEM.address).instruction;
        this.pipeline.update_MEM_text(instruction);
      }
      if (stepSimulation.pipeline.WB.draw !== false) {
        const instruction = this.machine.getCode(stepSimulation.pipeline.WB.address).instruction;
        this.pipeline.update_WB_text(instruction);
      }

      for (const faddEX of stepSimulation.pipeline.faddEX) {
        this.pipeline.update_faddEX_text(faddEX.unit, "");
        if (faddEX.draw !== false) {
          const instruction = this.machine.getCode(faddEX.address).instruction;
          this.pipeline.update_faddEX_text(faddEX.unit, instruction);
        }
      }

      for (const fmultEX of stepSimulation.pipeline.fmultEX) {
        this.pipeline.update_fmultEX_text(fmultEX.unit, "");
        if (fmultEX.draw !== false) {
          const instruction = this.machine.getCode(fmultEX.address).instruction;
          this.pipeline.update_fmultEX_text(fmultEX.unit, instruction);
        }
      }

      for (const fdivEX of stepSimulation.pipeline.fdivEX) {
        this.pipeline.update_fdivEX_text(fdivEX.unit, "");
        if (fdivEX.draw !== false) {
          const instruction = this.machine.getCode(fdivEX.address).instruction;
          this.pipeline.update_fdivEX_text(fdivEX.unit, instruction);
        }
      }


    });
  }

  ngAfterViewInit(): void {
    const width = 1600;
    const height = 975;
    this.pApp = new PIXI.Application({
      width:           width,
      height:          height,
      backgroundColor: 0x1099bb,
      resolution:      1
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

  @HostListener("window:resize", [ "$event" ])
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
