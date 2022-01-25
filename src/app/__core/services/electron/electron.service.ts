import { Injectable } from "@angular/core";

import { ipcRenderer, webFrame, remote } from "electron";
import * as childProcess from "child_process";
import * as fs from "fs";

@Injectable({
  providedIn: "root"
})
export class ElectronService {
  private _electron: any;

  public ipcRenderer: typeof ipcRenderer;
  public webFrame: typeof webFrame;
  public remote: typeof remote;
  public childProcess: typeof childProcess;
  public fs: typeof fs;

  constructor() {
    // Conditional imports
    if (ElectronService.isElectron()) {
      this.ipcRenderer = window.require("electron").ipcRenderer;
      this.webFrame = window.require("electron").webFrame;
      this.remote = window.require("electron").remote;

      this.childProcess = window.require("child_process");
      this.fs = window.require("fs");
    }
  }


  public async openInExternal(url: string): Promise<void> {
    await this.shell.openExternal(url);
  }

  private get electron(): any {
    if (!this._electron) {
      if (window && window.require) {
        this._electron = window.require("electron");
        return this._electron;
      }
      return null;
    }
    return this._electron;
  }

  public static isElectron() {
    return window && window.process && window.process.type;
  }

  public static get isServer(): boolean {
    const location_href = window.location.href;
    const localhost = "//localhost";
    return location_href.includes(localhost);
  }

  // New 2
  public static get isElectronApp(): boolean {
    return !!window.navigator.userAgent.match(/Electron/);
  }

  public get isElectronApp(): boolean {
    return !!window.navigator.userAgent.match(/Electron/);
  }

  public static get isMacOS(): boolean {
    return ElectronService.isElectronApp && process.platform === "darwin";
  }

  public static get isWindows(): boolean {
    return ElectronService.isElectronApp && process.platform === "win32";
  }

  public static get isLinux(): boolean {
    return ElectronService.isElectronApp && process.platform === "linux";
  }

  public static get isX86(): boolean {
    return ElectronService.isElectronApp && process.arch === "ia32";
  }

  public static get isX64(): boolean {
    return ElectronService.isElectronApp && process.arch === "x64";
  }

  public get nativeImage(): Electron.nativeImage {
    return this.electron ? this.electron.nativeImage : null;
  }

  public get screen(): Electron.Screen {
    return this.electron ? this.electron.screen : null;
  }

  public get shell(): Electron.Shell {
    return this.electron ? this.electron.shell : null;
  }

  public static get debug(): any {
    return {
      "isElectronApp": ElectronService.isElectronApp,
      "isServer":      ElectronService.isServer,
      "isMacOS":       ElectronService.isMacOS,
      "isWindows":     ElectronService.isWindows,
      "isLinux":       ElectronService.isLinux,
      "isX86":         ElectronService.isX86,
      "isX64":         ElectronService.isX64
    };
  }
}
