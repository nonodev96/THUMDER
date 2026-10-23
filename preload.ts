import { contextBridge, ipcRenderer } from "electron";

// The only things of Electron that the Angular application can use (the window has no access to Node.js):
// window.thumder in src/app/__core/services/electron/electron.service.ts
contextBridge.exposeInMainWorld("thumder", {
  platform: process.platform,
  arch: process.arch,
  /** The navbar is the title bar, with the buttons of the window over its right (main.ts): not on macOS */
  titleBar: process.platform === "darwin" ? "native" : "overlay",
  /** Whether the desktop is dark, as main.ts sees it (with the theme of the desktop on Linux), when the page starts */
  systemDark: ipcRenderer.sendSync("thumder-system-dark") === true,
  /** The desktop changes its theme */
  onSystemDark: (listener: (dark: boolean) => void): void => {
    ipcRenderer.on("thumder-system-dark", (_event, dark: unknown) => listener(dark === true));
  },
  /** The theme and the language chosen in THUMDER, and the height of the navbar: the window, its buttons and its menu follow them */
  setPreferences: (preferences: { theme?: string; lang?: string; titleBar?: number }): void =>
    ipcRenderer.send("thumder-preferences", preferences),
  /** A route of THUMDER chosen in the menu (Help → Documentation) */
  onNavigate: (listener: (route: string) => void): void => {
    ipcRenderer.on("thumder-navigate", (_event, route: unknown) => {
      if (typeof route === "string" && route.startsWith("/")) listener(route);
    });
  },
  /** Opens an http(s) or mailto link in the browser of the system */
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke("thumder-open-external", url),
  notify: (): void => ipcRenderer.send("thumder-notification"),
});
