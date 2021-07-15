import { Component, Inject, OnInit } from "@angular/core";
import { DOCUMENT } from "@angular/common";

@Component({
  selector: "app-forgot-password",
  templateUrl: "./forgot-password.component.html",
})
export class ForgotPasswordComponent implements OnInit {
  constructor(@Inject(DOCUMENT) private document: Document) {
  }

  ngOnInit(): void {
    this.document.body.className = "dx-viewport";
    this.document.body.classList.add('login-page')
  }
}
