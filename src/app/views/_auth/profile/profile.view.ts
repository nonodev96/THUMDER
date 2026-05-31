import { DOCUMENT } from "@angular/common";
import { Component, inject, type OnInit } from "@angular/core";
import { AuthService } from "@core/auth/auth.service";

@Component({
  selector: "view-profile",
  templateUrl: "./profile.view.html",
  styleUrls: [],
  standalone: false,
})
export class ProfileView implements OnInit {
  private _document = inject<Document>(DOCUMENT);
  authService = inject(AuthService);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  ngOnInit(): void {}

  public log(msg: string): void {
    console.debug(msg);
  }
}
