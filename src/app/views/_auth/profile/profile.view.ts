import { Component, Inject, OnInit } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { AuthService } from "../../../__core/auth/auth.service";

@Component({
  selector:    "view-profile",
  templateUrl: "./profile.view.html",
  styleUrls:   []
})
export class ProfileView implements OnInit {
  constructor(@Inject(DOCUMENT) private document: Document,
              public authService: AuthService) {
  }

  ngOnInit(): void {
  }

  public log(msg: string): void {
    console.log(msg);
  }
}
