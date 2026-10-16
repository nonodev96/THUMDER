import type { CdkDragDrop } from "@angular/cdk/drag-drop";
import { CdkDrag, CdkDragHandle, CdkDragPlaceholder, CdkDropList, CdkDropListGroup } from "@angular/cdk/drag-drop";
import { NgTemplateOutlet } from "@angular/common";
import { type AfterViewInit, Component, inject, type OnInit } from "@angular/core";
import { DEFAULT_MULTIVIEW_CONFIGURATION } from "@app/CONSTANTS";
import type { TypeMultiviewConfiguration } from "@app/Types";
import { Utils } from "@app/Utils";
import { ConfigService } from "@core/config/config.service";
import { Globals } from "@core/services/globals/globals.service";
import { TranslatePipe } from "@ngx-translate/core";
import { CardRegistry } from "@shared/directives/card/card.directive";
import { CalculatorView } from "../calculator/calculator.view";
import { CodeView } from "../code/code.view";
import { DatapathView } from "../datapath/datapath.view";
import { MemoryView } from "../memory/memory.view";
import { CycleClockDiagramView } from "../pixi-cycle-clock-diagram/cycle-clock-diagram.view";
import { PipelineView } from "../pixi-pipeline/pipeline.view";
import { RegistersView } from "../registers/registers.view";
import { StatisticsView } from "../statistics/statistics.view";

@Component({
  selector: "view-multiples-views",
  templateUrl: "./multiples-views.component.html",
  styleUrls: [],
  imports: [
    CdkDropListGroup,
    CdkDropList,
    CdkDrag,
    CdkDragPlaceholder,
    NgTemplateOutlet,
    CalculatorView,
    CdkDragHandle,
    PipelineView,
    RegistersView,
    StatisticsView,
    CycleClockDiagramView,
    MemoryView,
    CodeView,
    DatapathView,
    TranslatePipe,
  ],
})
export class MultiplesViewsComponent implements OnInit, AfterViewInit {
  globals = inject(Globals);
  private config = inject(ConfigService);
  private cards = inject(CardRegistry);

  public multiviewConfiguration: TypeMultiviewConfiguration = Utils.clone(DEFAULT_MULTIVIEW_CONFIGURATION);
  public main_list_1: string[] = [];
  public main_list_2: string[] = [];

  ngOnInit(): void {
    // A copy: the lists change when the cards are dragged
    this.multiviewConfiguration = structuredClone(this.config.value().multiview);
    this.main_list_1 = this.multiviewConfiguration.list_1;
    this.main_list_2 = this.multiviewConfiguration.list_2;
  }

  ngAfterViewInit(): void {
    // The windows start folded (except the debug window, which is not part of the multiview)
    this.cards.collapseAll((card) => card.id === "card-debug");
    // A window that unfolds or fills the screen measures its tables and canvases itself (ResizeObserver)
  }

  /** Moves a card and remembers the new layout */
  public drop(event: CdkDragDrop<string[]>): void {
    this.globals.drop(event);
    this.config.update({ multiview: { ...this.multiviewConfiguration, list_1: this.main_list_1, list_2: this.main_list_2 } });
  }
}
