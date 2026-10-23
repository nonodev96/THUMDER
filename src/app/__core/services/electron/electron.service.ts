import { DOCUMENT, Injectable, inject, NgZone } from "@angular/core";
import { Router } from "@angular/router";

/** What preload.ts exposes in Electron (the page has no access to Node.js) */
export type ThumderBridge = {
  platform: string;
  arch: string;
  /** "overlay": the navbar is the title bar, with the buttons of the window over its right (Windows and Linux) */
  titleBar: "overlay" | "native";
  /** Whether the desktop is dark (main.ts also reads the theme of the desktop on Linux), when the page starts */
  systemDark: boolean;
  onSystemDark(listener: (dark: boolean) => void): void;
  /** The theme and the language chosen, and the height of the navbar: the window, its buttons and its menu follow them */
  setPreferences(preferences: { theme?: string; lang?: string; titleBar?: number }): void;
  /** A route chosen in the menu of the window */
  onNavigate(listener: (route: string) => void): void;
  openExternal(url: string): Promise<void>;
  notify(): void;
};

/** The bridge of the desktop application, or undefined in the web */
export function desktopBridge(): ThumderBridge | undefined {
  return (globalThis as typeof globalThis & { thumder?: ThumderBridge }).thumder;
}

/**
 * The desktop application (Electron). In it the html element has the class `thumder-desktop` and, where the navbar is
 * the title bar of the window, `thumder-titlebar` (src/styles.scss leaves room for the buttons of the window); the
 * routes chosen in the menu of the window open here
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

  /** Opens a link in the browser of the system (Electron) or in a new tab (web) */
  public async openInExternal(url: string): Promise<void> {
    const bridge = ElectronService.bridge;
    if (bridge) {
      await bridge.openExternal(url);
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

  /** Messages to the main process of Electron (does nothing in the web) */
  public send(channel: "thumder-notification"): void {
    if (channel === "thumder-notification") ElectronService.bridge?.notify();
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
