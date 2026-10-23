// The main process of the desktop application (Electron). The window looks like an application of the desktop:
//
// - On Windows and Linux the navbar of THUMDER is the title bar: there is no native title bar nor menu bar, and Electron
//   draws the buttons of the window (minimise, maximise, close) over the right of the navbar, with its colours (the
//   Window Controls Overlay; src/styles.scss leaves them room). macOS keeps its native title bar and its menu bar.
// - The theme follows the one chosen in THUMDER and, with «system», the one of the desktop: Chromium reads the
//   preference of the portal and the GTK theme, and on Linux THUMDER also reads the theme of the desktop itself
//   (Cinnamon, GNOME, MATE), whose panels can be dark with light applications. The native parts (menus, scrollbars,
//   dialogs, the buttons of the window) follow it too.
// - The menu has no File/Edit/View/Window of Electron: it has the shortcuts of an application (zoom, full screen,
//   copy and paste) and the help; on Windows and Linux it is not shown, but its shortcuts work.
// - Its icon, a single window that keeps its place and size, no white flash when it opens, and an icon in the tray.
import { execFile, spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";
import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  type MenuItemConstructorOptions,
  Notification,
  type NotificationConstructorOptions,
  nativeImage,
  nativeTheme,
  type Rectangle,
  screen,
  shell,
  Tray,
} from "electron";

let win: BrowserWindow | null = null;
let tray: Tray | null = null;
const args = process.argv.slice(1);
const isServe = args.some((val) => val === "--serve");
const isMac = process.platform === "darwin";
const isLinux = process.platform === "linux";

/** Windows and Linux: the navbar is the title bar, with the buttons of the window over it */
const OWN_TITLE_BAR = !isMac;
/**
 * The height of the navbar without its bottom border, in pixels of the page: the buttons of the window take it. The
 * navbar measures itself and says it (auth-navbar.component.ts); this is the one it has on a desktop
 */
let titleBarCss = 52;

/** The height of the buttons of the window, in pixels of the window: the navbar, with the zoom of the page */
function titleBarHeight(): number {
  const zoom = win && !win.isDestroyed() ? win.webContents.getZoomFactor() : 1;
  return Math.max(24, Math.round(titleBarCss * zoom));
}

// The colours of src/theme.scss: the navbar (--thumder-surface), its text (--thumder-text) and the page (--thumder-bg)
const COLOURS = {
  light: { bar: "#ffffff", symbol: "#0f172a", background: "#f1f5f9" },
  dark: { bar: "#1e293b", symbol: "#e2e8f0", background: "#0f172a" },
};

const REPOSITORY = "https://github.com/nonodev96/THUMDER";

// The Angular application, built by `ng build` into dist/browser
const DEV_SERVER_URL = "http://localhost:4200";
const APP_URL = isServe
  ? DEV_SERVER_URL
  : url.format({
      pathname: path.join(__dirname, "dist", "browser", "index.html"),
      protocol: "file:",
      slashes: true,
    });

/** The icon of the window and of the tray: in the application built, or in the sources (`electron . --serve`) */
const ICON = [
  path.join(__dirname, "dist", "browser", "assets", "icons", "thumder-desktop.png"),
  path.join(__dirname, "src", "assets", "icons", "thumder-desktop.png"),
].find((file) => fs.existsSync(file));

const EXTERNAL_PROTOCOLS = ["https:", "http:", "mailto:"];

function isExternal(link: string): boolean {
  try {
    return EXTERNAL_PROTOCOLS.includes(new URL(link).protocol);
  } catch {
    return false;
  }
}

function isApp(link: string): boolean {
  return isServe ? link.startsWith(DEV_SERVER_URL) : link.startsWith("file:");
}

// ─── What the desktop application remembers (userData/desktop.json) ─────────────────────────────────────────────────

type ThemeChoice = "light" | "dark" | "system";
type Lang = "es" | "en";
type Settings = { theme: ThemeChoice; lang: Lang; bounds?: Rectangle; maximized: boolean };

const SETTINGS_FILE = () => path.join(app.getPath("userData"), "desktop.json");

