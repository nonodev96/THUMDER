import { DOCUMENT } from "@angular/common";
import { Component, inject, type OnInit } from "@angular/core";

@Component({
  selector: "app-landing",
  templateUrl: "./landing.view.html",
  standalone: false,
})
export class LandingView implements OnInit {
  private _document = inject<Document>(DOCUMENT);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  ngOnInit(): void {}
}
