import { Component, Inject, AfterViewInit } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { Globals } from "../../__core/services/globals/globals.service";

@Component({
  selector:    "THUMDER-layout-auth",
  templateUrl: "./layout-auth.component.html"
})
export class LayoutAuthComponent implements AfterViewInit {

  constructor(@Inject(DOCUMENT)
              private document: Document,
              public globals: Globals) {
  }

  ngAfterViewInit(): void {
    this.document.body.classList.add("dx-viewport", "sidebar-mini", "layout-fixed", "layout-footer-fixed", "layout-navbar-fixed");
    const trees: any = window.jQuery("[data-widget=\"treeview\"]");
    trees.Treeview("toggleRow");
  }

}
