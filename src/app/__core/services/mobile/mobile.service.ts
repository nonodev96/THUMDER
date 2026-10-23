import { afterNextRender, DOCUMENT, effect, Injectable, inject, NgZone } from "@angular/core";
import { Router } from "@angular/router";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { SystemBars, SystemBarsStyle } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { logger } from "@core/logger/logger";
import { SidebarService } from "@core/services/layout/sidebar.service";
import { ThemeService } from "@core/services/theme/theme.service";
import { ModalService } from "@shared/directives/bootstrap/modal.directive";
import { appRoute, backAction, isExternalLink, type NativePlatform, nativePlatform } from "./mobile";

/** Opens a link in the browser of the system, in a tab over THUMDER (Custom Tabs on Android, Safari on iOS) */
export async function openInBrowser(url: string): Promise<void> {
  await Browser.open({ url });
}

/**
 * The applications of Android and iOS (Capacitor). In them the html element has the classes `thumder-mobile` and
 * `thumder-android` or `thumder-ios`, and: the bars of the system follow the theme, the back button of Android closes what
 * is open before going back, the links to other sites open in the browser, the links of shared exercises open the
 * exercise, and the splash screen goes when the page has drawn itself. Nothing of this runs in the web nor in the desktop
 */
@Injectable({ providedIn: "root" })
export class MobileService {
  public readonly platform: NativePlatform | null = nativePlatform();

  private readonly document = inject(DOCUMENT);
  private readonly zone = inject(NgZone);
  private readonly router = inject(Router);
  private readonly modals = inject(ModalService);
  private readonly sidebar = inject(SidebarService);

  constructor() {
    const platform = this.platform;
    if (platform === null) return;
    this.document.documentElement.classList.add("thumder-mobile", `thumder-${platform}`);

    // The text and the icons of the bars of the system, light on the dark theme and dark on the light one
    const theme = inject(ThemeService);
    effect(() => {
      const style = theme.dark() ? SystemBarsStyle.Dark : SystemBarsStyle.Light;
      SystemBars.setStyle({ style }).catch((error: unknown) => logger.warn(error));
    });

    void App.addListener("backButton", ({ canGoBack }) => this.zone.run(() => this.back(canGoBack)));
    void App.addListener("appUrlOpen", ({ url }) =>
      this.zone.run(() => {
        const route = appRoute(url);
        if (route !== null) void this.router.navigateByUrl(route);
      }),
    );
    this.document.addEventListener("click", (event) => this.openOutside(event), true);

    afterNextRender(() => {
      SplashScreen.hide({ fadeOutDuration: 200 }).catch((error: unknown) => logger.warn(error));
    });
  }

  /** The back button of Android */
  private back(canGoBack: boolean): void {
    const document = this.document;
    const action = backAction({
      modal: this.modals.anyOpen,
      dropdown: document.querySelector(".dropdown.show") !== null,
      maximizedCard: document.querySelector(".card.maximized-card") !== null,
      sidebar: this.sidebar.isOverlay && this.sidebar.isExpanded,
      canGoBack,
    });
    switch (action) {
      case "close-modal":
        this.modals.closeLast();
        break;
      case "close-dropdown":
        // The dropdown closes itself with Escape (DropdownDirective), and gives the focus back to its button
        document.querySelector(".dropdown.show")?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        break;
      case "restore-card":
        document.querySelector<HTMLElement>('.card.maximized-card [thumdercardwidget="maximize"]')?.click();
        break;
      case "close-sidebar":
        this.sidebar.close();
        break;
      case "go-back":
        history.back();
        break;
      case "leave":
        // As the other applications of Android: THUMDER goes to the background, with its simulation as it was
        App.minimizeApp().catch((error: unknown) => logger.warn(error));
        break;
    }
  }

  /** A link to another site: in the browser of the system, never inside THUMDER */
  private openOutside(event: MouseEvent): void {
    const anchor = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (!anchor || anchor.hasAttribute("download") || !isExternalLink(anchor.href, this.document.location.origin)) return;
    event.preventDefault();
    event.stopPropagation();
    openInBrowser(anchor.href).catch((error: unknown) => logger.error(error));
  }
}
