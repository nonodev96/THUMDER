import { DOCUMENT } from "@angular/common";
import { Component, inject, type OnInit } from "@angular/core";

@Component({
  selector: "app-landing",
  templateUrl: "./landing.view.html",
})
export class LandingView implements OnInit {
  private _document = inject<Document>(DOCUMENT);

  ngOnInit(): void {}
}
