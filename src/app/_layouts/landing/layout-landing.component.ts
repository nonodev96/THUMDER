import { DOCUMENT } from "@angular/common";
import { type AfterViewInit, Component, Inject, type OnInit } from "@angular/core";

@Component({
  selector: "THUMDER-layout-landing",
  templateUrl: "./layout-landing.component.html",
  standalone: false,
})
export class LayoutLandingComponent implements OnInit, AfterViewInit {
  constructor(@Inject(DOCUMENT) private _document: Document) {}

  ngOnInit(): void {
    this.document.body.classList.add("dx-viewport", "sidebar-mini", "layout-fixed", "layout-footer-fixed", "layout-navbar-fixed");
  }

  ngAfterViewInit(): void {
    window.jQuery('[data-widget="pushmenu"]').PushMenu("collapse");
  }
}