function loadSettings(): Settings {
  const defaults: Settings = { theme: "system", lang: app.getLocale().startsWith("es") ? "es" : "en", maximized: true };
  try {
    const saved = JSON.parse(fs.readFileSync(SETTINGS_FILE(), "utf8"));
    return {
      theme: ["light", "dark", "system"].includes(saved.theme) ? saved.theme : defaults.theme,
      lang: saved.lang === "en" || saved.lang === "es" ? saved.lang : defaults.lang,
      bounds: isRectangle(saved.bounds) ? saved.bounds : undefined,
      maximized: typeof saved.maximized === "boolean" ? saved.maximized : defaults.maximized,
    };
  } catch {
    return defaults;
  }
}

function isRectangle(value: unknown): value is Rectangle {
  const r = value as Rectangle;
  return typeof r === "object" && r !== null && [r.x, r.y, r.width, r.height].every((n) => Number.isFinite(n));
}

let settings: Settings;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function saveSettings(now = false): void {
  if (saveTimer !== null) clearTimeout(saveTimer);
  const write = () => {
    saveTimer = null;
    try {
      fs.mkdirSync(app.getPath("userData"), { recursive: true });
      fs.writeFileSync(SETTINGS_FILE(), JSON.stringify(settings, null, 2));
    } catch (error) {
      console.error(error);
    }
  };
  if (now) write();
  else saveTimer = setTimeout(write, 500);
}

// ─── The theme ──────────────────────────────────────────────────────────────────────────────────────────────────────

/** Whether Chromium sees the desktop dark (the portal of the desktop, the GTK theme, Windows, macOS) */
let nativeDark = false;
/** Linux: whether the desktop says it is dark in a way Chromium does not read (the theme of the panels of Cinnamon...) */
let desktopDark = false;

const systemDark = () => nativeDark || desktopDark;

/** The theme of THUMDER and of the native parts of the window, from the choice and the desktop */
function applyTheme(): void {
  const choice = settings.theme;
  nativeTheme.themeSource = choice !== "system" ? choice : desktopDark && !nativeDark ? "dark" : "system";
  const dark = choice === "dark" || (choice === "system" && systemDark());
  const colours = dark ? COLOURS.dark : COLOURS.light;
  if (win === null) return;
  win.setBackgroundColor(colours.background);
  if (OWN_TITLE_BAR) win.setTitleBarOverlay({ color: colours.bar, symbolColor: colours.symbol, height: titleBarHeight() });
}

function colours() {
  const dark = settings.theme === "dark" || (settings.theme === "system" && systemDark());
  return dark ? COLOURS.dark : COLOURS.light;
}

/** The settings of the desktops of Linux that say it is dark: the preference of dark applications, and the themes */
const DESKTOP_KEYS: { schema: string; key: string; dark: (value: string) => boolean }[] = [
  { schema: "org.gnome.desktop.interface", key: "color-scheme", dark: (value) => value.includes("prefer-dark") },
  { schema: "org.x.apps.portal", key: "color-scheme", dark: (value) => value.includes("prefer-dark") },
  { schema: "org.gnome.desktop.interface", key: "gtk-theme", dark: (value) => /dark/i.test(value) },
  { schema: "org.cinnamon.desktop.interface", key: "gtk-theme", dark: (value) => /dark/i.test(value) },
  { schema: "org.cinnamon.theme", key: "name", dark: (value) => /dark/i.test(value) },
  { schema: "org.mate.interface", key: "gtk-theme", dark: (value) => /dark/i.test(value) },
];

function gsettings(schema: string, key: string): Promise<string> {
  return new Promise((resolve) => {
    execFile("gsettings", ["get", schema, key], { timeout: 2000 }, (error, stdout) => resolve(error ? "" : stdout.trim()));
  });
}

async function readDesktopDark(): Promise<boolean> {
  if (!isLinux) return false;
  const values = await Promise.all(DESKTOP_KEYS.map(({ schema, key }) => gsettings(schema, key)));
  return DESKTOP_KEYS.some(({ dark }, index) => values[index] !== "" && dark(values[index]));
}

