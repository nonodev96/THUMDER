import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { NoAuthGuard } from "../../__shared/guard/no-auth.guard";

import { ForgotPasswordView } from "./forgot-password/forgot-password.view";
import { LoginView } from "./login/login.view";
import { RegisterView } from "./register/register.view";

const routes: Routes = [
  {
    path:     '',
    children: [
      { path: "forgot-password", component: ForgotPasswordView, canActivate: [ NoAuthGuard ] },
      { path: "login", component: LoginView, canActivate: [ NoAuthGuard ] },
      { path: "register", component: RegisterView, canActivate: [ NoAuthGuard ] },
      { path: "**", redirectTo: "login" }
    ]
  }
];

@NgModule({
  imports: [ RouterModule.forChild(routes) ],
  exports: [ RouterModule ]
})
export class AccountRoutingModule {
}
