import * as path from "node:path";
import type { MenuItemConstructorOptions } from "electron";
import { describe, expect, it, vi } from "vitest";
import { Translator } from "../i18n";
import { applicationMenu, DOCUMENTATION_ROUTE, trayMenu } from "./menus";

const translator = new Translator(path.join(__dirname, "..", "..", "..", "src", "assets", "i18n"));
const REPOSITORY = "https://github.com/nonodev96/THUMDER";

const actions = () => ({ zoom: vi.fn(), navigate: vi.fn(), openExternal: vi.fn() });

/** Every item of a menu and of its submenus */
function items(menu: MenuItemConstructorOptions[]): MenuItemConstructorOptions[] {
  return menu.flatMap((item) => [item, ...(Array.isArray(item.submenu) ? items(item.submenu) : [])]);
}

function find(menu: MenuItemConstructorOptions[], label: string): MenuItemConstructorOptions {
  const item = items(menu).find((candidate) => candidate.label === label);
  if (item === undefined) throw new Error(`No item «${label}»`);
  return item;
}

const click = (item: MenuItemConstructorOptions) => item.click?.({} as never, undefined, {} as never);

describe("The menus of the window", () => {
  it("are those of THUMDER, not File/Edit/View/Window of Electron, in its language", () => {
    const options = { t: translator.for("es"), mac: false, dev: false, repository: REPOSITORY };
    expect(applicationMenu(options, actions()).map((item) => item.label)).toEqual(["Edición", "Ver", "Ventana", "Ayuda"]);
    const english = applicationMenu({ ...options, t: translator.for("en") }, actions());
    expect(english.map((item) => item.label)).toEqual(["Edit", "View", "Window", "Help"]);
  });

  it("have all their texts in every language of THUMDER", () => {
    for (const lang of ["es", "en"]) {
      const t = translator.for(lang);
      for (const mac of [false, true]) {
        const menu = [...applicationMenu({ t, mac, dev: true, repository: REPOSITORY }, actions()), ...trayMenu(t, { alwaysOnTop: false }, { show: vi.fn(), setAlwaysOnTop: vi.fn() })];
        const untranslated = items(menu).filter((item) => item.label?.startsWith("DESKTOP."));
        expect(untranslated.map((item) => item.label)).toEqual([]);
      }
    }
  });

  it("open the documentation with F1, the repository in the browser and zoom the page", () => {
    const calls = actions();
    const menu = applicationMenu({ t: translator.for("en"), mac: false, dev: false, repository: REPOSITORY }, calls);
    const documentation = find(menu, "Documentation");
    expect(documentation.accelerator).toBe("F1");
    click(documentation);
    expect(calls.navigate).toHaveBeenCalledWith(DOCUMENTATION_ROUTE);
    click(find(menu, "Report a problem"));
    expect(calls.openExternal).toHaveBeenCalledWith(`${REPOSITORY}/issues`);
    click(find(menu, "Zoom out"));
    click(find(menu, "Actual size"));
    expect(calls.zoom.mock.calls).toEqual([[-1], [0]]);
  });

  it("reload and open the developer tools only while developing (reloading throws away the simulation)", () => {
    const roles = (dev: boolean) =>
      items(applicationMenu({ t: translator.for("en"), mac: false, dev, repository: REPOSITORY }, actions())).map((item) => item.role);
    expect(roles(false)).not.toContain("reload");
    expect(roles(false)).not.toContain("toggleDevTools");
    expect(roles(true)).toEqual(expect.arrayContaining(["reload", "toggleDevTools"]));
  });

  it("have the menu of the application on macOS, with «About» in it", () => {
    const menu = applicationMenu({ t: translator.for("en"), mac: true, dev: false, repository: REPOSITORY }, actions());
    expect(menu[0].label).toBe("THUMDER");
    expect(items(menu).filter((item) => item.role === "about")).toHaveLength(1);
  });

  it("let the tray show the window and keep it on top", () => {
    const show = vi.fn();
    const setAlwaysOnTop = vi.fn();
    const menu = trayMenu(translator.for("es"), { alwaysOnTop: true }, { show, setAlwaysOnTop });
    click(find(menu, "Mostrar THUMDER"));
    expect(show).toHaveBeenCalled();
    const onTop = find(menu, "Siempre encima");
    expect(onTop.checked).toBe(true);
    onTop.click?.({ checked: false } as never, undefined, {} as never);
    expect(setAlwaysOnTop).toHaveBeenCalledWith(false);
  });
});
