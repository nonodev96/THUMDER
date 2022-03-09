import { AfterViewInit, Component, Inject, OnInit } from "@angular/core";
import { DOCUMENT } from "@angular/common";

@Component({
  selector:    "app-admin",
  templateUrl: "./layout-admin.component.html",
})
export class LayoutAdminComponent implements OnInit, AfterViewInit {

  constructor(@Inject(DOCUMENT)
              private document: Document) {
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.document.body.classList.add("dx-viewport", "sidebar-mini", "layout-fixed", "layout-footer-fixed", "layout-navbar-fixed");
  }
}
