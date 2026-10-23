import { DOCUMENT } from "@angular/common";
import { Component, effect, inject, type OnDestroy, type OnInit } from "@angular/core";
import { getAnalytics, isSupported, logEvent, setAnalyticsCollectionEnabled } from "@angular/fire/analytics";
import { fetchAndActivate, getBoolean, getRemoteConfig } from "@angular/fire/remote-config";
import { NavigationStart, Router, RouterOutlet } from "@angular/router";
import { DEFAULT_LANG, FIREBASE_ENABLED } from "@app/CONSTANTS";
import type { TypeLang } from "@app/Types";
import { ConsentComponent } from "@components/consent/consent.component";
import { ToastsComponent } from "@components/toasts/toasts.component";
import { AuthService } from "@core/auth/auth.service";
import { logger } from "@core/logger/logger";
import { MachineService } from "@core/machine/machine.service";
import { ElectronService } from "@core/services";
import { ConsentService } from "@core/services/consent/consent.service";
import { desktopBridge } from "@core/services/electron/electron.service";
import { SIDEBAR_STATE_CLASSES } from "@core/services/layout/sidebar.service";
import { ThemeService } from "@core/services/theme/theme.service";
import { StorageService } from "@core/storage/storage.service";
import { TranslateService } from "@ngx-translate/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
  imports: [RouterOutlet, ToastsComponent, ConsentComponent],
})
export class AppComponent implements OnInit, OnDestroy {
  private document = inject<Document>(DOCUMENT);
  auth = inject(AuthService);
  private consent = inject(ConsentService);
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

  /** Whether Analytics was started in this page (it cannot be unloaded: it is told to stop collecting) */
  private static analyticsStarted = false;

  constructor() {
    // Analytics only with the consent of the user (ConsentService), and it stops if the consent is withdrawn
    effect(() => {
      if (this.consent.analytics()) void AppComponent.startAnalytics();
      else void AppComponent.stopAnalytics();
    });

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
      const analytics = getAnalytics();
      setAnalyticsCollectionEnabled(analytics, true);
      if (!AppComponent.analyticsStarted) logEvent(analytics, "start_app_THUMDER", { status: "ok" });
      AppComponent.analyticsStarted = true;
    } catch (error) {
      logger.error(error);
    }
  }

  private static async stopAnalytics(): Promise<void> {
    if (!AppComponent.analyticsStarted) return;
    try {
      setAnalyticsCollectionEnabled(getAnalytics(), false);
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
    // The menu of the desktop application, in the same language
    desktopBridge()?.setPreferences({ lang });
  }
}
