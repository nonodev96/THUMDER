import { DOCUMENT, Injectable, inject, NgZone } from "@angular/core";
import { Router } from "@angular/router";
import { nativePlatform } from "@core/services/mobile/mobile";
import type { ThumderBridge } from "@desktop/contract";

// What the preload script of the desktop application exposes (src-electron/shared/contract.ts): the page has no access
// to Node.js
export type { ThumderBridge } from "@desktop/contract";

/** The bridge of the desktop application, or undefined in the web */
export function desktopBridge(): ThumderBridge | undefined {
  return (globalThis as typeof globalThis & { thumder?: ThumderBridge }).thumder;
}

/**
 * The desktop application (Electron). In it the html element has the class `thumder-desktop` and, where the navbar is
 * the title bar of the window, `thumder-titlebar` (src/styles.scss leaves room for the buttons of the window and puts
 * the cards that fill the window under the navbar); the routes chosen in the menu of the window open here
 */
@Injectable({
  providedIn: "root",
})
export class ElectronService {
  private static get bridge(): ThumderBridge | undefined {
    return desktopBridge();
  }

  constructor() {
    const bridge = ElectronService.bridge;
    if (bridge === undefined) return;
    const html = inject(DOCUMENT).documentElement.classList;
    html.add("thumder-desktop");
    if (bridge.titleBar === "overlay") html.add("thumder-titlebar");
    const router = inject(Router);
    const zone = inject(NgZone);
    bridge.onNavigate((route) => zone.run(() => void router.navigateByUrl(route)));
  }

  /**
   * Windows and Linux: the navbar is the title bar. The buttons of the window are as high as it, without its bottom
   * border, and the cards that fill the window start under it (`--thumder-titlebar-height`). It returns what stops
   * following it
   */
  public followTitleBar(navbar: HTMLElement): () => void {
    const bridge = ElectronService.bridge;
    if (bridge?.titleBar !== "overlay") return () => undefined;
    const root = navbar.ownerDocument.documentElement;
    const observer = new ResizeObserver(() => {
      const height = navbar.getBoundingClientRect().height;
      const border = Number.parseFloat(getComputedStyle(navbar).borderBottomWidth) || 0;
      root.style.setProperty("--thumder-titlebar-height", `${height}px`);
      bridge.setPreferences({ titleBar: Math.floor(height - border) });
    });
    observer.observe(navbar);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--thumder-titlebar-height");
    };
  }

  /** Opens a link in the browser of the system (Electron, Android and iOS) or in a new tab (web) */
  public async openInExternal(url: string): Promise<void> {
    const bridge = ElectronService.bridge;
    if (bridge) {
      await bridge.openExternal(url);
      return;
    }
    if (nativePlatform() !== null) {
      const { openInBrowser } = await import("@core/services/mobile/mobile.service");
      await openInBrowser(url);
      return;
    }
    window.open(url, "_blank", "noopener");
  }

  public static get isServer(): boolean {
    const location_href = window.location.href;
    const localhost = "//localhost";
    return location_href.includes(localhost);
  }

  public static get isElectronApp(): boolean {
    return ElectronService.bridge !== undefined;
  }

  public get isElectronApp(): boolean {
    return ElectronService.isElectronApp;
  }

  public static get isMacOS(): boolean {
    return ElectronService.bridge?.platform === "darwin";
  }

  public static get isWindows(): boolean {
    return ElectronService.bridge?.platform === "win32";
  }

  public static get isLinux(): boolean {
    return ElectronService.bridge?.platform === "linux";
  }

  public static get isX86(): boolean {
    return ElectronService.bridge?.arch === "ia32";
  }

  public static get isX64(): boolean {
    return ElectronService.bridge?.arch === "x64";
  }

  public static get debug() {
    return {
      isElectronApp: ElectronService.isElectronApp,
      isServer: ElectronService.isServer,
      isMacOS: ElectronService.isMacOS,
      isWindows: ElectronService.isWindows,
      isLinux: ElectronService.isLinux,
      isX86: ElectronService.isX86,
      isX64: ElectronService.isX64,
    };
  }
}
