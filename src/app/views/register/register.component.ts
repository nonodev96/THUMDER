import { Component, Inject, OnInit } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { AuthService } from "../../__core/auth/auth.service";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { ElectronService } from "../../__core/services";

@Component({
  selector: "app-register",
  templateUrl: "./register.component.html",
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  showSpinner: boolean;

  error_messages = {
    'fname': [
      {type: 'required', message: 'First Name is required.'},
    ],
    // 'lname': [
    //   {type: 'required', message: 'Last Name is required.'}
    // ],
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
    'confirm_password': [
      {type: 'required', message: 'password is required.'},
      {type: 'minlength', message: 'password length.'},
      {type: 'maxlength', message: 'password length.'}
    ],
  }

  constructor(@Inject(DOCUMENT) private document: Document,
              public authService: AuthService,
              public electronService: ElectronService,
              public formBuilder: FormBuilder) {
    this.registerForm = this.formBuilder.group({
      first_name: new FormControl('', Validators.compose([
        Validators.required
      ])),
      // lname: new FormControl('', Validators.compose([
      //   Validators.required
      // ])),
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
      confirm_password: new FormControl('', Validators.compose([
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(30)
      ])),
    }, {
      validators: this.checkPassword.bind(this)
    });
    this.showSpinner = false;
  }

  ngOnInit(): void {
    this.document.body.classList.add('register-page')
  }

  checkPassword(formGroup: FormGroup) {
    const {value: password} = formGroup.get('password');
    const {value: confirmPassword} = formGroup.get('confirm_password');
    return password === confirmPassword ? null : {passwordNotMatch: true};
  }

  GoogleAuth() {
    this.showSpinner = true;
    this.authService.GoogleAuth().then((value) => {
      this.showSpinner = false;
    }).catch(() => {
      this.showSpinner = false;
    })
  }

  GithubAuth() {
    this.showSpinner = true;
    this.authService.GithubAuth().then((value) => {
      this.showSpinner = false;
    }).catch(() => {
      this.showSpinner = false;
    })
  }
}
