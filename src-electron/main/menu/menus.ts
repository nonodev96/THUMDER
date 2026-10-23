// The menus of the window and of the tray, as templates (main/app.ts builds them with Electron). There is no
// File/Edit/View/Window of Electron: they have the shortcuts of an application (zoom, full screen, copy and paste) and
// the help. On Windows and Linux the menu bar is not shown (the navbar is the title bar), but its shortcuts work.
import type { MenuItemConstructorOptions } from "electron";
import type { Translate } from "../i18n";

export interface ApplicationMenuOptions {
  readonly t: Translate;
  /** macOS: the menu of the application, and the window can zoom */
  readonly mac: boolean;
  /** While developing: reload and the developer tools (reloading throws away the simulation) */
  readonly dev: boolean;
  readonly repository: string;
}

export interface ApplicationMenuActions {
  /** Zooms the page in (+1), out (-1) or to its real size (0) */
  zoom(direction: -1 | 0 | 1): void;
  /** Opens a route of THUMDER */
  navigate(route: string): void;
  /** Opens a link in the browser of the system */
  openExternal(url: string): void;
}

export const DOCUMENTATION_ROUTE = "/auth/documentation";

const separator: MenuItemConstructorOptions = { type: "separator" };

export function applicationMenu(options: ApplicationMenuOptions, actions: ApplicationMenuActions): MenuItemConstructorOptions[] {
  const { t, mac, dev, repository } = options;
  const appMenu: MenuItemConstructorOptions = {
    label: "THUMDER",
    submenu: [
      { role: "about", label: t("DESKTOP.MENU.ABOUT") },
      separator,
      { role: "services" },
      separator,
      { role: "hide", label: t("DESKTOP.MENU.HIDE") },
      { role: "hideOthers", label: t("DESKTOP.MENU.HIDE_OTHERS") },
      { role: "unhide", label: t("DESKTOP.MENU.SHOW_ALL") },
      separator,
      { role: "quit", label: t("DESKTOP.MENU.QUIT") },
    ],
  };
  return [
    ...(mac ? [appMenu] : []),
    {
      label: t("DESKTOP.MENU.EDIT"),
      submenu: [
        { role: "undo", label: t("DESKTOP.MENU.UNDO") },
        { role: "redo", label: t("DESKTOP.MENU.REDO") },
        separator,
        { role: "cut", label: t("DESKTOP.MENU.CUT") },
        { role: "copy", label: t("DESKTOP.MENU.COPY") },
        { role: "paste", label: t("DESKTOP.MENU.PASTE") },
        { role: "selectAll", label: t("DESKTOP.MENU.SELECT_ALL") },
      ],
    },
    {
      label: t("DESKTOP.MENU.VIEW"),
      submenu: [
        { label: t("DESKTOP.MENU.ZOOM_IN"), accelerator: "CmdOrCtrl+Plus", click: () => actions.zoom(1) },
        // The same, with the key of + without Shift
        { label: t("DESKTOP.MENU.ZOOM_IN"), accelerator: "CmdOrCtrl+=", click: () => actions.zoom(1), visible: false },
        { label: t("DESKTOP.MENU.ZOOM_OUT"), accelerator: "CmdOrCtrl+-", click: () => actions.zoom(-1) },
        { label: t("DESKTOP.MENU.RESET_ZOOM"), accelerator: "CmdOrCtrl+0", click: () => actions.zoom(0) },
        separator,
        { role: "togglefullscreen", label: t("DESKTOP.MENU.FULL_SCREEN") },
        ...(dev
          ? [
              separator,
              { role: "reload", label: t("DESKTOP.MENU.RELOAD") } as const,
              { role: "toggleDevTools", label: t("DESKTOP.MENU.DEV_TOOLS") } as const,
            ]
          : []),
      ],
    },
    {
      label: t("DESKTOP.MENU.WINDOW"),
      submenu: [
        { role: "minimize", label: t("DESKTOP.MENU.MINIMIZE") },
        ...(mac ? [{ role: "zoom" } as const] : []),
        { role: "close", label: t("DESKTOP.MENU.CLOSE") },
      ],
    },
    {
      label: t("DESKTOP.MENU.HELP"),
      role: "help",
      submenu: [
        { label: t("DESKTOP.MENU.DOCUMENTATION"), accelerator: "F1", click: () => actions.navigate(DOCUMENTATION_ROUTE) },
        separator,
        { label: t("DESKTOP.MENU.GITHUB"), click: () => actions.openExternal(repository) },
        { label: t("DESKTOP.MENU.ISSUES"), click: () => actions.openExternal(`${repository}/issues`) },
        ...(mac ? [] : [separator, { role: "about", label: t("DESKTOP.MENU.ABOUT") } as const]),
      ],
    },
  ];
}

export interface TrayMenuActions {
  show(): void;
  setAlwaysOnTop(on: boolean): void;
}

export function trayMenu(t: Translate, state: { alwaysOnTop: boolean }, actions: TrayMenuActions): MenuItemConstructorOptions[] {
  return [
    { label: t("DESKTOP.TRAY.SHOW"), click: () => actions.show() },
    {
      label: t("DESKTOP.TRAY.ALWAYS_ON_TOP"),
      type: "checkbox",
      checked: state.alwaysOnTop,
      click: (item) => actions.setAlwaysOnTop(item.checked),
    },
    separator,
    { label: t("DESKTOP.MENU.QUIT"), role: "quit" },
  ];
}
