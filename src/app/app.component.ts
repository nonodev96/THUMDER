import { DOCUMENT } from "@angular/common";
import { Component, Inject, type OnDestroy, type OnInit } from "@angular/core";
import { NavigationEnd, NavigationStart, Router } from "@angular/router";
import { TranslateService } from "@ngx-translate/core";
import { NgcCookieConsentService, type NgcNoCookieLawEvent, type NgcStatusChangeEvent } from "ngx-cookieconsent";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { AuthService } from "@core/auth/auth.service";
import { MachineService } from "@core/machine/machine.service";
import { ElectronService } from "@core/services";
import { StorageService } from "@core/storage/storage.service";
import { DEFAULT_LANG } from "@app/CONSTANTS";
import type { TypeLang } from "@app/Types";

declare const AppAdminLTE: {
  initMainPage(): void;
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
  public lang: TypeLang = DEFAULT_LANG;
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

    // Inicializar idioma en el constructor para que la carga HTTP comience
    // antes de que los componentes hijos rendericen (evita flash de claves sin traducir)
    const storedLang = (this.storageService.getItem("lang") as TypeLang | null) ?? DEFAULT_LANG;
    this.lang = storedLang;
    this.translate.setDefaultLang(storedLang);
    this.translate.use(storedLang);

    this.auth
      .getIsLoggingObservable()
      .pipe(takeUntil(this.destroy$))
      .subscribe((isLogging) => {
        if (isLogging) this.storageService.defaultDataInStorage();
      });

    this.router.events.pipe(takeUntil(this.destroy$)).subscribe((route) => {
      if (route instanceof NavigationStart) {
        this.document.body.className = "";
        this.document.body.classList.add(
          "dx-viewport",
          "sidebar-mini",
          "layout-fixed",
          "layout-footer-fixed",
          "layout-navbar-fixed",
        );
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
    this.lang = this.storageService.getItem("lang") ?? DEFAULT_LANG;
    this.setLang(this.lang);

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

    this.ccService.statusChange$
      .pipe(takeUntil(this.destroy$))
      .subscribe(($event: NgcStatusChangeEvent) => {
        localStorage.setItem("cookieconsent", $event.status);
      });

    this.ccService.revokeChoice$.pipe(takeUntil(this.destroy$)).subscribe();

    this.ccService.noCookieLaw$
      .pipe(takeUntil(this.destroy$))
      .subscribe((_$event: NgcNoCookieLawEvent) => {});

    this.updateCookiesConsentLang();

    const remoteConfig = getRemoteConfig();
    fetchAndActivate(remoteConfig)
      .then(() => {
        this.translationEnabled = getBoolean(
          remoteConfig,
          "translationEnabled",
        );
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
    this.document.documentElement.lang = lang;
    this.translate.setDefaultLang(lang);
    this.translate.use(lang);
    // this.updateDevExpressLocation(lang);
    this.updateCookiesConsentLang();
  }

  private updateCookiesConsentLang() {
    this.translate
      .get([
        "cookie.header",
        "cookie.message",
        "cookie.dismiss",
        "cookie.allow",
        "cookie.deny",
        "cookie.link",
        "cookie.policy",
      ])
      .subscribe((data) => {
        this.ccService.getConfig().content =
          this.ccService.getConfig().content || {};
        // Override default messages with the translated ones
        this.ccService.getConfig().content!.header = data["cookie.header"];
        this.ccService.getConfig().content!.message = data["cookie.message"];
        this.ccService.getConfig().content!.dismiss = data["cookie.dismiss"];
        this.ccService.getConfig().content!.allow = data["cookie.allow"];
        this.ccService.getConfig().content!.deny = data["cookie.deny"];
        this.ccService.getConfig().content!.link = data["cookie.link"];
        this.ccService.getConfig().content!.policy = data["cookie.policy"];

        this.ccService.destroy();
        this.ccService.init(this.ccService.getConfig());
      });
  }
}
