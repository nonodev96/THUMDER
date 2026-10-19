import { Component, inject, ViewChild } from "@angular/core";
import { PipelineStagesComponent } from "@components/pipeline-stages/pipeline-stages.component";
import { PixiPipelineComponent } from "@components/pixi-pipeline/pixi-pipeline.component";
import { MachineService } from "@core/machine/machine.service";
import { TranslatePipe } from "@ngx-translate/core";
import { CardDirective, CardWidgetDirective } from "../../../__shared/directives/card/card.directive";

@Component({
  selector: "view-pipeline",
  templateUrl: "./pipeline.view.html",
  styleUrls: ["./pipeline.view.scss"],
  imports: [CardDirective, CardWidgetDirective, PixiPipelineComponent, PipelineStagesComponent, TranslatePipe],
})
export class PipelineView {
  public machine = inject(MachineService);

  @ViewChild(PixiPipelineComponent)
  public pixi_PipelineComponent!: PixiPipelineComponent;
}
