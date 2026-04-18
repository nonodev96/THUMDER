import { NgModule } from "@angular/core";
import { RouterModule, type Routes } from "@angular/router";

import { NoAuthGuard } from "@shared/guard/no-auth.guard";

import { ForgotPasswordView } from "@views/_account/forgot-password/forgot-password.view";
import { LoginView } from "@views/_account/login/login.view";
import { RegisterView } from "@views/_account/register/register.view";

const routes: Routes = [
  {
    path: "",
    children: [
      { path: "forgot-password", component: ForgotPasswordView, canActivate: [NoAuthGuard] },
      { path: "login", component: LoginView, canActivate: [NoAuthGuard] },
      { path: "register", component: RegisterView, canActivate: [NoAuthGuard] },
      { path: "**", redirectTo: "login" },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AccountRoutingModule {}