/** Linux: the theme of the desktop changes while THUMDER is open (`gsettings monitor`, one process for each schema) */
function watchDesktop(): void {
  if (!isLinux) return;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const changed = () => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(async () => {
      const dark = await readDesktopDark();
      if (dark === desktopDark) return;
      desktopDark = dark;
      themeChanged();
    }, 300);
  };
  for (const schema of new Set(DESKTOP_KEYS.map(({ schema }) => schema))) {
    try {
      const monitor = spawn("gsettings", ["monitor", schema], { stdio: ["ignore", "pipe", "ignore"] });
      monitor.on("error", () => undefined);
      monitor.stdout?.on("data", changed);
      app.on("will-quit", () => monitor.kill());
    } catch {
      // Without gsettings the theme of the desktop is the one Chromium sees
    }
  }
}

/** The desktop changed its theme: the window and the page (which follows it when the choice is «system») */
function themeChanged(): void {
  applyTheme();
  win?.webContents.send("thumder-system-dark", systemDark());
}

// ─── The texts of the menu and the tray ─────────────────────────────────────────────────────────────────────────────

const TEXTS = {
  es: {
    edit: "Edición",
    undo: "Deshacer",
    redo: "Rehacer",
    cut: "Cortar",
    copy: "Copiar",
    paste: "Pegar",
    selectAll: "Seleccionar todo",
    view: "Ver",
    zoomIn: "Ampliar",
    zoomOut: "Reducir",
    resetZoom: "Tamaño real",
    fullScreen: "Pantalla completa",
    reload: "Recargar",
    devTools: "Herramientas de desarrollo",
    window: "Ventana",
    minimize: "Minimizar",
    close: "Cerrar",
    help: "Ayuda",
    documentation: "Documentación",
    github: "THUMDER en GitHub",
    issues: "Informar de un problema",
    about: "Acerca de THUMDER",
    hide: "Ocultar THUMDER",
    hideOthers: "Ocultar otros",
    showAll: "Mostrar todo",
    quit: "Salir de THUMDER",
    show: "Mostrar THUMDER",
    alwaysOnTop: "Siempre encima",
  },
  en: {
    edit: "Edit",
    undo: "Undo",
    redo: "Redo",
    cut: "Cut",
    copy: "Copy",
    paste: "Paste",
    selectAll: "Select all",
    view: "View",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    resetZoom: "Actual size",
    fullScreen: "Full screen",
    reload: "Reload",
    devTools: "Developer tools",
    window: "Window",
    minimize: "Minimize",
    close: "Close",
    help: "Help",
    documentation: "Documentation",
    github: "THUMDER on GitHub",
    issues: "Report a problem",
    about: "About THUMDER",
    hide: "Hide THUMDER",
    hideOthers: "Hide others",
    showAll: "Show all",
    quit: "Quit THUMDER",
    show: "Show THUMDER",
    alwaysOnTop: "Always on top",
  },
};

/** The zoom of the page (Ctrl + and Ctrl -), with the buttons of the window as high as the navbar */
function zoom(step: number | null): void {
  if (win === null) return;
  const level = step === null ? 0 : Math.min(5, Math.max(-4, win.webContents.getZoomLevel() + step));
  win.webContents.setZoomLevel(level);
  applyTheme();
}

/** A route of THUMDER, opened from the menu (the page navigates: file:// cannot open routes directly) */
function navigate(route: string): void {
  showWindow();
  win?.webContents.send("thumder-navigate", route);
}

