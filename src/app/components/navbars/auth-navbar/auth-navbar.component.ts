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
              private app: AppComponent,
              public machine: MachineService,
              public authService: AuthService) {
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

  async togglePlayPause() {
    if (this.machine.playB === false) {
      const end = await this.machine.play()
    } else {
      const pause = await this.machine.pause()
    }
  }


  async next() {
    const next = await this.machine.next()
  }

  async end() {
    const end = await this.machine.end()
  }

  goToPage($event: MouseEvent, menu: PublicRoutes) {
    this.router.navigateByUrl(menu.routerLink).then(value => {
      // console.log(value)
    })
  }
}
