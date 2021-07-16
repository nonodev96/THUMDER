import {Component, Inject, OnInit} from "@angular/core";
import {DOCUMENT} from "@angular/common";

@Component({
  selector: "app-auth",
  templateUrl: "./auth.component.html",
})
export class AuthComponent implements OnInit {
  constructor(@Inject(DOCUMENT) private document: Document) {
  }

  ngOnInit(): void {
    this.document.body.className = "dx-viewport";
  }
}
