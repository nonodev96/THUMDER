import { Component, Inject, OnInit } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { Router } from "@angular/router";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { AuthService } from "../../../__core/auth/auth.service";
import { ElectronService } from "../../../__core/services";


@Component({
  selector:    "app-login",
  templateUrl: "./login.view.html",
})
export class LoginView implements OnInit {
  loginForm: FormGroup;
  showSpinner: boolean = false;

  error_messages = {
    email:    [
      { type: "required", message: "Email is required." },
      { type: "minlength", message: "Email length." },
      { type: "maxlength", message: "Email length." },
      { type: "required", message: "please enter a valid email address." }
    ],
    password: [
      { type: "required", message: "password is required." },
      { type: "minlength", message: "password length." },
      { type: "maxlength", message: "password length." }
    ],
  };

  constructor(@Inject(DOCUMENT) private document: Document,
              public electronService: ElectronService,
              public authService: AuthService,
              public router: Router,
              public formBuilder: FormBuilder) {
    this.loginForm = this.formBuilder.group({
      email:    new FormControl("", Validators.compose([
        Validators.required,
        Validators.email
      ])),
      password: new FormControl("", Validators.compose([
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(30)
      ])),
    }, {});

    this.authService.getIsLoggingObservable().subscribe((isLogging) => {
      if (isLogging) {
        this.router.navigateByUrl("/");
      }
    });
  }

  ngOnInit(): void {
  }

  async SignIn(email: string, password: string): Promise<void> {
    const userData = await this.authService.SignIn(email, password);
    if (userData) {
      await this.router.navigateByUrl("/");
    }
    return Promise.resolve();
  }

  async GoogleAuth(): Promise<void> {
    this.showSpinner = true;
    try {
      await this.authService.GoogleAuth();
    } catch (e) {
      console.error(e);
    } finally {
      this.showSpinner = false;
    }
    return Promise.resolve();
  }

  async GithubAuth(): Promise<void> {
    this.showSpinner = true;
    try {
      await this.authService.GithubAuth();
    } catch (e) {
      console.error(e);
    } finally {
      this.showSpinner = false;
    }
    return Promise.resolve();
  }
}
