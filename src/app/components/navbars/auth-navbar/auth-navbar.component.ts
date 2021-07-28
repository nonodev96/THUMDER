import { Component, OnInit } from "@angular/core";
import { AppComponent } from "../../../app.component";
import { AuthService } from "../../../__core/auth/auth.service";

@Component({
  selector: "app-auth-navbar",
  templateUrl: "./auth-navbar.component.html",
})
export class AuthNavbarComponent implements OnInit {
  navbarOpen = false;

  constructor(private app: AppComponent, public authService: AuthService) {
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