function buildMenu(): void {
  const t = TEXTS[settings.lang];
  const separator: MenuItemConstructorOptions = { type: "separator" };
  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: "THUMDER",
            submenu: [
              { role: "about", label: t.about },
              separator,
              { role: "services" },
              separator,
              { role: "hide", label: t.hide },
              { role: "hideOthers", label: t.hideOthers },
              { role: "unhide", label: t.showAll },
              separator,
              { role: "quit", label: t.quit },
            ],
          } as MenuItemConstructorOptions,
        ]
      : []),
    {
      label: t.edit,
      submenu: [
        { role: "undo", label: t.undo },
        { role: "redo", label: t.redo },
        separator,
        { role: "cut", label: t.cut },
        { role: "copy", label: t.copy },
        { role: "paste", label: t.paste },
        { role: "selectAll", label: t.selectAll },
      ],
    },
    {
      label: t.view,
      submenu: [
        { label: t.zoomIn, accelerator: "CmdOrCtrl+Plus", click: () => zoom(0.5) },
        { label: t.zoomIn, accelerator: "CmdOrCtrl+=", click: () => zoom(0.5), visible: false },
        { label: t.zoomOut, accelerator: "CmdOrCtrl+-", click: () => zoom(-0.5) },
        { label: t.resetZoom, accelerator: "CmdOrCtrl+0", click: () => zoom(null) },
        separator,
        { role: "togglefullscreen", label: t.fullScreen },
        // Reloading throws away the simulation: only while developing
        ...(isServe
          ? [separator, { role: "reload", label: t.reload } as const, { role: "toggleDevTools", label: t.devTools } as const]
          : []),
      ],
    },
    {
      label: t.window,
      submenu: [{ role: "minimize", label: t.minimize }, ...(isMac ? [{ role: "zoom" } as const] : []), { role: "close", label: t.close }],
    },
    {
      label: t.help,
      role: "help",
      submenu: [
        { label: t.documentation, accelerator: "F1", click: () => navigate("/auth/documentation") },
        separator,
        { label: t.github, click: () => void shell.openExternal(REPOSITORY) },
        { label: t.issues, click: () => void shell.openExternal(`${REPOSITORY}/issues`) },
        ...(isMac ? [] : [separator, { role: "about", label: t.about } as const]),
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  buildTray();
}

function buildTray(): void {
  if (tray === null) return;
  const t = TEXTS[settings.lang];
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: t.show, click: showWindow },
      {
        label: t.alwaysOnTop,
        type: "checkbox",
        checked: win?.isAlwaysOnTop() ?? false,
        click: (item) => win?.setAlwaysOnTop(item.checked),
      },
      { type: "separator" },
      { label: t.quit, role: "quit" },
    ]),
  );
}

function showWindow(): void {
  if (win === null) {
    createWindow();
    return;
  }
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}

// ─── The window ─────────────────────────────────────────────────────────────────────────────────────────────────────

/** Where the window opens: where it was, if that place is still on a screen; if not, centred */
function initialBounds(): Rectangle {
  const saved = settings.bounds;
  if (saved && saved.width >= 400 && saved.height >= 400) {
    const area = screen.getDisplayMatching(saved).workArea;
    const visible =
      saved.x < area.x + area.width - 100 &&
      saved.x + saved.width > area.x + 100 &&
      saved.y >= area.y - 10 &&
      saved.y < area.y + area.height - 100;
    if (visible) return saved;
  }
  const area = screen.getPrimaryDisplay().workArea;
  const width = Math.round(area.width * 0.85);
  const height = Math.round(area.height * 0.85);
  return { x: area.x + Math.round((area.width - width) / 2), y: area.y + Math.round((area.height - height) / 2), width, height };
}

function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    ...initialBounds(),
    minWidth: 400,
    minHeight: 400,
    title: "THUMDER",
    // Shown when it has something to show, with the colour of the theme meanwhile (no white flash)
    show: false,
    backgroundColor: colours().background,
    ...(ICON && !isMac ? { icon: nativeImage.createFromPath(ICON) } : {}),
    ...(OWN_TITLE_BAR
      ? {
          titleBarStyle: "hidden" as const,
          titleBarOverlay: { color: colours().bar, symbolColor: colours().symbol, height: titleBarHeight() },
        }
      : {}),
    webPreferences: {
      // The page has no access to Node.js: it only gets what preload.ts exposes
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });
  win = window;
  if (settings.maximized) window.maximize();
  window.once("ready-to-show", () => window.show());

  // Where and how big it is, for the next time
  const remember = () => {
    if (window.isDestroyed()) return;
    settings.maximized = window.isMaximized();
    if (!window.isMaximized() && !window.isMinimized() && !window.isFullScreen()) settings.bounds = window.getNormalBounds();
    saveSettings();
  };
  for (const event of ["resize", "move", "maximize", "unmaximize"] as const) window.on(event as "resize", remember);
  window.on("close", () => {
    remember();
    saveSettings(true);
  });

  // Links to other sites open in the browser of the system, never inside THUMDER
  window.webContents.setWindowOpenHandler(({ url: link }) => {
    if (isExternal(link)) void shell.openExternal(link);
    return { action: "deny" };
  });
  window.webContents.on("will-navigate", (event, link) => {
    if (isApp(link)) return;
    event.preventDefault();
    if (isExternal(link)) void shell.openExternal(link);
  });

  // Ctrl and the wheel of the mouse: the buttons of the window follow the zoom too
  window.webContents.on("zoom-changed", () => setTimeout(applyTheme, 50));

  if (isServe) {
    window.webContents.openDevTools();
    // The page reloads by itself with `ng serve`; when main.js or preload.js change (tsc), Electron starts again
    for (const file of ["main.js", "preload.js"]) {
      fs.watch(path.join(__dirname, file), () => {
        app.relaunch();
        app.exit(0);
      });
    }
  }
  void window.loadURL(APP_URL);

  window.on("closed", () => {
    win = null;
  });
  buildTray();
  return window;
}

