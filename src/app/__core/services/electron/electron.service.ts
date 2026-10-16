import { Injectable } from "@angular/core";

/** What preload.ts exposes in Electron (the page has no access to Node.js) */
export type ThumderBridge = {
  platform: string;
  arch: string;
  openExternal(url: string): Promise<void>;
  notify(): void;
};

@Injectable({
  providedIn: "root",
})
export class ElectronService {
  private static get bridge(): ThumderBridge | undefined {
    return (window as Window & { thumder?: ThumderBridge }).thumder;
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
