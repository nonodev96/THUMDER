// The window of THUMDER. It looks like an application of the desktop: on Windows and Linux the navbar of THUMDER is the
// title bar (no native title bar nor menu bar) and Electron draws the buttons of the window (minimise, maximise, close)
// over its right with the colours of the theme (the Window Controls Overlay; src/styles.scss leaves them room). It
// opens where it was, without a white flash, and links to other sites open in the browser of the system.
import { BrowserWindow, nativeImage, screen, shell } from "electron";
import type { MainMessages } from "../../shared/contract";
import type { Environment } from "../environment";
import { isAppUrl, isExternalUrl } from "../links";
import type { SettingsStore } from "../settings";
import type { ThemeController, ThemeState } from "../theme/theme";
import { DEFAULT_TITLE_BAR_HEIGHT, initialBounds, MIN_WINDOW_SIZE, nextZoomLevel, overlayHeight } from "./geometry";

export class MainWindow {
  private window: BrowserWindow | null = null;
  /** The height of the navbar without its bottom border, in pixels of the page (it measures itself) */
  private titleBarHeight = DEFAULT_TITLE_BAR_HEIGHT;
  private readonly openedListeners = new Set<() => void>();

  constructor(
    private readonly environment: Environment,
    private readonly settings: SettingsStore,
    private readonly theme: ThemeController,
  ) {
    theme.onChange((state) => this.applyTheme(state));
  }

  public get isOpen(): boolean {
    return this.window !== null;
  }

  public get isAlwaysOnTop(): boolean {
    return this.window?.isAlwaysOnTop() ?? false;
  }

  /** Shows the window, creating it if it is closed */
  public show(): void {
    if (this.window === null) {
      this.create();
      return;
    }
    if (this.window.isMinimized()) this.window.restore();
    this.window.show();
    this.window.focus();
  }

  /** The window opened (also again on macOS) */
  public onOpened(listener: () => void): void {
    this.openedListeners.add(listener);
  }

  /** A route of THUMDER (the page navigates: file:// cannot open routes directly) */
  public navigate(route: string): void {
    this.show();
    this.send("thumder:navigate", route);
  }

  public send<C extends keyof MainMessages>(channel: C, data: MainMessages[C]): void {
    if (this.window !== null && !this.window.isDestroyed()) this.window.webContents.send(channel, data);
  }

  /** The zoom of the page, with the buttons of the window as high as the navbar */
  public zoom(direction: -1 | 0 | 1): void {
    if (this.window === null) return;
    const contents = this.window.webContents;
    contents.setZoomLevel(nextZoomLevel(contents.getZoomLevel(), direction));
    this.applyTheme();
  }

  public setAlwaysOnTop(on: boolean): void {
    this.window?.setAlwaysOnTop(on);
  }

  /** The navbar measured itself */
  public setTitleBarHeight(height: number): void {
    if (height === this.titleBarHeight) return;
    this.titleBarHeight = height;
    this.applyTheme();
  }

  private create(): void {
    const { environment, settings } = this;
    const { palette } = this.theme.state;
    const window = new BrowserWindow({
      ...initialBounds(settings.value.bounds, (bounds) => screen.getDisplayMatching(bounds).workArea, screen.getPrimaryDisplay().workArea),
      minWidth: MIN_WINDOW_SIZE,
      minHeight: MIN_WINDOW_SIZE,
      title: "THUMDER",
      // Shown when it has something to show, with the colour of the theme meanwhile (no white flash)
      show: false,
      backgroundColor: palette.background,
      ...(environment.icon && environment.platform !== "darwin" ? { icon: nativeImage.createFromPath(environment.icon) } : {}),
      ...(environment.ownTitleBar
        ? {
            titleBarStyle: "hidden" as const,
            titleBarOverlay: { color: palette.bar, symbolColor: palette.symbol, height: this.overlayHeight() },
          }
        : {}),
      webPreferences: {
        // The page has no access to Node.js: it only gets what the preload script exposes
        preload: environment.preload,
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webviewTag: false,
      },
    });
    this.window = window;
    if (settings.value.maximized) window.maximize();
    window.once("ready-to-show", () => window.show());

    this.rememberBounds(window);
    this.keepLinksOutside(window);
    // Ctrl and the wheel of the mouse: the buttons of the window follow the zoom too
    window.webContents.on("zoom-changed", () => setTimeout(() => this.applyTheme(), 50));
    if (environment.dev) window.webContents.openDevTools();
    window.on("closed", () => {
      this.window = null;
    });

    void window.loadURL(environment.pageUrl);
    for (const listener of this.openedListeners) listener();
  }

  /** Where it is and how big, for the next time */
  private rememberBounds(window: BrowserWindow): void {
    const remember = () => {
      if (window.isDestroyed()) return;
      const maximized = window.isMaximized();
      const normal = !maximized && !window.isMinimized() && !window.isFullScreen();
      this.settings.update({ maximized, ...(normal ? { bounds: window.getNormalBounds() } : {}) });
    };
    window.on("resize", remember);
    window.on("move", remember);
    window.on("maximize", remember);
    window.on("unmaximize", remember);
    window.on("close", () => {
      remember();
      this.settings.flush();
    });
  }

  /** Links to other sites open in the browser of the system, never inside THUMDER */
  private keepLinksOutside(window: BrowserWindow): void {
    window.webContents.setWindowOpenHandler(({ url }) => {
      if (isExternalUrl(url)) void shell.openExternal(url);
      return { action: "deny" };
    });
    window.webContents.on("will-navigate", (event, url) => {
      if (isAppUrl(url, this.environment)) return;
      event.preventDefault();
      if (isExternalUrl(url)) void shell.openExternal(url);
    });
  }

  /** The colour of the window and of its buttons */
  private applyTheme(state: ThemeState = this.theme.state): void {
    const window = this.window;
    if (window === null || window.isDestroyed()) return;
    window.setBackgroundColor(state.palette.background);
    if (this.environment.ownTitleBar) {
      window.setTitleBarOverlay({ color: state.palette.bar, symbolColor: state.palette.symbol, height: this.overlayHeight() });
    }
  }

  private overlayHeight(): number {
    const zoom = this.window && !this.window.isDestroyed() ? this.window.webContents.getZoomFactor() : 1;
    return overlayHeight(this.titleBarHeight, zoom);
  }
}
