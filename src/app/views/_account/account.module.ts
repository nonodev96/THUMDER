import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";
import { AccountRoutingModule } from "@views/_account/account-routing.module";
import { ForgotPasswordView } from "@views/_account/forgot-password/forgot-password.view";
import { LoginView } from "@views/_account/login/login.view";
import { RegisterView } from "@views/_account/register/register.view";

@NgModule({
  declarations: [ForgotPasswordView, LoginView, RegisterView],
  imports: [CommonModule, AccountRoutingModule, ReactiveFormsModule, TranslateModule],
})
export class AccountModule {}
