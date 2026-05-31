import { DOCUMENT } from "@angular/common";
import { Component, inject, type OnInit } from "@angular/core";
import {
  type AbstractControl,
  UntypedFormBuilder,
  UntypedFormControl,
  type UntypedFormGroup,
  type ValidationErrors,
  Validators,
} from "@angular/forms";
import { AppComponent } from "@app/app.component";
import { AuthService } from "@core/auth/auth.service";
import { ElectronService } from "@core/services";

@Component({
  selector: "app-register",
  templateUrl: "./register.view.html",
  standalone: false,
})
export class RegisterView implements OnInit {
  private _document = inject<Document>(DOCUMENT);
  authService = inject(AuthService);
  app = inject(AppComponent);
  electronService = inject(ElectronService);
  formBuilder = inject(UntypedFormBuilder);

  public registerForm: UntypedFormGroup;
  public showSpinner: boolean;

  public error_messages = {
    first_name: [
      { type: "required", message: "First Name is required." },
      { type: "minlength", message: "First Name min length is 6." },
      { type: "maxlength", message: "First Name max length is 30." },
    ],
    email: [
      { type: "required", message: "Email is required." },
      { type: "email", message: "Please enter a valid email address." },
    ],
    password: [
      { type: "required", message: "Password is required." },
      { type: "minlength", message: "Password min length is 6." },
      { type: "maxlength", message: "Password max length is 30." },
    ],
    confirm_password: [
      { type: "required", message: "Confirm password is required." },
      { type: "minlength", message: "Confirm password min length is 6." },
      { type: "maxlength", message: "Confirm password max length is 30." },
      { type: "password_not_match", message: "Password not match." },
    ],
  };

  public translationEnabled: boolean = false;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
    this.registerForm = this.formBuilder.group(
      {
        first_name: new UntypedFormControl(
          "",
          Validators.compose([Validators.required, Validators.minLength(6), Validators.maxLength(30)]),
        ),
        email: new UntypedFormControl("", Validators.compose([Validators.required, Validators.email])),
        password: new UntypedFormControl("", Validators.compose([Validators.required, Validators.minLength(6), Validators.maxLength(30)])),
        confirm_password: new UntypedFormControl(
          "",
          Validators.compose([
            Validators.required,
            Validators.minLength(6),
            Validators.maxLength(30),
            RegisterView.matchValues("password"),
          ]),
        ),
      },
      {
        validators: this.checkPassword.bind(this),
      },
    );
    this.showSpinner = false;
  }

  ngOnInit(): void {}

  static matchValues(matchTo: string): (arg: AbstractControl) => ValidationErrors | null {
    return (control: AbstractControl): ValidationErrors | null => {
      return !!control.parent &&
        !!control.parent.value &&
        control.value === (control.parent.controls as Record<string, AbstractControl>)[matchTo]?.value
        ? null
        : { password_not_match: true };
    };
  }

  public checkPassword(formGroup: UntypedFormGroup) {
    const password = formGroup.get("password")?.value;
    const confirmPassword = formGroup.get("confirm_password")?.value;
    return password === confirmPassword ? null : { password_not_match: true };
  }

  public async GoogleAuth() {
    this.showSpinner = true;
    try {
      await this.authService.GoogleAuth();
    } catch (e) {
      console.error(e);
    } finally {
      this.showSpinner = false;
    }
  }

  public async GithubAuth() {
    this.showSpinner = true;
    try {
      await this.authService.GithubAuth();
    } catch (e) {
      console.error(e);
    } finally {
      this.showSpinner = false;
    }
  }
}
