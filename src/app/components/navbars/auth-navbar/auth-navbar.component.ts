import { Component, OnInit } from "@angular/core";
import { AppComponent } from "../../../app.component";
import { AuthService } from "../../../__core/auth/auth.service";
import { MachineService } from "../../../__core/machine/machine.service";
import { timer } from "rxjs";

@Component({
  selector: "app-auth-navbar",
  templateUrl: "./auth-navbar.component.html",
})
export class AuthNavbarComponent implements OnInit {
  navbarOpen = false;

  constructor(private app: AppComponent,
              public machine: MachineService,
              public authService: AuthService
  ) {
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
}
