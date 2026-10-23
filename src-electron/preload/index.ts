// The preload script: the only things of Electron that the page can use (`window.thumder`). It runs in the sandbox, so
// it cannot load other files: the contract comes with `import type` and the compiler checks the channels against it.
import { contextBridge, type IpcRendererEvent, ipcRenderer } from "electron";
import type { MainMessages, PageMessages, PageQueries, PageRequests, ThumderBridge } from "../shared/contract";

function send<C extends keyof PageMessages>(channel: C, data: PageMessages[C]): void {
  ipcRenderer.send(channel, data);
}

function query<C extends keyof PageQueries>(channel: C): unknown {
  return ipcRenderer.sendSync(channel);
}

async function request<C extends keyof PageRequests>(channel: C, data: PageRequests[C]): Promise<void> {
  await ipcRenderer.invoke(channel, data);
}

/** Listens to a message of the main process; it returns what stops listening */
function listen<C extends keyof MainMessages>(channel: C, listener: (data: unknown) => void): () => void {
  const handler = (_event: IpcRendererEvent, data: unknown) => listener(data);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
}

const bridge: ThumderBridge = {
  platform: process.platform,
  arch: process.arch,
  titleBar: process.platform === "darwin" ? "native" : "overlay",
  systemDark: query("thumder:system-dark") === true,
  onSystemDark: (listener) => listen("thumder:system-dark-changed", (dark) => listener(dark === true)),
  setPreferences: (preferences) => send("thumder:preferences", preferences),
  onNavigate: (listener) =>
    listen("thumder:navigate", (route) => {
      if (typeof route === "string" && route.startsWith("/")) listener(route);
    }),
  openExternal: (url) => request("thumder:open-external", url),
};

contextBridge.exposeInMainWorld("thumder", bridge);
