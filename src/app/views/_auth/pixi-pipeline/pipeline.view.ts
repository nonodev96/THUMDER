import { Component, Inject, OnInit, ViewChild } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { PixiPipelineComponent } from "../../../components/pixi-pipeline/pixi-pipeline.component";

@Component({
  selector:    "view-pipeline",
  templateUrl: "./pipeline.view.html",
  styleUrls:   []
})
export class PipelineView implements OnInit {

  @ViewChild(PixiPipelineComponent) pixi_PipelineComponent: PixiPipelineComponent;

  constructor(@Inject(DOCUMENT) private document: Document) {
  }

  ngOnInit(): void {
  }
}
