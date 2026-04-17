import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

import { TranslateModule } from "@ngx-translate/core";
import { NgChartsModule } from "ng2-charts";
import { GridsterModule } from "angular-gridster2";
import { MarkdownModule } from "ngx-markdown";
import { DragDropModule } from "@angular/cdk/drag-drop";
import { DxFileManagerModule } from "devextreme-angular";
import { ScrollingModule } from "@angular/cdk/scrolling";
import { TableVirtualScrollModule } from "ng-table-virtual-scroll";
import { MatTableModule } from "@angular/material/table";
import { MatSortModule } from "@angular/material/sort";

import { ComponentsModule } from "../../components/components.module";
import { SharedModule } from "../../__shared/shared.module";

import { CalculatorView } from "./calculator/calculator.view";
import { CodeView } from "./code/code.view";
import { ConfigView } from "./config/config.view";
import { DocsView } from "./docs/docs.view";
import { FileManagerView } from "./file-manager/file-manager.view";
import { EditorView } from "./editor/editor.view";
import { LoggerView } from "./logger/logger.view";
import { MemoryView } from "./memory/memory.view";
import { CycleClockDiagramView } from "./pixi-cycle-clock-diagram/cycle-clock-diagram.view";
import { PipelineView } from "./pixi-pipeline/pipeline.view";
import { ProfileView } from "./profile/profile.view";
import { RegistersView } from "./registers/registers.view";
import { StatisticsView } from "./statistics/statistics.view";
import { MultiplesViewsComponent } from "./_views/multiples-views.component";
import { GridViewComponent } from "./_grid_view/grid-view.component";
import { DebugView } from "../debug/debug-view";

import { AuthRoutingModule } from "./auth-routing.module";

@NgModule({
  declarations: [
    CalculatorView,
    CodeView,
    ConfigView,
    DocsView,
    FileManagerView,
    EditorView,
    LoggerView,
    MemoryView,
    CycleClockDiagramView,
    PipelineView,
    ProfileView,
    RegistersView,
    StatisticsView,
    MultiplesViewsComponent,
    GridViewComponent,
    DebugView,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ScrollingModule,
    MatTableModule,
    MatSortModule,
    TableVirtualScrollModule,
    NgChartsModule,
    GridsterModule,
    DxFileManagerModule,
    DragDropModule,
    MarkdownModule,
    TranslateModule,
    SharedModule,
    ComponentsModule,
    AuthRoutingModule,
  ]
})
export class AuthModule {
}
