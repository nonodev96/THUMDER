import { NgModule } from "@angular/core";
import { RouterModule, type Routes } from "@angular/router";
import { DebugView } from "@views/debug/debug-view";
import { GridViewComponent } from "@views/_auth/_grid_view/grid-view.component";
import { MultiplesViewsComponent } from "@views/_auth/_views/multiples-views.component";
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

const routes: Routes = [
  { path: "", redirectTo: "account", pathMatch: "full" },
  { path: "calculator", component: CalculatorView, data: { breadcrumb: "Calculator" } },
  { path: "code", component: CodeView, data: { breadcrumb: "Code" } },
  { path: "config", component: ConfigView, data: { breadcrumb: "Config" } },
  { path: "documentation", component: DocsView, data: { breadcrumb: "Documentation" } },
  { path: "file-manager", component: FileManagerView, data: { breadcrumb: "File Manager" } },
  { path: "editor", component: EditorView, data: { breadcrumb: "Editor" } },
  { path: "logger", component: LoggerView, data: { breadcrumb: "Logger" } },
  { path: "memory", component: MemoryView, data: { breadcrumb: "Memory" } },
  { path: "cycle-clock-diagram", component: CycleClockDiagramView, data: { breadcrumb: "Cycle Clock Diagram" } },
  { path: "pipeline", component: PipelineView, data: { breadcrumb: "Pipeline" } },
  { path: "profile", component: ProfileView, data: { breadcrumb: "Profile" } },
  { path: "registers", component: RegistersView, data: { breadcrumb: "Registers" } },
  { path: "statistics", component: StatisticsView, data: { breadcrumb: "Statistics" } },
  { path: "multiview", component: MultiplesViewsComponent, data: { breadcrumb: "Multiview" } },
  { path: "grid-view", component: GridViewComponent, data: { breadcrumb: "Grid view" } },
  { path: "debug", component: DebugView, data: { breadcrumb: "Debug" } },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthRoutingModule {}
