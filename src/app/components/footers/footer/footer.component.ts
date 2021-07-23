import { Component, OnInit } from "@angular/core";
import * as npm from '../../../../../package.json'

@Component({
  selector: "app-footer",
  templateUrl: "./footer.component.html",
})
export class FooterComponent implements OnInit {
  date = new Date().getFullYear();
  version = npm.version;

  constructor() {
  }

  ngOnInit(): void {
  }
}
