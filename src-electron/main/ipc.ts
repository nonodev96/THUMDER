// What the page asks the main process (src-electron/preload). Only the pages of THUMDER are answered, and what they
// send is checked before it is used: the page is not trusted more than it needs.
import { type IpcMainEvent, type IpcMainInvokeEvent, ipcMain } from "electron";
import type { PageMessages, PageQueries, PageRequests, Preferences } from "../shared/contract";
import type { Environment } from "./environment";
import { isAppUrl, isExternalUrl } from "./links";
import { parsePreferences } from "./validation";

export interface IpcHandlers {
  /** Whether the desktop is dark */
  systemDark(): boolean;
  /** The theme, the language or the height of the navbar changed (only what is valid) */
  setPreferences(preferences: Preferences): void;
  /** Opens an http(s) or mailto link in the browser of the system */
  openExternal(url: string): Promise<void>;
}

export function registerIpc(environment: Environment, handlers: IpcHandlers): void {
  const trusted = (event: IpcMainEvent | IpcMainInvokeEvent) => isAppUrl(event.senderFrame?.url, environment);

  query("thumder:system-dark", (event) => (trusted(event) ? handlers.systemDark() : false));

  on("thumder:preferences", (event, data) => {
    if (trusted(event)) handlers.setPreferences(parsePreferences(data));
  });

  handle("thumder:open-external", async (event, url) => {
    if (trusted(event) && isExternalUrl(url)) await handlers.openExternal(url);
  });
}

function on<C extends keyof PageMessages>(channel: C, listener: (event: IpcMainEvent, data: unknown) => void): void {
  ipcMain.on(channel, listener);
}

function query<C extends keyof PageQueries>(channel: C, answer: (event: IpcMainEvent) => PageQueries[C]): void {
  ipcMain.on(channel, (event) => {
    event.returnValue = answer(event);
  });
}

function handle<C extends keyof PageRequests>(channel: C, handler: (event: IpcMainInvokeEvent, data: unknown) => Promise<void>): void {
  ipcMain.handle(channel, handler);
}
