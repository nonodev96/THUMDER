import { Component, inject, type OnInit } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { AuthService } from "@core/auth/auth.service";
import { ElectronService } from "@core/services";
import { TranslatePipe } from "@ngx-translate/core";
import { AppConfig } from "../../../../environments/_environment";

@Component({
  selector: "THUMDER-aside-left",
  templateUrl: "./aside-left.component.html",
  styleUrls: ["./aside-left.component.scss"],
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
})
export class AsideLeftComponent implements OnInit {
  authService = inject(AuthService);
  electronService = inject(ElectronService);

  public readonly isProduction = !AppConfig.production;

  ngOnInit(): void {}
}
