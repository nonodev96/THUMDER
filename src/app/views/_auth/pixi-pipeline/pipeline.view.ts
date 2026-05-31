import { DOCUMENT } from "@angular/common";
import { Component, inject, type OnInit, ViewChild } from "@angular/core";
import { PixiPipelineComponent } from "@components/pixi-pipeline/pixi-pipeline.component";

@Component({
  selector: "view-pipeline",
  templateUrl: "./pipeline.view.html",
  styleUrls: [],
  standalone: false,
})
export class PipelineView implements OnInit {
  private _document = inject<Document>(DOCUMENT);

  @ViewChild(PixiPipelineComponent)
  public pixi_PipelineComponent!: PixiPipelineComponent;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  ngOnInit(): void {}
}
