import { DOCUMENT } from "@angular/common";
import { Component, DestroyRef, inject, type OnInit } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormControl,
  type UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AppComponent } from "@app/app.component";
import { AuthService } from "@core/auth/auth.service";
import { logger } from "@core/logger/logger";
import { ElectronService } from "@core/services";
import { TranslatePipe } from "@ngx-translate/core";
import { DropdownDirective } from "../../../__shared/directives/bootstrap/dropdown.directive";

@Component({
  selector: "app-login",
  templateUrl: "./login.view.html",
  imports: [FormsModule, ReactiveFormsModule, RouterLink, DropdownDirective, TranslatePipe],
})
export class LoginView implements OnInit {
  private destroyRef = inject(DestroyRef);
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

  constructor() {
    this.loginForm = this.formBuilder.group(
      {
        email: new UntypedFormControl("", Validators.compose([Validators.required, Validators.email])),
        password: new UntypedFormControl("", Validators.compose([Validators.required, Validators.minLength(6), Validators.maxLength(30)])),
      },
      {},
    );

    this.authService
      .getIsLoggingObservable()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async (isLogging) => {
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
      logger.error(e);
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
      logger.error(e);
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
      logger.error(e);
    } finally {
      this.showSpinner = false;
    }
    return Promise.resolve();
  }
}
