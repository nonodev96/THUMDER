import { Component, type OnInit } from "@angular/core";
import type { Router } from "@angular/router";
import { AppConfig } from "../../../../environments/_environment";
import type { AuthService } from "../../../__core/auth/auth.service";
import type { ElectronService } from "../../../__core/services";
import { PublicRoutes } from "../../../Types";

@Component({
  selector: "THUMDER-aside-left",
  templateUrl: "./aside-left.component.html",
  styleUrls: ["./aside-left.component.scss"],
  standalone: false,
})
export class AsideLeftComponent implements OnInit {
  public readonly isProduction = !AppConfig.production;

  constructor(
    public authService: AuthService,
    public electronService: ElectronService,
    private router: Router,
  ) {}

  ngOnInit(): void {}
}
