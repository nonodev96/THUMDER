import {Component, Inject, OnInit} from "@angular/core";
import {DOCUMENT} from "@angular/common";

@Component({
  selector: "app-admin",
  templateUrl: "./layout-admin.component.html",
})
export class LayoutAdminComponent implements OnInit {
  constructor(@Inject(DOCUMENT) private document: Document) {
  }

  ngOnInit(): void {
    this.document.body.className = "dx-viewport";
  }
}
