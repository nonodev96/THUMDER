import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AccountRoutingModule } from './account-routing.module';

import { ForgotPasswordView } from "./forgot-password/forgot-password.view";
import { LoginView } from "./login/login.view";
import { RegisterView } from "./register/register.view";
import { ReactiveFormsModule } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";


@NgModule({
  declarations: [
    ForgotPasswordView,
    LoginView,
    RegisterView
  ],
  imports: [
    CommonModule,
    AccountRoutingModule,
    ReactiveFormsModule,
    TranslateModule
  ]
})
export class AccountModule {
}
