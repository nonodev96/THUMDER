import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PublicRoutes } from "./types";

import { PageNotFoundComponent } from './__shared/components';

// _layouts
import { LayoutAdminComponent } from "./_layouts/admin/layout-admin.component";
import { LayoutAuthComponent } from "./_layouts/auth/layout-auth.component";

// components
import { MemoryComponent } from "./components/memory/memory.component";
import { MonacoEditorComponent } from "./components/monaco-editor/monaco-editor.component";

// _admin views

// _auth views
import { LoginView } from "./views/login/login.view";
import { RegisterView } from "./views/register/register.view";
import { ForgotPasswordView } from "./views/forgot-password/forgot-password.view";
import { DocsView } from "./views/_auth/docs/docs.view";
import { PipelineView } from "./views/_auth/pixi-pipeline/pipeline.view";
import { CycleClockDiagramView } from "./views/_auth/pixi-cycle-clock-diagram/cycle-clock-diagram.view";
import { IDEView } from "./views/_auth/ide/ide.view";
import { FileManagerView } from "./views/_auth/file-manager/file-manager.view";
import { ProfileView } from "./views/_auth/profile/profile.view";

// no _layouts views
import { IndexView } from "./views/_index/index.view";
import { LandingView } from "./views/landing/landing.view";
import { AuthGuard } from "./__shared/guard/auth.guard";
import { NoAuthGuard } from "./__shared/guard/no-auth.guard";
import { DebugView } from "./views/debug/debug-view";




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
      {path: "file-manager", component: FileManagerView, data: {breadcrumb: 'File Manager'}},
      {path: "ide", component: IDEView, data: {breadcrumb: 'IDE'}},
      {path: "pipeline", component: PipelineView, data: {breadcrumb: 'Pipeline'}},
      {path: "cycle-clock-diagram", component: CycleClockDiagramView, data: {breadcrumb: 'Pipeline'}},
      {path: "memory", component: MemoryComponent, data: {breadcrumb: 'Memory'}},
      {path: "profile", component: ProfileView, data: {breadcrumb: 'Profile'}},
      {path: "documentation", component: DocsView, data: {breadcrumb: 'Documentation'}},
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
  // no layout views
  {path: "landing", component: LandingView},

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
    RouterModule.forRoot(routes),
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
