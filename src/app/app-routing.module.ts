import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PageNotFoundComponent } from './__shared/components';

// _layouts
import { LayoutAdminComponent } from "./_layouts/admin/layout-admin.component";
import { LayoutAuthComponent } from "./_layouts/auth/layout-auth.component";

// _admin views

// _auth views
import { LoginComponent } from "./views/login/login.component";
import { RegisterComponent } from "./views/register/register.component";
import { ForgotPasswordComponent } from "./views/forgot-password/forgot-passwordComponent";

// no _layouts views
import { IndexComponent } from "./views/_index/index.component";
import { LandingComponent } from "./views/landing/landing.component";
import { ProfileComponent } from "./views/_auth/profile/profile.component";
import { PipelinePixiComponent } from "./components/pipeline-pixi/pipeline-pixi.component";
import { MonacoEditorComponent } from "./components/monaco-editor/monaco-editor.component";
import { IDEComponent } from "./views/_auth/ide/ide.component";
import { FileManagerComponent } from "./views/_auth/file-manager/file-manager.component";
import { AuthGuard } from "./__shared/guard/auth.guard";
import { NoAuthGuard } from "./__shared/guard/no-auth.guard";

const routes: Routes = [
  {
    path: '',
    component: IndexComponent
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
      {path: "file-manager", component: FileManagerComponent, data: {breadcrumb: 'File Manager'}},
      {path: "ide", component: IDEComponent, data: {breadcrumb: 'IDE'}},
      {path: "profile", component: ProfileComponent, data: {breadcrumb: 'Profile'}},
    ],
  },
  {
    path: "login",
    component: LoginComponent,
    canActivate: [NoAuthGuard]
  },
  {
    path: "register",
    component: RegisterComponent,
    canActivate: [NoAuthGuard]
  },
  {
    path: "forgot-password",
    component: ForgotPasswordComponent,
    canActivate: [NoAuthGuard]
  },
  // no layout views
  {path: "landing", component: LandingComponent},

  {
    path: 'monaco',
    component: MonacoEditorComponent
  },
  {
    path: 'pixi',
    component: PipelinePixiComponent
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
