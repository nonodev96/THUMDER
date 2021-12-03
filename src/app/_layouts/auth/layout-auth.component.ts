import { AfterViewInit, Component, Inject, OnInit } from "@angular/core";
import { DOCUMENT } from "@angular/common";

@Component({
  selector: "THUMDER-auth",
  templateUrl: "./layout-auth.component.html",
})
export class LayoutAuthComponent implements OnInit, AfterViewInit {

  constructor(@Inject(DOCUMENT) private document: Document) {
  }

  ngOnInit(): void {
    this.document.body.classList.add('dx-viewport', 'sidebar-mini', 'layout-fixed', 'layout-footer-fixed');
  }

  ngAfterViewInit(): void {
    const trees: any = window.jQuery('[data-widget="treeview"]');
    trees.Treeview('toggleRow');
  }
}
