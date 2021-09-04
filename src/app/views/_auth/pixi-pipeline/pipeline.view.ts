import { Component, Inject, OnInit, ViewChild } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { PixiPipelineComponent } from "../../../components/pixi-pipeline/pixi-pipeline.component";

@Component({
  selector: "thumder-pipeline-view",
  templateUrl: "./pipeline.view.html",
})
export class PipelineView implements OnInit {
  @ViewChild(PixiPipelineComponent) pixi_CycleClockDiagramComponent: PixiPipelineComponent;

  constructor(@Inject(DOCUMENT) private document: Document) {
  }

  ngOnInit(): void {
  }

}
