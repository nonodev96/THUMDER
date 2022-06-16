import { AfterViewInit, Component, Inject, OnInit } from "@angular/core";
import { DOCUMENT } from "@angular/common";

@Component({
  selector:    "THUMDER-layout-landing",
  templateUrl: "./layout-landing.component.html"
})
export class LayoutLandingComponent implements OnInit, AfterViewInit {

  constructor(@Inject(DOCUMENT) private document: Document) {
  }

  ngOnInit(): void {
    this.document.body.classList.add("dx-viewport", "sidebar-mini", "layout-fixed", "layout-footer-fixed", "layout-navbar-fixed");
  }

  ngAfterViewInit(): void {
    window.jQuery("[data-widget=\"pushmenu\"]").PushMenu("collapse");
  }
}
