import { Component, inject, type OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "@core/auth/auth.service";
import { ElectronService } from "@core/services";
import { AppConfig } from "../../../../environments/_environment";

@Component({
  selector: "THUMDER-aside-left",
  templateUrl: "./aside-left.component.html",
  styleUrls: ["./aside-left.component.scss"],
  standalone: false,
})
export class AsideLeftComponent implements OnInit {
  authService = inject(AuthService);
  electronService = inject(ElectronService);

  public readonly isProduction = !AppConfig.production;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  ngOnInit(): void {}
}
