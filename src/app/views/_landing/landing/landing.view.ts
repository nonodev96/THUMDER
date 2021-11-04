import { Component, Inject, OnInit } from "@angular/core";
import { DOCUMENT } from "@angular/common";

@Component({
  selector: "app-landing",
  templateUrl: "./landing.view.html",
})
export class LandingView implements OnInit {
  constructor(@Inject(DOCUMENT)
              private document: Document) {
  }

  ngOnInit(): void {
  }
}
