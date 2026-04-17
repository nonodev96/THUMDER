import { DOCUMENT } from "@angular/common";
import { type AfterViewInit, Component, Inject, type OnInit } from "@angular/core";
import type { Router } from "@angular/router";
import { AppConfig } from "../../../environments/_environment";
import { AUTH_ROUTES } from "../../CONSTANTS";

@Component({
  selector: "app-index",
  templateUrl: "./index.view.html",
  standalone: false,
})
export class IndexView implements OnInit, AfterViewInit {
  public readonly PRIVATE_AUTH_ROUTES = AUTH_ROUTES;
  public readonly AppConfig = AppConfig;

  constructor(
    @Inject(DOCUMENT) private _document: Document,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.document.body.classList.add("dx-viewport", "sidebar-mini", "layout-fixed", "layout-footer-fixed", "layout-navbar-fixed");
  }

  ngAfterViewInit(): void {
    const trees: any = window.$("[data-widget='treeview']");
    trees.Treeview("toggleRow");
  }
}
