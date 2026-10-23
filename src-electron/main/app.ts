// The desktop application put together: the settings, the theme, the window, its menus and the tray, and what the page
// asks. Each part is in its own file; this one only connects them.
import * as fs from "node:fs";
import * as path from "node:path";
import { app, Menu, nativeImage, nativeTheme, shell, Tray } from "electron";
import type { Preferences } from "../shared/contract";
import { type Environment, REPOSITORY } from "./environment";
import { Translator } from "./i18n";
import { registerIpc } from "./ipc";
import { applicationMenu, trayMenu } from "./menu/menus";
import { SettingsStore } from "./settings";
import { readDesktopDark, watchDesktopTheme } from "./theme/desktop-theme";
import { ThemeController } from "./theme/theme";
import { MainWindow } from "./window/main-window";

export async function startThumder(environment: Environment): Promise<void> {
  const mac = environment.platform === "darwin";
  // Quit when all windows are closed (on macOS the application stays until it is quit with Cmd + Q)
  app.on("window-all-closed", () => {
    if (!mac) app.quit();
  });
  if (environment.dev) restartWhenCompiled(environment.compiledDir);

  await app.whenReady();

  const translator = new Translator(path.join(environment.assetsDir, "i18n"));
  const locale = app.getLocale().split("-")[0];
  const settings = new SettingsStore(path.join(app.getPath("userData"), "desktop.json"), {
    theme: "system",
    lang: translator.has(locale) ? locale : "en",
    maximized: true,
  });
  const theme = new ThemeController(nativeTheme, settings.value.theme);
  const window = new MainWindow(environment, settings, theme);
  const tray = createTray(environment.icon, () => window.show());

  /** The menu of the window and the one of the tray, in the language of THUMDER */
  const refreshMenus = () => {
    const t = translator.for(settings.value.lang);
    const menu = applicationMenu(
      { t, mac, dev: environment.dev, repository: REPOSITORY },
      {
        zoom: (direction) => window.zoom(direction),
        navigate: (route) => window.navigate(route),
        openExternal: (url) => void shell.openExternal(url),
      },
    );
    Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
    const trayItems = trayMenu(
      t,
      { alwaysOnTop: window.isAlwaysOnTop },
      { show: () => window.show(), setAlwaysOnTop: (on) => window.setAlwaysOnTop(on) },
    );
    tray?.setContextMenu(Menu.buildFromTemplate(trayItems));
  };

  // The desktop changes its theme: the page follows it when its choice is «system»
  theme.onChange((state) => window.send("thumder:system-dark-changed", state.systemDark));
  if (environment.platform === "linux") {
    theme.setDesktopDark(await readDesktopDark());
    app.on(
      "will-quit",
      watchDesktopTheme((dark) => theme.setDesktopDark(dark)),
    );
  }

  const setPreferences = ({ theme: choice, lang, titleBar }: Preferences) => {
    if (choice !== undefined && choice !== settings.value.theme) {
      settings.update({ theme: choice });
      theme.setChoice(choice);
    }
    if (lang !== undefined && lang !== settings.value.lang && translator.has(lang)) {
      settings.update({ lang });
      refreshMenus();
    }
    if (titleBar !== undefined) window.setTitleBarHeight(titleBar);
  };
  registerIpc(environment, {
    systemDark: () => theme.state.systemDark,
    setPreferences,
    openExternal: (url) => shell.openExternal(url),
  });

  app.setAboutPanelOptions({
    applicationName: "THUMDER",
    applicationVersion: app.getVersion(),
    copyright: "© Antonio Mudarra Machuca",
    website: REPOSITORY,
    ...(environment.icon ? { iconPath: environment.icon } : {}),
  });

  // Opening THUMDER again (a second instance) or clicking its icon in the dock of macOS shows the window
  app.on("second-instance", () => window.show());
  app.on("activate", () => window.show());
  // A new window: the tray shows its state
  window.onOpened(refreshMenus);
  window.show();
}

/** The icon in the tray: a click shows the window */
function createTray(icon: string | undefined, show: () => void): Tray | null {
  if (icon === undefined) return null;
  const tray = new Tray(nativeImage.createFromPath(icon).resize({ width: 24, height: 24 }));
  tray.setToolTip("THUMDER");
  tray.on("click", show);
  return tray;
}

/** While developing: the page reloads by itself with `ng serve`, and Electron starts again when it is compiled (tsc) */
function restartWhenCompiled(dir: string): void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  fs.watch(dir, { recursive: true }, (_event, file) => {
    if (!file?.endsWith(".js")) return;
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => {
      app.relaunch();
      app.exit(0);
    }, 300);
  });
}
