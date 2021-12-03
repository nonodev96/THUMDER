import { Component, Inject, OnInit } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { AuthService } from "../../__core/auth/auth.service";

@Component({
  selector: "app-forgot-password",
  templateUrl: "./forgot-password.view.html",
})
export class ForgotPasswordView implements OnInit {

  constructor(@Inject(DOCUMENT) private document: Document,
              public authService: AuthService) {
  }

  ngOnInit(): void {
  }
}
