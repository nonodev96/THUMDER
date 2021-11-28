import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { AUTH_ROUTES } from "../../../CONSTAST";
import { PublicRoutes } from "../../../types";
import { AuthService } from "../../../__core/auth/auth.service";

@Component({
  selector: 'app-aside-left',
  templateUrl: './aside-left.component.html',
  styleUrls: ['./aside-left.component.scss']
})
export class AsideLeftComponent implements OnInit {

  public readonly AUTH_ROUTES_ASIDE = AUTH_ROUTES;

  constructor(public authService: AuthService,
              private router: Router) {
  }

  ngOnInit(): void {
  }

  async goToPage($event: MouseEvent, menu: PublicRoutes): Promise<boolean> {
    const data = this.router.navigateByUrl(menu.routerLink);
    return Promise.resolve(data);
  }
}
