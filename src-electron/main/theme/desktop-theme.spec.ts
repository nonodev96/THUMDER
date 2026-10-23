import { describe, expect, it } from "vitest";
import { type ReadSetting, readDesktopDark } from "./desktop-theme";

/** gsettings with these values ("" for the keys the desktop does not have) */
const desktop =
  (values: Record<string, string>): ReadSetting =>
  async (schema, key) =>
    values[`${schema} ${key}`] ?? "";

describe("The theme of the desktop on Linux", () => {
  it("is dark with dark panels in Cinnamon, although the applications are light (Linux Mint)", async () => {
    const mint = desktop({
      "org.cinnamon.desktop.interface gtk-theme": "'Mint-Y-Aqua'",
      "org.cinnamon.theme name": "'Mint-Y-Dark-Aqua'",
      "org.x.apps.portal color-scheme": "'default'",
    });
    expect(await readDesktopDark(mint)).toBe(true);
  });

  it("is dark with the preference of dark applications (GNOME)", async () => {
    expect(await readDesktopDark(desktop({ "org.gnome.desktop.interface color-scheme": "'prefer-dark'" }))).toBe(true);
  });

  it("is light when nothing says it is dark, or without gsettings", async () => {
    const light = desktop({
      "org.gnome.desktop.interface color-scheme": "'default'",
      "org.gnome.desktop.interface gtk-theme": "'Adwaita'",
      "org.mate.interface gtk-theme": "'Menta'",
    });
    expect(await readDesktopDark(light)).toBe(false);
    expect(await readDesktopDark(desktop({}))).toBe(false);
  });
});
