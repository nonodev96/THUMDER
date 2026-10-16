import { DOCUMENT, NgTemplateOutlet } from "@angular/common";
import { Component, inject, type OnInit } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { AUTH_ROUTES } from "@app/CONSTANTS";
import { TranslatePipe } from "@ngx-translate/core";
import { AppConfig } from "../../../environments/_environment";

@Component({
  selector: "app-index",
  templateUrl: "./index.view.html",
  imports: [RouterLink, NgTemplateOutlet, TranslatePipe],
})
export class IndexView implements OnInit {
  private _document = inject<Document>(DOCUMENT);
  private router = inject(Router);

  public readonly PRIVATE_AUTH_ROUTES = AUTH_ROUTES;
  public readonly AppConfig = AppConfig;

  ngOnInit(): void {
    this._document.body.classList.add("dx-viewport", "sidebar-mini", "layout-fixed", "layout-footer-fixed", "layout-navbar-fixed");
  }
}
