import { Component, Inject, OnInit } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { Router } from "@angular/router";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { AuthService } from "../../../__core/auth/auth.service";
import { ElectronService } from "../../../__core/services";
import { AppComponent } from "../../../app.component";


@Component({
  selector:    "app-login",
  templateUrl: "./login.view.html",
})
export class LoginView implements OnInit {
  public loginForm: FormGroup;
  public showSpinner: boolean = false;

  public error_messages = {
    email:    [
      { type: "required", message: "Email is required." },
      { type: "email", message: "Please enter a valid email address." }
    ],
    password: [
      { type: "required", message: "Password is required." },
      { type: "minlength", message: "Password min length." },
      { type: "maxlength", message: "Password max length." }
    ],
  };
  private translationEnabled: boolean = false;

  constructor(@Inject(DOCUMENT) private document: Document,
              public electronService: ElectronService,
              public authService: AuthService,
              public router: Router,
              public app: AppComponent,
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

    this.authService.getIsLoggingObservable().subscribe(async (isLogging) => {
      if (isLogging) {
        await this.router.navigateByUrl("/");
      }
    });
  }

  ngOnInit(): void {
  }

  public async SignIn(email: string, password: string): Promise<void> {
    this.showSpinner = true;
    try {
      // =====
      const userData = await this.authService.SignIn(email, password);
      if (userData) {
        await this.router.navigateByUrl("/");
      }
      // =====
    } catch (e) {
      console.error(e);
    } finally {
      this.showSpinner = false;
    }
    return Promise.resolve();
  }

  public async GoogleAuth(): Promise<void> {
    this.showSpinner = true;
    try {
      // =====
      await this.authService.GoogleAuth();
      // =====
    } catch (e) {
      console.error(e);
    } finally {
      this.showSpinner = false;
    }
    return Promise.resolve();
  }

  public async GithubAuth(): Promise<void> {
    this.showSpinner = true;
    try {
      // =====
      await this.authService.GithubAuth();
      // =====
    } catch (e) {
      console.error(e);
    } finally {
      this.showSpinner = false;
    }
    return Promise.resolve();
  }
}
