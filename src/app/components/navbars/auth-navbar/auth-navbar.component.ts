import { DOCUMENT } from "@angular/common";
import { Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { AppComponent } from "../../../app.component";
import { AuthService } from "../../../__core/auth/auth.service";
import { MachineService } from "../../../__core/machine/machine.service";
import { PublicRoutes } from "../../../types";
import { AUTH_ROUTES } from "../../../CONSTAST";
import { Subscription } from "rxjs";

@Component({
  selector: "app-auth-navbar",
  templateUrl: "./auth-navbar.component.html",
})
export class AuthNavbarComponent implements OnInit, OnDestroy {
  public navbarOpen = false;
  public isRunning = false;
  public readonly AUTH_ROUTES = AUTH_ROUTES;
  private isRunningSubscription: Subscription = new Subscription();
  public colorWebsocketStatus: string = "orange";

  constructor(@Inject(DOCUMENT) private document: Document,
              private router: Router,
              public app: AppComponent,
              public machine: MachineService,
              public authService: AuthService) {
  }

  ngOnInit(): void {
    this.isRunningSubscription = this.machine.getIsRunningObservable().subscribe((isRunning) => {
      this.isRunning = isRunning;
    });
    this.colorWebsocketStatus = this.machine.getStatusWebsocket() === "Connect" ? "lime" : "orange";
    this.machine.getStatusWebsocketObservable().subscribe((status) => {
      if (status === "Connect") {
        this.colorWebsocketStatus = "lime";
      }
      if (status === "Disconnect") {
        this.colorWebsocketStatus = "orange";
      }
    });
  }

  ngOnDestroy(): void {
    this.isRunningSubscription.unsubscribe();
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
    await this.machine.SimulationNextStep();
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
