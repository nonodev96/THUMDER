import {Component, Inject, OnInit} from "@angular/core";
import {DOCUMENT} from "@angular/common";

@Component({
  selector: "app-landing",
  templateUrl: "./landing.component.html",
})
export class LandingComponent implements OnInit {
  constructor(@Inject(DOCUMENT) private document: Document) {
  }

  ngOnInit(): void {
  }
}
