import { DragDropModule } from "@angular/cdk/drag-drop";
import { ScrollingModule } from "@angular/cdk/scrolling";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { MatSortModule } from "@angular/material/sort";
import { MatTableModule } from "@angular/material/table";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatTooltipModule } from "@angular/material/tooltip";
import { ComponentsModule } from "@components/components.module";
import { TranslateModule } from "@ngx-translate/core";
import { SharedModule } from "@shared/shared.module";
import { GridViewComponent } from "@views/_auth/_grid_view/grid-view.component";
import { MultiplesViewsComponent } from "@views/_auth/_views/multiples-views.component";
import { AuthRoutingModule } from "@views/_auth/auth-routing.module";
import { CalculatorView } from "@views/_auth/calculator/calculator.view";
import { CodeView } from "@views/_auth/code/code.view";
import { ConfigView } from "@views/_auth/config/config.view";
import { DocsView } from "@views/_auth/docs/docs.view";
import { EditorView } from "@views/_auth/editor/editor.view";
import { FileManagerView } from "@views/_auth/file-manager/file-manager.view";
import { LoggerView } from "@views/_auth/logger/logger.view";
import { MemoryView } from "@views/_auth/memory/memory.view";
import { CycleClockDiagramView } from "@views/_auth/pixi-cycle-clock-diagram/cycle-clock-diagram.view";
import { PipelineView } from "@views/_auth/pixi-pipeline/pipeline.view";
import { ProfileView } from "@views/_auth/profile/profile.view";
import { RegistersView } from "@views/_auth/registers/registers.view";
import { StatisticsView } from "@views/_auth/statistics/statistics.view";
import { DebugView } from "@views/debug/debug-view";
import { GridsterModule } from "angular-gridster2";
import { TableVirtualScrollModule } from "ng-table-virtual-scroll";
import { NgChartsModule } from "ng2-charts";
import { MarkdownModule } from "ngx-markdown";

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
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatToolbarModule,
    MatTooltipModule,
    DragDropModule,
    MarkdownModule,
    TranslateModule,
    SharedModule,
    ComponentsModule,
    AuthRoutingModule,
  ],
})
export class AuthModule {}
