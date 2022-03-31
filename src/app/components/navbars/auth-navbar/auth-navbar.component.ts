import { DOCUMENT } from "@angular/common";
import { AfterViewInit, Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Subscription } from "rxjs";
import { AppComponent } from "../../../app.component";
import { AuthService } from "../../../__core/auth/auth.service";
import { MachineService } from "../../../__core/machine/machine.service";
import { PublicRoutes } from "../../../Types";
import { AUTH_ROUTES } from "../../../CONSTANTS";
import { AppConfig } from "../../../../environments/_environment";

@Component({
  selector:    "app-auth-navbar",
  templateUrl: "./auth-navbar.component.html"
})
export class AuthNavbarComponent implements OnInit, OnDestroy, AfterViewInit {
  public readonly PRIVATE_AUTH_ROUTES = Object.values(AUTH_ROUTES);
  public readonly isDEV = AppConfig.environment === "DEV";
  public navbarOpen = false;
  public isRunning = false;
  public colorWebsocketStatus: string = "orange";
  public isWebsocketStatusConnect: boolean = false;
  private isRunningSubscription: Subscription = new Subscription();

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
        this.isWebsocketStatusConnect = true;
      }
      if (status === "Disconnect") {
        this.isWebsocketStatusConnect = false;
      }
    });
  }

  ngAfterViewInit(): void {
    window.jQuery("[data-toggle=\"tooltip\"]").tooltip({ trigger: "hover" });
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

  async resetConnection(): Promise<void> {
    window.dispatchEvent(new Event("resize"));
    this.machine.resetConnection();
    return Promise.resolve();
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
