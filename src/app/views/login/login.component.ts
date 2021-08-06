import { Component, Inject, OnInit } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { AuthService } from "../../__core/auth/auth.service";
import { ElectronService } from "../../__core/services";


@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  showSpinner: boolean;


  error_messages = {
    'email': [
      {type: 'required', message: 'Email is required.'},
      {type: 'minlength', message: 'Email length.'},
      {type: 'maxlength', message: 'Email length.'},
      {type: 'required', message: 'please enter a valid email address.'}
    ],
    'password': [
      {type: 'required', message: 'password is required.'},
      {type: 'minlength', message: 'password length.'},
      {type: 'maxlength', message: 'password length.'}
    ],
  }

  constructor(@Inject(DOCUMENT) private document: Document,
              public electronService: ElectronService,
              public authService: AuthService,
              public formBuilder: FormBuilder) {
    this.loginForm = this.formBuilder.group({

      email: new FormControl('', Validators.compose([
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(30)
      ])),
      password: new FormControl('', Validators.compose([
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(30)
      ])),
    }, {});
    this.showSpinner = false;
  }

  ngOnInit(): void {
    this.document.body.classList.add('login-page')
  }

  async GoogleAuth() {
    this.showSpinner = true;
    try {
      await this.authService.GoogleAuth()
    } catch (e) {
      console.error(e)
    } finally {
      this.showSpinner = false;
    }
  }

  async GithubAuth() {
    this.showSpinner = true;
    try {
      await this.authService.GithubAuth()
    } catch (e) {
      console.error(e)
    } finally {
      this.showSpinner = false;
    }
  }
}
