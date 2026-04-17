import { NgModule } from "@angular/core";
import { RouterModule, type Routes } from "@angular/router";
import { DebugView } from "../debug/debug-view";
import { GridViewComponent } from "./_grid_view/grid-view.component";
import { MultiplesViewsComponent } from "./_views/multiples-views.component";
import { CalculatorView } from "./calculator/calculator.view";
import { CodeView } from "./code/code.view";
import { ConfigView } from "./config/config.view";
import { DocsView } from "./docs/docs.view";
import { EditorView } from "./editor/editor.view";
import { FileManagerView } from "./file-manager/file-manager.view";
import { LoggerView } from "./logger/logger.view";
import { MemoryView } from "./memory/memory.view";
import { CycleClockDiagramView } from "./pixi-cycle-clock-diagram/cycle-clock-diagram.view";
import { PipelineView } from "./pixi-pipeline/pipeline.view";
import { ProfileView } from "./profile/profile.view";
import { RegistersView } from "./registers/registers.view";
import { StatisticsView } from "./statistics/statistics.view";

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
