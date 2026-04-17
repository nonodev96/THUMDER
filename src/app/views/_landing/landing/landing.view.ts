import { DOCUMENT } from "@angular/common";
import { Component, Inject, type OnInit } from "@angular/core";

@Component({
  selector: "app-landing",
  templateUrl: "./landing.view.html",
  standalone: false,
})
export class LandingView implements OnInit {
  constructor(@Inject(DOCUMENT)
              private document: Document) {
  }

  ngOnInit(): void {}
}
