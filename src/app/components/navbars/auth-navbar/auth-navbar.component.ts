import { Component, OnInit } from "@angular/core";
import { AppComponent } from "../../../app.component";
import { AuthService } from "../../../__core/auth/auth.service";
import { MachineService } from "../../../__core/machine/machine.service";
import { AUTH_ROUTES } from "../../../CONSTAST";
import { Router } from "@angular/router";
import { PublicRoutes } from "../../../types";

@Component({
  selector: "app-auth-navbar",
  templateUrl: "./auth-navbar.component.html",
})
export class AuthNavbarComponent implements OnInit {
  navbarOpen = false;
  AUTH_ROUTES = AUTH_ROUTES;

  constructor(private router: Router,
              public app: AppComponent,
              public machine: MachineService,
              public authService: AuthService) {
  }

  ngOnInit(): void {
  }

  setNavbarOpen() {
    this.navbarOpen = !this.navbarOpen;
  }

  async togglePlayPause() {
    if (this.machine.isRunning === false) {
      await this.machine.resume()
    } else {
      await this.machine.pause()
    }
  }

  async reset() {
    await this.machine.reset()
  }

  async play() {
    await this.machine.play()
  }

  async next() {
    await this.machine.next()
  }

  async end() {
    await this.machine.end()
  }

  goToPage($event: MouseEvent, menu: PublicRoutes) {
    this.router.navigateByUrl(menu.routerLink)
      .then(() => {
        // console.log(value)
      })
  }
}
