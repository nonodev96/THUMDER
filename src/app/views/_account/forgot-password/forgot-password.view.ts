import { DOCUMENT } from "@angular/common";
import { Component, inject, type OnInit } from "@angular/core";
import { UntypedFormBuilder, UntypedFormControl, type UntypedFormGroup, Validators } from "@angular/forms";
import { AppComponent } from "@app/app.component";
import { AuthService } from "@core/auth/auth.service";

@Component({
  selector: "app-forgot-password",
  templateUrl: "./forgot-password.view.html",
  standalone: false,
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

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
    this.forgotPasswordForm = this.formBuilder.group({
      password_reset_email: new UntypedFormControl("", Validators.compose([Validators.required, Validators.email])),
    });
  }

  ngOnInit(): void {}
}
