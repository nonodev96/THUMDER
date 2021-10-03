import { Component, Inject, OnInit } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { AuthService } from "../../../__core/auth/auth.service";

@Component({
  selector: "app-profile",
  templateUrl: "./profile.view.html",
})
export class ProfileView implements OnInit {
  constructor(@Inject(DOCUMENT)
              private document: Document,
              public authService: AuthService) {
  }

  ngOnInit(): void {
  }

  log(msg: string) {
    console.log(msg);
  }
}
