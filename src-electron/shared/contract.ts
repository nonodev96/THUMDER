// The contract between the three parts of the desktop application: the main process (src-electron/main), the preload
// script (src-electron/preload) and the page (src/app/__core/services/electron). Only types: the preload script runs in
// the sandbox and cannot load other files, so it and the page import this file with `import type`, and the compiler
// checks that the three use the same channels with the same data.

export type ThemeChoice = "light" | "dark" | "system";

/** What THUMDER tells the window: the theme and the language chosen, and the height of its navbar */
export interface Preferences {
  theme?: ThemeChoice;
  /** A language of THUMDER: a file of src/assets/i18n */
  lang?: string;
  /** The height of the navbar without its bottom border, in pixels of the page: the buttons of the window take it */
  titleBar?: number;
}

/** The messages of the page to the main process (`ipcRenderer.send`), with their data */
export interface PageMessages {
  "thumder:preferences": Preferences;
}

/** The requests of the page that wait for the main process (`ipcRenderer.invoke`), with their data */
export interface PageRequests {
  "thumder:open-external": string;
}

/** What the page asks while it starts, before its first paint (`ipcRenderer.sendSync`), with the answer */
export interface PageQueries {
  "thumder:system-dark": boolean;
}

/** The messages of the main process to the page (`webContents.send`), with their data */
export interface MainMessages {
  /** The desktop changed its theme */
  "thumder:system-dark-changed": boolean;
  /** A route of THUMDER chosen in the menu of the window (Help → Documentation) */
  "thumder:navigate": string;
}

/** `window.thumder`: what the preload script gives to the page (it has no access to Node.js nor to Electron) */
export interface ThumderBridge {
  readonly platform: string;
  readonly arch: string;
  /** "overlay": the navbar is the title bar, with the buttons of the window over its right (Windows and Linux) */
  readonly titleBar: "overlay" | "native";
  /** Whether the desktop is dark when the page starts (on Linux, also the theme of the desktop that Chromium does not read) */
  readonly systemDark: boolean;
  /** The desktop changes its theme; it returns what stops listening */
  onSystemDark(listener: (dark: boolean) => void): () => void;
  /** The theme and the language chosen, and the height of the navbar: the window, its buttons and its menu follow them */
  setPreferences(preferences: Preferences): void;
  /** A route chosen in the menu of the window; it returns what stops listening */
  onNavigate(listener: (route: string) => void): () => void;
  /** Opens an http(s) or mailto link in the browser of the system */
  openExternal(url: string): Promise<void>;
}
