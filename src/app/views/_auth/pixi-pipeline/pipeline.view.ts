import { Component, computed, inject, ViewChild } from "@angular/core";
import { PipelineStagesComponent } from "@components/pipeline-stages/pipeline-stages.component";
import { PixiPipelineComponent } from "@components/pixi-pipeline/pixi-pipeline.component";
import { SuperscalarMachineComponent } from "@components/superscalar-machine/superscalar-machine.component";
import { MachineService } from "@core/machine/machine.service";
import { TranslatePipe } from "@ngx-translate/core";
import { CardDirective, CardWidgetDirective } from "../../../__shared/directives/card/card.directive";
import { DetailsDirective } from "../../../__shared/directives/details/details.directive";

@Component({
  selector: "view-pipeline",
  templateUrl: "./pipeline.view.html",
  styleUrls: ["./pipeline.view.scss"],
  imports: [
    CardDirective,
    CardWidgetDirective,
    DetailsDirective,
    PixiPipelineComponent,
    PipelineStagesComponent,
    SuperscalarMachineComponent,
    TranslatePipe,
  ],
})
export class PipelineView {
  public machine = inject(MachineService);

  /** SuperDLX has no pipeline of five stages: its machine is shown instead */
  public readonly superscalar = computed(() => this.machine.state.architecture() === "superdlx");

  @ViewChild(PixiPipelineComponent)
  public pixi_PipelineComponent!: PixiPipelineComponent;
}
