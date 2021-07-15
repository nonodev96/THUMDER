import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PageNotFoundComponent } from './__shared/components';

// _layouts
import { AdminComponent } from "./_layouts/admin/admin.component";
import { AuthComponent } from "./_layouts/auth/auth.component";

// admin views

// auth views
import { LoginComponent } from "./views/auth/login/login.component";
import { RegisterComponent } from "./views/auth/register/register.component";
import { ForgotPasswordComponent } from "./views/auth/forgot-password/forgot-passwordComponent";

// no _layouts views
import { IndexComponent } from "./views/index/index.component";
import { LandingComponent } from "./views/landing/landing.component";
import { ProfileComponent } from "./views/profile/profile.component";
import { PipelinePixiComponent } from "./components/pipeline-pixi/pipeline-pixi.component";
import { MonacoEditorComponent } from "./components/monaco-editor/monaco-editor.component";
import { IDEComponent } from "./views/ide/ide.component";

const routes: Routes = [
  {
    path: '',
    component: IndexComponent
  },
  // admin views
  {
    path: "admin",
    component: AdminComponent,
    children: [
      {path: "", redirectTo: "dashboard", pathMatch: "full"},
    ],
  },
  // auth views
  {
    path: "auth",
    component: AuthComponent,
    children: [
      {path: "login", component: LoginComponent},
      {path: "register", component: RegisterComponent},
      {path: "forgot-password", component: ForgotPasswordComponent},
      {path: "", redirectTo: "login", pathMatch: "full"},
    ],
  },
  // no layout views
  {path: "profile", component: ProfileComponent},
  {path: "landing", component: LandingComponent},
  {path: "ide", component: IDEComponent},

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
