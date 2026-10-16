import type { Routes } from "@angular/router";

// Each view is loaded when it opens (REN-02): Monaco comes with the editor, PixiJS with its canvases, xterm with the log
export const authRoutes: Routes = [
  { path: "", redirectTo: "account", pathMatch: "full" },
  {
    path: "calculator",
    loadComponent: () => import("@views/_auth/calculator/calculator.view").then((m) => m.CalculatorView),
    data: { breadcrumb: "Calculator" },
  },
  { path: "code", loadComponent: () => import("@views/_auth/code/code.view").then((m) => m.CodeView), data: { breadcrumb: "Code" } },
  {
    path: "config",
    loadComponent: () => import("@views/_auth/config/config.view").then((m) => m.ConfigView),
    data: { breadcrumb: "Config" },
  },
  {
    path: "documentation",
    loadComponent: () => import("@views/_auth/docs/docs.view").then((m) => m.DocsView),
    data: { breadcrumb: "Documentation" },
  },
  {
    path: "file-manager",
    loadComponent: () => import("@views/_auth/file-manager/file-manager.view").then((m) => m.FileManagerView),
    data: { breadcrumb: "File Manager" },
  },
  {
    path: "editor",
    loadComponent: () => import("@views/_auth/editor/editor.view").then((m) => m.EditorView),
    data: { breadcrumb: "Editor" },
  },
  {
    path: "logger",
    loadComponent: () => import("@views/_auth/logger/logger.view").then((m) => m.LoggerView),
    data: { breadcrumb: "Logger" },
  },
  {
    path: "memory",
    loadComponent: () => import("@views/_auth/memory/memory.view").then((m) => m.MemoryView),
    data: { breadcrumb: "Memory" },
  },
  {
    path: "cycle-clock-diagram",
    loadComponent: () => import("@views/_auth/pixi-cycle-clock-diagram/cycle-clock-diagram.view").then((m) => m.CycleClockDiagramView),
    data: { breadcrumb: "Cycle Clock Diagram" },
  },
  {
    path: "pipeline",
    loadComponent: () => import("@views/_auth/pixi-pipeline/pipeline.view").then((m) => m.PipelineView),
    data: { breadcrumb: "Pipeline" },
  },
  {
    path: "profile",
    loadComponent: () => import("@views/_auth/profile/profile.view").then((m) => m.ProfileView),
    data: { breadcrumb: "Profile" },
  },
  {
    path: "registers",
    loadComponent: () => import("@views/_auth/registers/registers.view").then((m) => m.RegistersView),
    data: { breadcrumb: "Registers" },
  },
  {
    path: "statistics",
    loadComponent: () => import("@views/_auth/statistics/statistics.view").then((m) => m.StatisticsView),
    data: { breadcrumb: "Statistics" },
  },
  {
    path: "shared",
    loadComponent: () => import("@views/_auth/shared/shared-exercise.view").then((m) => m.SharedExerciseView),
    data: { breadcrumb: "Shared" },
  },
  {
    path: "exercises",
    loadComponent: () => import("@views/_auth/exercises/exercises.view").then((m) => m.ExercisesView),
    data: { breadcrumb: "Exercises" },
  },
  {
    path: "datapath",
    loadComponent: () => import("@views/_auth/datapath/datapath.view").then((m) => m.DatapathView),
    data: { breadcrumb: "Datapath" },
  },
  {
    path: "multiview",
    loadComponent: () => import("@views/_auth/_views/multiples-views.component").then((m) => m.MultiplesViewsComponent),
    data: { breadcrumb: "Multiview" },
  },
  // The grid view (angular-gridster2) was a beta that did the same as the multiview: its old links go there
  { path: "grid-view", redirectTo: "multiview" },
];
