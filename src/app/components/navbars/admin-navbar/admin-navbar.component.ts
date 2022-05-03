import { Component, OnInit } from "@angular/core";

@Component({
  selector:    "THUMDER-admin-navbar",
  templateUrl: "./admin-navbar.component.html",
})
export class AdminNavbarComponent implements OnInit {
  constructor() {
  }

  ngOnInit(): void {
  }

  log(msg: string): void {
    console.log(msg);
  }
}
