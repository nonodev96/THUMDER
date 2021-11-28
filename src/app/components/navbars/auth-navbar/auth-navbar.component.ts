import { DOCUMENT } from "@angular/common";
import { Component, Inject, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { AppComponent } from "../../../app.component";
import { AuthService } from "../../../__core/auth/auth.service";
import { MachineService } from "../../../__core/machine/machine.service";
import { PublicRoutes } from "../../../types";
import { AUTH_ROUTES } from "../../../CONSTAST";

@Component({
  selector: "app-auth-navbar",
  templateUrl: "./auth-navbar.component.html",
})
export class AuthNavbarComponent implements OnInit {
  navbarOpen = false;
  isRunning = false;
  AUTH_ROUTES = AUTH_ROUTES;

  constructor(@Inject(DOCUMENT) private document: Document,
              private router: Router,
              public app: AppComponent,
              public machine: MachineService,
              public authService: AuthService) {
  }

  ngOnInit(): void {
    this.machine.getIsRunningObservable().subscribe((isRunning) => {
      this.isRunning = isRunning;
    });
  }

  setNavbarOpen(): void {
    this.navbarOpen = !this.navbarOpen;
  }

  async togglePlayPause(): Promise<void> {
    if (this.machine.isRunning === false) {
      await this.machine.resume();
    } else {
      await this.machine.pause();
    }
  }

  async reset(): Promise<void> {
    await this.machine.reset();
    return Promise.resolve();
  }

  async play(): Promise<void> {
    await this.machine.play();
    return Promise.resolve();
  }

  async nextStep(): Promise<void> {
    await this.machine.nextStep();
    return Promise.resolve();
  }

  async end(): Promise<void> {
    await this.machine.end();
    return Promise.resolve();
  }

  async debug(): Promise<void> {
    console.log(this.machine.getAllStatusMachine());
    return Promise.resolve();
  }

  async goToPage($event: MouseEvent, menu: PublicRoutes): Promise<boolean> {
    const data = await this.router.navigateByUrl(menu.routerLink);
    return Promise.resolve(data);
  }

  toggleCollapsed(): void {

  }
}
