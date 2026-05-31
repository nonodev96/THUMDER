import { DOCUMENT } from "@angular/common";
import { type AfterViewInit, Component, inject, type OnDestroy, type OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { AppComponent } from "@app/app.component";
import { AUTH_ROUTES } from "@app/CONSTANTS";
import type { PublicRoutes } from "@app/Types";
import { AuthService } from "@core/auth/auth.service";
import { MachineService } from "@core/machine/machine.service";
import { Subscription } from "rxjs";
import { AppConfig } from "../../../../environments/_environment";

@Component({
  selector: "THUMDER-auth-navbar",
  templateUrl: "./auth-navbar.component.html",
  standalone: false,
})
export class AuthNavbarComponent implements OnInit, OnDestroy, AfterViewInit {
  private _document = inject<Document>(DOCUMENT);
  private router = inject(Router);
  app = inject<AppComponent>(AppComponent);
  machine = inject(MachineService);
  authService = inject(AuthService);

  public readonly PRIVATE_AUTH_ROUTES = Object.values(AUTH_ROUTES);
  public readonly isDEV = AppConfig.environment === "DEV";

  public isRunning = false;
  public colorWebsocketStatus: string = "orange";
  public isWebsocketStatusConnect: boolean = false;
  private isRunningSubscription: Subscription = new Subscription();

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

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
    window.jQuery('[data-toggle="tooltip"]').tooltip({ trigger: "hover" });
  }

  ngOnDestroy(): void {
    this.isRunningSubscription.unsubscribe();
  }

  public async togglePlayPause(): Promise<void> {
    if (this.machine.isRunning === false) {
      await this.machine.resume();
    } else {
      await this.machine.pause();
    }
  }

  public async resetConnection(): Promise<void> {
    window.dispatchEvent(new Event("resize"));
    this.machine.resetConnection();
    return Promise.resolve();
  }

  public async reset(): Promise<void> {
    await this.machine.reset();
    return Promise.resolve();
  }

  public async nextStep(): Promise<void> {
    await this.machine.nextStep();
    return Promise.resolve();
  }

  public async end(): Promise<void> {
    await this.machine.end();
    return Promise.resolve();
  }

  public async debug(): Promise<void> {
    console.log(this.machine.getAllStatusMachine());
    return Promise.resolve();
  }

  public async goToPage(_$event: MouseEvent, menu: PublicRoutes): Promise<boolean> {
    const data = await this.router.navigateByUrl(menu.routerLink);
    return Promise.resolve(data);
  }
}
