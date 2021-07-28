import { Component, Inject, OnInit } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { AuthService } from "../../__core/auth/auth.service";

@Component({
  selector: "app-forgot-password",
  templateUrl: "./forgot-password.component.html",
})
export class ForgotPasswordComponent implements OnInit {

  constructor(@Inject(DOCUMENT) private document: Document,
              public authService: AuthService) {
  }

  ngOnInit(): void {
    this.document.body.classList.add('login-page')
  }
}
