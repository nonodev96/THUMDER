import { contextBridge, ipcRenderer } from "electron";

// The only things of Electron that the Angular application can use (the window has no access to Node.js):
// window.thumder in src/app/__core/services/electron/electron.service.ts
contextBridge.exposeInMainWorld("thumder", {
  platform: process.platform,
  arch: process.arch,
  /** Opens an http(s) or mailto link in the browser of the system */
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke("thumder-open-external", url),
  notify: (): void => ipcRenderer.send("thumder-notification"),
});
