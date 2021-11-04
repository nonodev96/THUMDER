import { Component, Inject, OnInit } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { Router } from "@angular/router";
import { PUBLIC_ROUTES } from "../../CONSTAST";

@Component({
  selector: "app-index",
  templateUrl: "./index.view.html",
})
export class IndexView implements OnInit {
  PRIVATE_ROUTES = PUBLIC_ROUTES;

  constructor(@Inject(DOCUMENT)
              private document: Document,
              private router: Router) {
  }

  ngOnInit(): void {
    this.document.body.classList.add('dx-viewport', 'sidebar-mini', 'layout-fixed', 'layout-footer-fixed');
  }

  onItemSelected($event: MouseEvent, menu: any) {
    $event.preventDefault();
    this.router.navigateByUrl(menu.routerLink)
      .then(() => {
        // console.log(value)
      })
  }
}
