import { DOCUMENT } from "@angular/common";
import { type AfterViewInit, Component, inject, type OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { AUTH_ROUTES } from "@app/CONSTANTS";
import { AppConfig } from "../../../environments/_environment";

@Component({
  selector: "app-index",
  templateUrl: "./index.view.html",
  standalone: false,
})
export class IndexView implements OnInit, AfterViewInit {
  private _document = inject<Document>(DOCUMENT);
  private router = inject(Router);

  public readonly PRIVATE_AUTH_ROUTES = AUTH_ROUTES;
  public readonly AppConfig = AppConfig;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  ngOnInit(): void {
    this._document.body.classList.add("dx-viewport", "sidebar-mini", "layout-fixed", "layout-footer-fixed", "layout-navbar-fixed");
  }

  ngAfterViewInit(): void {
    const trees: any = window.$("[data-widget='treeview']");
    trees.Treeview("toggleRow");
  }
}
