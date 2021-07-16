import {Component, Inject, OnInit} from "@angular/core";
import {DOCUMENT} from "@angular/common";

@Component({
  selector: "app-profile",
  templateUrl: "./profile.component.html",
})
export class ProfileComponent implements OnInit {
  constructor(@Inject(DOCUMENT) private document: Document) {
  }

  ngOnInit(): void {
  }
}
