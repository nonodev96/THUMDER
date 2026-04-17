import { DOCUMENT } from "@angular/common";
import { Component, Inject, type OnDestroy, type OnInit } from "@angular/core";
import { NavigationEnd, NavigationStart, type Router } from "@angular/router";
import type { TranslateService } from "@ngx-translate/core";
import type { NgcCookieConsentService, NgcNoCookieLawEvent, NgcStatusChangeEvent } from "ngx-cookieconsent";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import type { AuthService } from "./__core/auth/auth.service";
import type { MachineService } from "./__core/machine/machine.service";
import type { ElectronService } from "./__core/services";
import type { StorageService } from "./__core/storage/storage.service";
import { DEFAULT_LANG } from "./CONSTANTS";
import type { TypeLang } from "./Types";

declare const AppAdminLTE: {
  initMainPage();
};

import { getAnalytics, logEvent } from "@angular/fire/analytics";
import { fetchAndActivate, getBoolean, getRemoteConfig } from "@angular/fire/remote-config";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
  standalone: false,
})
export class AppComponent implements OnInit, OnDestroy {
  public lang: string = DEFAULT_LANG;
  public translationEnabled: boolean = false;
  private readonly destroy$ = new Subject<void>();

  constructor(
    @Inject(DOCUMENT) private document: Document,
    public auth: AuthService,
    private ccService: NgcCookieConsentService,
    private storageService: StorageService,
    private machine: MachineService,
    private electronService: ElectronService,
    private translate: TranslateService,
    private router: Router,
  ) {
    logEvent(getAnalytics(), "start_app_THUMDER", { status: "ok" });

    this.auth
      .getIsLoggingObservable()
      .pipe(takeUntil(this.destroy$))
      .subscribe((isLogging) => {
        if (isLogging) this.storageService.defaultDataInStorage();
      });

    this.router.events.pipe(takeUntil(this.destroy$)).subscribe((route) => {
      if (route instanceof NavigationStart) {
        this.document.body.className = "";
        this.document.body.classList.add("dx-viewport", "sidebar-mini", "layout-fixed", "layout-footer-fixed", "layout-navbar-fixed");
      }
      if (route instanceof NavigationEnd) {
        window.jQuery("body").Layout();
        const cards: any = window.jQuery(".card");
        cards.on("expanded.lte.cardwidget", () => {});
      }
    });
  }

  ngOnInit(): void {
    AppAdminLTE.initMainPage();
    this.lang = this.storageService.getItem("lang");
    this.document.documentElement.lang = this.lang;
    this.translate.addLangs(["en", "sp"]);
    this.translate.setDefaultLang(this.lang);

    this.ccService.popupOpen$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      const link = document.getElementById("cookieconsent:link");
      if (link) {
        link.addEventListener("click", async () => {
          await this.router.navigateByUrl("/landing/about");
          await new Promise((resolve) => setTimeout(resolve, 750));
          document.getElementById("collapse-header-cookies")?.click();
        });
      }
    });

    this.ccService.popupClose$.pipe(takeUntil(this.destroy$)).subscribe();
    this.ccService.initialized$.pipe(takeUntil(this.destroy$)).subscribe();

    this.ccService.statusChange$.pipe(takeUntil(this.destroy$)).subscribe(($event: NgcStatusChangeEvent) => {
      localStorage.setItem("cookieconsent", $event.status);
    });

    this.ccService.revokeChoice$.pipe(takeUntil(this.destroy$)).subscribe();

    this.ccService.noCookieLaw$.pipe(takeUntil(this.destroy$)).subscribe((_$event: NgcNoCookieLawEvent) => {});

    this.updateCookiesConsentLang();

    const remoteConfig = getRemoteConfig();
    fetchAndActivate(remoteConfig)
      .then(() => {
        this.translationEnabled = getBoolean(remoteConfig, "translationEnabled");
      })
      .catch((err) => {
        this.translationEnabled = false;
        console.error(err);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public setLang(lang: TypeLang) {
    this.storageService.setItem("lang", lang);
    this.lang = lang;
    this.translate.setDefaultLang(lang);
    // this.updateDevExpressLocation(lang);
    this.updateCookiesConsentLang();
  }

  private updateCookiesConsentLang() {
    this.translate
      .get(["cookie.header", "cookie.message", "cookie.dismiss", "cookie.allow", "cookie.deny", "cookie.link", "cookie.policy"])
      .subscribe((data) => {
        this.ccService.getConfig().content = this.ccService.getConfig().content || {};
        // Override default messages with the translated ones
        this.ccService.getConfig().content.header = data["cookie.header"];
        this.ccService.getConfig().content.message = data["cookie.message"];
        this.ccService.getConfig().content.dismiss = data["cookie.dismiss"];
        this.ccService.getConfig().content.allow = data["cookie.allow"];
        this.ccService.getConfig().content.deny = data["cookie.deny"];
        this.ccService.getConfig().content.link = data["cookie.link"];
        this.ccService.getConfig().content.policy = data["cookie.policy"];

        this.ccService.destroy();
        this.ccService.init(this.ccService.getConfig());
      });
  }
}
