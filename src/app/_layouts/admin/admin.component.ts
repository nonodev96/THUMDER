import {Component, Inject, OnInit} from "@angular/core";
import {DOCUMENT} from "@angular/common";

@Component({
  selector: "app-admin",
  templateUrl: "./admin.component.html",
})
export class AdminComponent implements OnInit {
  constructor(@Inject(DOCUMENT) private document: Document) {
  }

  ngOnInit(): void {
    this.document.body.className = "dx-viewport";
  }
}
