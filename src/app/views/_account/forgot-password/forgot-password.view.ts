import { DOCUMENT } from "@angular/common";
import { Component, inject, type OnInit } from "@angular/core";
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormControl,
  type UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { RouterLink } from "@angular/router";
import { AppComponent } from "@app/app.component";
import { AuthService } from "@core/auth/auth.service";
import { TranslatePipe } from "@ngx-translate/core";
import { DropdownDirective } from "../../../__shared/directives/bootstrap/dropdown.directive";

@Component({
  selector: "app-forgot-password",
  templateUrl: "./forgot-password.view.html",
  imports: [FormsModule, ReactiveFormsModule, RouterLink, DropdownDirective, TranslatePipe],
})
export class ForgotPasswordView implements OnInit {
  private _document = inject<Document>(DOCUMENT);
  app = inject<AppComponent>(AppComponent);
  authService = inject(AuthService);
  formBuilder = inject(UntypedFormBuilder);

  public forgotPasswordForm: UntypedFormGroup;
  public error_messages = {
    password_reset_email: [
      { type: "required", message: "Email is required." },
      { type: "email", message: "Please enter a valid email address." },
    ],
  };

  constructor() {
    this.forgotPasswordForm = this.formBuilder.group({
      password_reset_email: new UntypedFormControl("", Validators.compose([Validators.required, Validators.email])),
    });
  }

  ngOnInit(): void {}
}
