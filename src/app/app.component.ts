import { DOCUMENT } from "@angular/common";
import { Component, inject, type OnDestroy, type OnInit } from "@angular/core";
import { getAnalytics, isSupported, logEvent } from "@angular/fire/analytics";
import { fetchAndActivate, getBoolean, getRemoteConfig } from "@angular/fire/remote-config";
import { NavigationStart, Router, RouterOutlet } from "@angular/router";
import { DEFAULT_LANG, FIREBASE_ENABLED } from "@app/CONSTANTS";
import type { TypeLang } from "@app/Types";
import { AuthService } from "@core/auth/auth.service";
import { logger } from "@core/logger/logger";
import { MachineService } from "@core/machine/machine.service";
import { ElectronService } from "@core/services";
import { SIDEBAR_STATE_CLASSES } from "@core/services/layout/sidebar.service";
import { ThemeService } from "@core/services/theme/theme.service";
import { StorageService } from "@core/storage/storage.service";
import { TranslateService } from "@ngx-translate/core";
import { NgcCookieConsentService, type NgcNoCookieLawEvent, type NgcStatusChangeEvent } from "ngx-cookieconsent";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
  imports: [RouterOutlet],
})
export class AppComponent implements OnInit, OnDestroy {
  private document = inject<Document>(DOCUMENT);
  auth = inject(AuthService);
  private ccService = inject(NgcCookieConsentService);
  private storageService = inject(StorageService);
  private machine = inject(MachineService);
  private electronService = inject(ElectronService);
  private translate = inject(TranslateService);
  private router = inject(Router);
  // The theme (light, dark or the one of the system) applies from the start
  private theme = inject(ThemeService);

  public lang: TypeLang = DEFAULT_LANG;
  public translationEnabled: boolean = false;
  private readonly destroy$ = new Subject<void>();

  constructor() {
    if (localStorage.getItem("cookieconsent") === "allow") void AppComponent.startAnalytics();

    // Inicializar idioma en el constructor para que la carga HTTP comience
    // antes de que los componentes hijos rendericen (evita flash de claves sin traducir)
    const storedLang = (this.storageService.getItem("lang") as TypeLang | null) ?? DEFAULT_LANG;
    this.lang = storedLang;
    this.translate.setFallbackLang(storedLang);
    this.translate.use(storedLang);

    this.auth
      .getIsLoggingObservable()
      .pipe(takeUntil(this.destroy$))
      .subscribe((isLogging) => {
        if (isLogging) this.storageService.defaultDataInStorage();
      });

    this.router.events.pipe(takeUntil(this.destroy$)).subscribe((route) => {
      // Each layout and page adds its classes to the body: they start again, except the state of the sidebar and the theme
      if (route instanceof NavigationStart) {
        const body = this.document.body.classList;
        body.remove(...[...body].filter((name) => !SIDEBAR_STATE_CLASSES.includes(name) && name !== "dark-mode"));
        body.add("dx-viewport", "sidebar-mini", "layout-fixed", "layout-footer-fixed", "layout-navbar-fixed");
      }
    });
  }

  ngOnInit(): void {
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

    this.ccService.statusChange$.pipe(takeUntil(this.destroy$)).subscribe(($event: NgcStatusChangeEvent) => {
      localStorage.setItem("cookieconsent", $event.status);
      if ($event.status === "allow") void AppComponent.startAnalytics();
    });

    this.ccService.revokeChoice$.pipe(takeUntil(this.destroy$)).subscribe();

    this.ccService.noCookieLaw$.pipe(takeUntil(this.destroy$)).subscribe((_$event: NgcNoCookieLawEvent) => {});

    this.updateCookiesConsentLang();

    if (!FIREBASE_ENABLED) return;
    const remoteConfig = getRemoteConfig();
    fetchAndActivate(remoteConfig)
      .then(() => {
        this.translationEnabled = getBoolean(remoteConfig, "translationEnabled");
      })
      .catch((err) => {
        this.translationEnabled = false;
        logger.error(err);
      });
  }

  // Firebase Analytics sets cookies: only with the consent of the user, and only where it works (not in file://)
  private static async startAnalytics(): Promise<void> {
    try {
      if (!FIREBASE_ENABLED || !(await isSupported())) return;
      logEvent(getAnalytics(), "start_app_THUMDER", { status: "ok" });
    } catch (error) {
      logger.error(error);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public setLang(lang: TypeLang) {
    this.storageService.setItem("lang", lang);
    this.lang = lang;
    this.document.documentElement.lang = lang;
    this.translate.setFallbackLang(lang);
    this.translate.use(lang);
    // this.updateDevExpressLocation(lang);
    this.updateCookiesConsentLang();
  }

  private updateCookiesConsentLang() {
    this.translate
      .get(["cookie.header", "cookie.message", "cookie.dismiss", "cookie.allow", "cookie.deny", "cookie.link", "cookie.policy"])
      .subscribe((data) => {
        this.ccService.getConfig().content = this.ccService.getConfig().content || {};
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
