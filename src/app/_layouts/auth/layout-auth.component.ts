import { AfterViewInit, Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { Globals } from "../../__core/globals.service";

@Component({
  selector:    "THUMDER-auth",
  templateUrl: "./layout-auth.component.html"
})
export class LayoutAuthComponent implements OnInit, AfterViewInit, OnDestroy {


  constructor(@Inject(DOCUMENT) private document: Document,
              public globals: Globals) {
  }

  ngOnInit(): void {
    this.document.body.classList.add("dx-viewport", "sidebar-mini", "layout-fixed", "layout-footer-fixed");
  }

  ngAfterViewInit(): void {
    const trees: any = window.jQuery("[data-widget=\"treeview\"]");
    trees.Treeview("toggleRow");
  }

  ngOnDestroy(): void {
  }
}
