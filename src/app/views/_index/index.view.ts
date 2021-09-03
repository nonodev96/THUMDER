import { Component, Inject, OnInit } from "@angular/core";
import { DOCUMENT } from "@angular/common";

@Component({
  selector: "app-index",
  templateUrl: "./index.view.html",
})
export class IndexView implements OnInit {

  constructor(@Inject(DOCUMENT) private document: Document) {
  }

  ngOnInit(): void {
    this.document.body.className = "dx-viewport";
    this.document.body.classList.add('hold-transition', 'sidebar-mini', 'layout-fixed', 'layout-navbar-fixed', 'layout-footer-fixed');
  }
}
