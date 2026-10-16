import { Component, inject, ViewChild } from "@angular/core";
import type { TypeStall } from "@app/Types";
import { PixiPipelineComponent } from "@components/pixi-pipeline/pixi-pipeline.component";
import { MachineService } from "@core/machine/machine.service";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { CardDirective, CardWidgetDirective } from "../../../__shared/directives/card/card.directive";

@Component({
  selector: "view-pipeline",
  templateUrl: "./pipeline.view.html",
  styleUrls: [],
  imports: [CardDirective, CardWidgetDirective, PixiPipelineComponent, TranslatePipe],
})
export class PipelineView {
  public machine = inject(MachineService);
  private translate = inject(TranslateService);

  @ViewChild(PixiPipelineComponent)
  public pixi_PipelineComponent!: PixiPipelineComponent;

  public readonly stages = ["IF", "ID", "intEX", "MEM", "WB"] as const;
  public readonly units = [
    { key: "faddEX", name: "faddEX" },
    { key: "fmultEX", name: "fmultEX" },
    { key: "fdivEX", name: "fdivEX" },
  ] as const;

  /** A stage in text: its instruction and, if it is stalled, the stall (A11Y-04: the stall is not only a colour) */
  public describe(cell: { text: string; draw: boolean | TypeStall } | undefined): string {
    if (!cell?.text || cell.draw === false) return this.translate.instant("MACHINE.EMPTY_STAGE");
    return cell.draw === true ? cell.text : `${cell.text} (${cell.draw})`;
  }
}
