import { DOCUMENT } from "@angular/common";
import { Component, Inject, type OnInit } from "@angular/core";
import type { AuthService } from "../../../__core/auth/auth.service";

@Component({
  selector: "view-profile",
  templateUrl: "./profile.view.html",
  styleUrls: [],
  standalone: false,
})
export class ProfileView implements OnInit {
  constructor(
    @Inject(DOCUMENT) private _document: Document,
    public authService: AuthService,
  ) {}

  ngOnInit(): void {}

  public log(msg: string): void {
    console.debug(msg);
  }
}
