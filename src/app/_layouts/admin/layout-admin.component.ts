import { Component, Inject, AfterViewInit } from "@angular/core";
import { DOCUMENT } from "@angular/common";

@Component({
  selector:    "THUMDER-layout-admin",
  templateUrl: "./layout-admin.component.html",
})
export class LayoutAdminComponent implements AfterViewInit {

  constructor(@Inject(DOCUMENT)
              private document: Document) {
  }

  ngAfterViewInit(): void {
    this.document.body.classList.add("dx-viewport", "sidebar-mini", "layout-fixed", "layout-footer-fixed", "layout-navbar-fixed");
  }
}
