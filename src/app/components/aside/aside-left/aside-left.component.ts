import { Component, OnInit } from '@angular/core';
import { AUTH_ROUTES } from "../../../CONSTAST";
import { PublicRoutes } from "../../../types";
import { Router } from "@angular/router";

@Component({
  selector: 'app-aside-left',
  templateUrl: './aside-left.component.html',
  styleUrls: ['./aside-left.component.scss']
})
export class AsideLeftComponent implements OnInit {

  AUTH_ROUTES_ASIDE = AUTH_ROUTES;

  constructor(private router: Router) {
  }

  ngOnInit(): void {
  }

  goToPage($event: MouseEvent, menu: PublicRoutes) {
    this.router.navigateByUrl(menu.routerLink)
      .then(() => {
        // console.log(value)
      })
  }
}
