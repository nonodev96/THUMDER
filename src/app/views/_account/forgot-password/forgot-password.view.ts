import { DOCUMENT } from "@angular/common";
import { Component, Inject, type OnInit } from "@angular/core";
import { UntypedFormBuilder, UntypedFormControl, type UntypedFormGroup, Validators } from "@angular/forms";
import { AuthService } from "../../../__core/auth/auth.service";
import { AppComponent } from "../../../app.component";

@Component({
  selector: "app-forgot-password",
  templateUrl: "./forgot-password.view.html",
  standalone: false,
})
export class ForgotPasswordView implements OnInit {
  public forgotPasswordForm: UntypedFormGroup;
  public error_messages = {
    password_reset_email: [
      { type: "required", message: "Email is required." },
      { type: "email", message: "Please enter a valid email address." },
    ],
  };

  constructor(
    @Inject(DOCUMENT)
    private _document: Document,
    public app: AppComponent,
    public authService: AuthService,
    public formBuilder: UntypedFormBuilder,
  ) {
    this.forgotPasswordForm = this.formBuilder.group({
      password_reset_email: new UntypedFormControl("", Validators.compose([Validators.required, Validators.email])),
    });
  }

  ngOnInit(): void {}
}
