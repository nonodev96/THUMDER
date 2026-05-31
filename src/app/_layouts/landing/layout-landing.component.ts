import { DOCUMENT } from "@angular/common";
import { type AfterViewInit, Component, inject, type OnInit } from "@angular/core";

@Component({
  selector: "THUMDER-layout-landing",
  templateUrl: "./layout-landing.component.html",
  standalone: false,
})
export class LayoutLandingComponent implements OnInit, AfterViewInit {
  private _document = inject<Document>(DOCUMENT);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  ngOnInit(): void {
    this._document.body.classList.add("dx-viewport", "sidebar-mini", "layout-fixed", "layout-footer-fixed", "layout-navbar-fixed");
  }

  ngAfterViewInit(): void {
    window.jQuery('[data-widget="pushmenu"]').PushMenu("collapse");
  }
}
