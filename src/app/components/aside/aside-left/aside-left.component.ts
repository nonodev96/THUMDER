import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { PublicRoutes } from "../../../Types";
import { AuthService } from "../../../__core/auth/auth.service";
import { AppConfig } from "../../../../environments/_environment";
import { ElectronService } from "../../../__core/services";

@Component({
  selector:    "app-aside-left",
  templateUrl: "./aside-left.component.html",
  styleUrls:   [ "./aside-left.component.scss" ]
})
export class AsideLeftComponent implements OnInit {

  public readonly isProduction = !AppConfig.production;

  constructor(public authService: AuthService,
              public electronService: ElectronService,
              private router: Router) {
  }

  ngOnInit(): void {
  }

  public async goToPage($event: MouseEvent, menu: PublicRoutes): Promise<boolean> {
    const data = this.router.navigateByUrl(menu.routerLink);
    return Promise.resolve(data);
  }
}
