import { type AfterViewInit, Component, type ElementRef, HostListener, type OnDestroy, type OnInit, ViewChild } from "@angular/core";
import * as PIXI from "pixi.js";
import { Subscription } from "rxjs";
import { MachineService } from "@core/machine/machine.service";
import type { PixiTHUMDER_Pipeline } from "@core/machine/PixiTHUMDER_Pipeline";
import { DEFAULT_CANVAS_HEIGHT, DEFAULT_CANVAS_WIDTH } from "@app/CONSTANTS";
import type {
  TypeCycleCell,
  TypeCycleCellUnit,
  TypeInstructionPipelineFloatingRepresentation,
  TypeInstructionPipelineRepresentation,
  TypePipelineInstructions,
} from "@app/Types";

@Component({
  selector: "THUMDER-pixi-pipeline",
  templateUrl: "./pixi-pipeline.component.html",
  styleUrls: ["./pixi-pipeline.component.scss"],
  standalone: false,
})
export class PixiPipelineComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild("pixiPipelineContainer")
  public pixiContainer!: ElementRef<HTMLDivElement>;

  public pApp!: PIXI.Application;

  private pipeline: PixiTHUMDER_Pipeline;
  private stepSimulationSubscription: Subscription = new Subscription();
  private readonly idCanvas: string = "pixi-pipeline";

  constructor(private machine: MachineService) {
    this.pipeline = this.machine.pipeline;
  }

  ngOnInit(): void {
    this.stepSimulationSubscription = this.machine.getStepSimulationObservable().subscribe((stepSimulation) => {
      const instructions: TypePipelineInstructions = {
        IF: this.getInstructionDataPipelineItem(stepSimulation.pipeline.IF),
        ID: this.getInstructionDataPipelineItem(stepSimulation.pipeline.ID),
        intEX: this.getInstructionDataPipelineItem(stepSimulation.pipeline.intEX),
        MEM: this.getInstructionDataPipelineItem(stepSimulation.pipeline.MEM),
        WB: this.getInstructionDataPipelineItem(stepSimulation.pipeline.WB),
        faddEX: this.getInstructionDataPipeline(stepSimulation.pipeline.faddEX),
        fmultEX: this.getInstructionDataPipeline(stepSimulation.pipeline.fmultEX),
        fdivEX: this.getInstructionDataPipeline(stepSimulation.pipeline.fdivEX),
      };

      this.pipeline.processStep(instructions);
    });
  }

  ngAfterViewInit(): void {
    const canvas = document.createElement("canvas");
    canvas.id = this.idCanvas;
    this.pApp = new PIXI.Application({
      width: DEFAULT_CANVAS_WIDTH,
      height: DEFAULT_CANVAS_HEIGHT,
      backgroundColor: 0xeeeeee,
      resolution: 1,
      view: canvas,
    });
    this.pApp.stage.addChild(<any>this.pipeline.draw());
    this.pixiContainer.nativeElement.appendChild(this.pApp.view as unknown as Node);

    this.resizeCanvas();
  }

  ngOnDestroy(): void {
    this.pApp.stage.destroy();
    this.pApp.destroy();
    this.stepSimulationSubscription.unsubscribe();
  }

  @HostListener("window:resize", ["$event"])
  public onResize(event: any): void {
    event.preventDefault();
    event.stopPropagation();
    this.resizeCanvas();
  }

  private resizeCanvas(): void {
    const width = this.pixiContainer.nativeElement.offsetWidth;
    let height = this.pixiContainer.nativeElement.offsetHeight;
    height = height === 0 ? DEFAULT_CANVAS_HEIGHT : height;
    this.pApp.renderer.resize(width, height);
  }

  private getInstructionDataPipelineItem(item: TypeCycleCell): TypeInstructionPipelineRepresentation {
    if (item.address === undefined || (item.address as string).length === 0) return { text: "", draw: item.draw };
    const machineInstruction = this.machine.getCode(item.address);
    return {
      text: machineInstruction.instruction,
      draw: item.draw,
    };
  }

  private getInstructionDataPipeline(items: TypeCycleCellUnit[]): TypeInstructionPipelineFloatingRepresentation[] {
    return items.map((item) => {
      if (item.address === undefined || (item.address as string).length === 0) return { unit: item.unit ?? 0, text: "", draw: item.draw };
      const machineInstruction = this.machine.getCode(item.address);
      return {
        unit: item.unit ?? 0,
        text: machineInstruction.instruction,
        draw: item.draw,
      };
    });
  }
}
