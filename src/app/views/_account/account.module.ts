import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";
import { AccountRoutingModule } from "./account-routing.module";
import { ForgotPasswordView } from "./forgot-password/forgot-password.view";
import { LoginView } from "./login/login.view";
import { RegisterView } from "./register/register.view";

@NgModule({
  declarations: [ForgotPasswordView, LoginView, RegisterView],
  imports: [CommonModule, AccountRoutingModule, ReactiveFormsModule, TranslateModule],
})
export class AccountModule {}
