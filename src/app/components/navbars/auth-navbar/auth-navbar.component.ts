import { Component, OnInit } from "@angular/core";
import { AppComponent } from "../../../app.component";

@Component({
  selector: "app-auth-navbar",
  templateUrl: "./auth-navbar.component.html",
})
export class AuthNavbarComponent implements OnInit {
  navbarOpen = false;

  constructor(private app: AppComponent) {
  }

  ngOnInit(): void {
  }

  setNavbarOpen() {
    this.navbarOpen = !this.navbarOpen;
  }

  changeToSpain() {
    this.app.change('sp');
  }

  changeToEnglish() {
    this.app.change('en');
  }
}
