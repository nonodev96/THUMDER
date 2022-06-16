import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

import { PageNotFoundComponent } from "./__shared/components";

// _layouts
import { LayoutAdminComponent } from "./_layouts/admin/layout-admin.component";
import { LayoutAuthComponent } from "./_layouts/auth/layout-auth.component";
import { LayoutLandingComponent } from "./_layouts/landing/layout-landing.component";

// components
import { MonacoEditorComponent } from "./components/monaco-editor/monaco-editor.component";

// _admin views

// _auth views
import { CalculatorView } from "./views/_auth/calculator/calculator.view";
import { CodeView } from "./views/_auth/code/code.view";
import { ConfigView } from "./views/_auth/config/config.view";
import { DocsView } from "./views/_auth/docs/docs.view";
import { FileManagerView } from "./views/_auth/file-manager/file-manager.view";
import { EditorView } from "./views/_auth/editor/editor.view";
import { MemoryView } from "./views/_auth/memory/memory.view";
import { CycleClockDiagramView } from "./views/_auth/pixi-cycle-clock-diagram/cycle-clock-diagram.view";
import { PipelineView } from "./views/_auth/pixi-pipeline/pipeline.view";
import { ProfileView } from "./views/_auth/profile/profile.view";
import { RegistersView } from "./views/_auth/registers/registers.view";
import { StatisticsView } from "./views/_auth/statistics/statistics.view";

// no _layouts views
import { DebugView } from "./views/debug/debug-view";

import { IndexView } from "./views/_index/index.view";
import { ForgotPasswordView } from "./views/_account/forgot-password/forgot-password.view";
import { LoginView } from "./views/_account/login/login.view";
import { RegisterView } from "./views/_account/register/register.view";

// _landing views
import { LandingView } from "./views/_landing/landing/landing.view";
import { AboutView } from "./views/_landing/about/about.view";

// Guards
import { AuthGuard } from "./__shared/guard/auth.guard";
import { NoAuthGuard } from "./__shared/guard/no-auth.guard";
import { MultiplesViewsComponent } from "./views/_auth/_views/multiples-views.component";
import { LoggerView } from "./views/_auth/logger/logger.view";
import { GridViewComponent } from "./views/_auth/_grid_view/grid-view.component";


const routes: Routes = [
  {
    path:        "",
    component:   LayoutAuthComponent,
    canActivate: [ AuthGuard ],
    children:    [
      { path: "", component: IndexView, pathMatch: "full" }
    ]
  },
  // _admin views
  {
    path:      "admin",
    component: LayoutAdminComponent,
    children:  [
      { path: "", redirectTo: "/", pathMatch: "full" }
    ]
  },
  // _auth views
  {
    path:        "auth",
    component:   LayoutAuthComponent,
    canActivate: [ AuthGuard ],
    data:        { breadcrumb: "Home" },
    children:    [
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

      { path: "debug", component: DebugView, data: { breadcrumb: "Debug" } }
    ]
  },
  // _landing views
  {
    path:         "landing",
    loadChildren: () => import('./views/_landing/landing.module').then(m => m.LandingModule)
  },
  // _account views
  {
    path:         "account",
    loadChildren: () => import('./views/_account/account.module').then(m => m.AccountModule)
  },
  {
    path:      "monaco",
    component: MonacoEditorComponent
  },
  {
    path:      "**",
    component: PageNotFoundComponent
  },
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {
}