// ─── The application ────────────────────────────────────────────────────────────────────────────────────────────────

// A single THUMDER installed: opening it again shows the window that is open (not while developing, nor in the tests)
const single = !app.isPackaged || app.requestSingleInstanceLock();
if (!single) {
  app.quit();
} else {
  app.on("second-instance", showWindow);

  app.whenReady().then(async () => {
    settings = loadSettings();
    nativeDark = nativeTheme.shouldUseDarkColors;
    desktopDark = await readDesktopDark();
    applyTheme();
    nativeTheme.on("updated", () => {
      // What the desktop says, only while Chromium follows it (not while THUMDER chooses for it)
      if (nativeTheme.themeSource !== "system") return;
      const dark = nativeTheme.shouldUseDarkColors;
      if (dark === nativeDark) return;
      nativeDark = dark;
      themeChanged();
    });
    watchDesktop();

    app.setAboutPanelOptions({
      applicationName: "THUMDER",
      applicationVersion: app.getVersion(),
      copyright: "© Antonio Mudarra Machuca",
      website: REPOSITORY,
      ...(ICON ? { iconPath: ICON } : {}),
    });

    if (ICON) {
      tray = new Tray(nativeImage.createFromPath(ICON).resize({ width: 24, height: 24 }));
      tray.setToolTip("THUMDER");
      tray.on("click", showWindow);
    }
    buildMenu();
    createWindow();
  });

  // Quit when all windows are closed (on macOS the application stays until it is quit with Cmd + Q)
  app.on("window-all-closed", () => {
    if (!isMac) app.quit();
  });

  app.on("activate", () => {
    if (win === null) createWindow();
  });

  // What the page asks (preload.ts)
  ipcMain.handle("thumder-open-external", async (_event, link: unknown) => {
    if (typeof link === "string" && isExternal(link)) await shell.openExternal(link);
  });

  ipcMain.on("thumder-system-dark", (event) => {
    event.returnValue = settings ? systemDark() : nativeTheme.shouldUseDarkColors;
  });

  // The theme and the language chosen in THUMDER, and the height of its navbar
  ipcMain.on("thumder-preferences", (_event, preferences: unknown) => {
    const { theme, lang, titleBar } = (typeof preferences === "object" && preferences !== null ? preferences : {}) as Partial<Settings> & {
      titleBar?: number;
    };
    if (typeof titleBar === "number" && Number.isFinite(titleBar) && titleBar >= 16 && titleBar <= 200 && titleBar !== titleBarCss) {
      titleBarCss = titleBar;
      applyTheme();
    }
    let changed = false;
    if (theme && ["light", "dark", "system"].includes(theme) && theme !== settings.theme) {
      settings.theme = theme;
      applyTheme();
      changed = true;
    }
    if ((lang === "es" || lang === "en") && lang !== settings.lang) {
      settings.lang = lang;
      buildMenu();
      changed = true;
    }
    if (changed) saveSettings();
  });

  ipcMain.on("thumder-notification", () => {
    const options: NotificationConstructorOptions = { title: "THUMDER", body: "Notifications are working", silent: false };
    new Notification(options).show();
  });
}
