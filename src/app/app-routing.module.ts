import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PageNotFoundComponent } from './__shared/components';

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
import { IDEView } from "./views/_auth/ide/ide.view";
import { MemoryView } from "./views/_auth/memory/memory.view";
import { CycleClockDiagramView } from "./views/_auth/pixi-cycle-clock-diagram/cycle-clock-diagram.view";
import { PipelineView } from "./views/_auth/pixi-pipeline/pipeline.view";
import { ProfileView } from "./views/_auth/profile/profile.view";
import { RegistersView } from "./views/_auth/registers/registers.view";
import { StatisticsView } from "./views/_auth/statistics/statistics.view";

// no _layouts views
import { DebugView } from "./views/debug/debug-view";

import { IndexView } from "./views/_index/index.view";
import { ForgotPasswordView } from "./views/forgot-password/forgot-password.view";
import { LoginView } from "./views/login/login.view";
import { RegisterView } from "./views/register/register.view";

// _landing views
import { LandingView } from "./views/_landing/landing/landing.view";
import { AboutView } from "./views/_landing/about/about.view";

// Guards
import { AuthGuard } from "./__shared/guard/auth.guard";
import { NoAuthGuard } from "./__shared/guard/no-auth.guard";


const routes: Routes = [
  {
    path: '',
    component: IndexView
  },
  // _admin views
  {
    path: "admin",
    component: LayoutAdminComponent,
    children: [
      {path: "", redirectTo: "dashboard", pathMatch: "full"},
    ],
  },
  // _auth views
  {
    path: "auth",
    component: LayoutAuthComponent,
    canActivate: [AuthGuard],
    data: {breadcrumb: 'Home'},
    children: [
      {path: "", redirectTo: "login", pathMatch: "full"},
      {path: "calculator", component: CalculatorView, data: {breadcrumb: 'Calculator'}},
      {path: "code", component: CodeView, data: {breadcrumb: 'Code'}},
      {path: "config", component: ConfigView, data: {breadcrumb: 'Config'}},
      {path: "documentation", component: DocsView, data: {breadcrumb: 'Documentation'}},
      {path: "file-manager", component: FileManagerView, data: {breadcrumb: 'File Manager'}},
      {path: "ide", component: IDEView, data: {breadcrumb: 'IDE'}},
      {path: "memory", component: MemoryView, data: {breadcrumb: 'Memory'}},
      {path: "cycle-clock-diagram", component: CycleClockDiagramView, data: {breadcrumb: 'Pipeline'}},
      {path: "pipeline", component: PipelineView, data: {breadcrumb: 'Pipeline'}},
      {path: "profile", component: ProfileView, data: {breadcrumb: 'Profile'}},
      {path: "registers", component: RegistersView, data: {breadcrumb: 'Registers'}},
      {path: "statistics", component: StatisticsView, data: {breadcrumb: 'Statistics'}},
    ],
  },
  // _landing views
  {
    path: "landing",
    component: LayoutLandingComponent,
    children: [
      {path: "", redirectTo: "dashboard", pathMatch: "full"},
      {path: "landing", component: LandingView, data: {breadcrumb: 'Landing'}},
      {path: "about", component: AboutView, data: {breadcrumb: 'About'}},
    ],
  },
  {
    path: "login",
    component: LoginView,
    canActivate: [NoAuthGuard]
  },
  {
    path: "register",
    component: RegisterView,
    canActivate: [NoAuthGuard]
  },
  {
    path: "forgot-password",
    component: ForgotPasswordView,
    canActivate: [NoAuthGuard]
  },
  {
    path: "debug",
    component: DebugView,
    canActivate: []
  },
  {
    path: 'monaco',
    component: MonacoEditorComponent
  },
  {
    path: '**',
    component: PageNotFoundComponent
  },

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {relativeLinkResolution: 'legacy'}),
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {
}


