import { Component, type OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { AppConfig } from "../../../../environments/_environment";
import { AuthService } from "@core/auth/auth.service";
import { ElectronService } from "@core/services";

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
    _router: Router,
  ) {}

  ngOnInit(): void {}
}
