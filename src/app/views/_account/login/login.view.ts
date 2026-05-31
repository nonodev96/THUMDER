import { DOCUMENT } from "@angular/common";
import { Component, inject, type OnInit } from "@angular/core";
import { UntypedFormBuilder, UntypedFormControl, type UntypedFormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { AppComponent } from "@app/app.component";
import { AuthService } from "@core/auth/auth.service";
import { ElectronService } from "@core/services";

@Component({
  selector: "app-login",
  templateUrl: "./login.view.html",
  standalone: false,
})
export class LoginView implements OnInit {
  private _document = inject<Document>(DOCUMENT);
  electronService = inject(ElectronService);
  authService = inject(AuthService);
  router = inject(Router);
  app = inject(AppComponent);
  formBuilder = inject(UntypedFormBuilder);

  public loginForm: UntypedFormGroup;
  public showSpinner: boolean = false;

  public error_messages = {
    email: [
      { type: "required", message: "Email is required." },
      { type: "email", message: "Please enter a valid email address." },
    ],
    password: [
      { type: "required", message: "Password is required." },
      { type: "minlength", message: "Password min length." },
      { type: "maxlength", message: "Password max length." },
    ],
  };

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
    this.loginForm = this.formBuilder.group(
      {
        email: new UntypedFormControl("", Validators.compose([Validators.required, Validators.email])),
        password: new UntypedFormControl("", Validators.compose([Validators.required, Validators.minLength(6), Validators.maxLength(30)])),
      },
      {},
    );

    this.authService.getIsLoggingObservable().subscribe(async (isLogging) => {
      if (isLogging) {
        await this.router.navigateByUrl("/");
      }
    });
  }

  ngOnInit(): void {}

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
