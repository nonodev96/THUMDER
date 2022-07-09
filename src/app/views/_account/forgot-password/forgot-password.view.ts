import { Component, Inject, OnInit } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { AuthService } from "../../../__core/auth/auth.service";
import { AppComponent } from "../../../app.component";

@Component({
  selector:    "app-forgot-password",
  templateUrl: "./forgot-password.view.html",
})
export class ForgotPasswordView implements OnInit {
  public forgotPasswordForm: FormGroup;
  public error_messages = {
    password_reset_email: [
      { type: "required", message: "Email is required." },
      { type: "email", message: "Please enter a valid email address." }
    ],
  }

  constructor(@Inject(DOCUMENT)
              private document: Document,
              public app: AppComponent,
              public authService: AuthService,
              public formBuilder: FormBuilder) {
    this.forgotPasswordForm = this.formBuilder.group({
      password_reset_email: new FormControl("", Validators.compose([
          Validators.required,
          Validators.email
        ])
      ),
    });
  }

  ngOnInit(): void {
  }
}
