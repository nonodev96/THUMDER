import { AfterViewInit, Component, Inject, OnInit } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { Router } from "@angular/router";
import { AUTH_ROUTES, PUBLIC_ROUTES } from "../../CONSTANTS";
import { AppConfig } from "../../../environments/_environment";

@Component({
  selector:    "app-index",
  templateUrl: "./index.view.html"
})
export class IndexView implements OnInit, AfterViewInit {
  public readonly PRIVATE_ROUTES = PUBLIC_ROUTES;
  public readonly PRIVATE_AUTH_ROUTES = AUTH_ROUTES;
  public readonly AppConfig = AppConfig;

  constructor(@Inject(DOCUMENT) private document: Document,
              private router: Router) {
  }

  ngOnInit(): void {
    this.document.body.classList.add("dx-viewport", "sidebar-mini", "layout-fixed", "layout-footer-fixed");
  }

  ngAfterViewInit(): void {
    const trees: any = window.$("[data-widget='treeview']");
    trees.Treeview("toggleRow");
  }

  async onItemSelected($event: MouseEvent, menu: any) {
    $event.preventDefault();
    await this.router.navigateByUrl(menu.routerLink);
  }
}
