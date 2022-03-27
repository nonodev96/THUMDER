import { Component, Inject, OnInit } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from "@angular/forms";
import { AuthService } from "../../../__core/auth/auth.service";
import { ElectronService } from "../../../__core/services";

@Component({
  selector:    "app-register",
  templateUrl: "./register.view.html",
})
export class RegisterView implements OnInit {
  registerForm: FormGroup;
  showSpinner: boolean;

  error_messages = {
    first_name:       [
      { type: "required", message: "First Name is required." },
      { type: "minlength", message: "First Name min length is 6." },
      { type: "maxlength", message: "First Name max length is 30." }
    ],
    email:            [
      { type: "required", message: "Email is required." },
      { type: "email", message: "Please enter a valid email address." }
    ],
    password:         [
      { type: "required", message: "Password is required." },
      { type: "minlength", message: "Password min length is 6." },
      { type: "maxlength", message: "Password max length is 30." }
    ],
    confirm_password: [
      { type: "required", message: "Confirm password is required." },
      { type: "minlength", message: "Confirm password min length is 6." },
      { type: "maxlength", message: "Confirm password max length is 30." },
      { type: "password_not_match", message: "Password not match." }
    ],
  };

  constructor(@Inject(DOCUMENT) private document: Document,
              public authService: AuthService,
              public electronService: ElectronService,
              public formBuilder: FormBuilder) {
    this.registerForm = this.formBuilder.group({
      first_name:       new FormControl("", Validators.compose([
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(30)
      ])),
      email:            new FormControl("", Validators.compose([
        Validators.required,
        Validators.email
      ])),
      password:         new FormControl("", Validators.compose([
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(30)
      ])),
      confirm_password: new FormControl("", Validators.compose([
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(30),
        RegisterView.matchValues('password')
      ])),
    }, {
      validators: this.checkPassword.bind(this)
    });
    this.showSpinner = false;
  }

  ngOnInit(): void {
  }

  static matchValues(matchTo: string): (AbstractControl) => ValidationErrors | null {
    return (control: AbstractControl): ValidationErrors | null => {
      return !!control.parent
      && !!control.parent.value
      && control.value === control.parent.controls[matchTo].value
        ? null : { password_not_match: true };
    };
  }


  public checkPassword(formGroup: FormGroup) {
    const { value: password } = formGroup.get("password");
    const { value: confirmPassword } = formGroup.get("confirm_password");
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
