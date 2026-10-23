import { describe, expect, it } from "vitest";
import { PALETTES, resolveTheme, ThemeController, type ThemeState } from "./theme";

/** The nativeTheme of Electron: Chromium follows the desktop while themeSource is «system» */
class FakeNativeTheme {
  public themeSource: "system" | "light" | "dark" = "system";
  private listener: (() => void) | undefined;

  constructor(private desktopDark: boolean) {}

  public get shouldUseDarkColors(): boolean {
    return this.themeSource === "system" ? this.desktopDark : this.themeSource === "dark";
  }

  public on(_event: "updated", listener: () => void): this {
    this.listener = listener;
    return this;
  }

  /** The desktop changes its preference (the portal, the GTK theme) */
  public setDesktopDark(dark: boolean): void {
    this.desktopDark = dark;
    this.listener?.();
  }
}

describe("The theme of the window", () => {
  it("follows the choice, and with «system» the desktop", () => {
    expect(resolveTheme("dark", false, false)).toMatchObject({ dark: true, palette: PALETTES.dark, themeSource: "dark" });
    expect(resolveTheme("light", true, true)).toMatchObject({ dark: false, systemDark: true, palette: PALETTES.light, themeSource: "light" });
    expect(resolveTheme("system", true, false)).toMatchObject({ dark: true, themeSource: "system" });
    expect(resolveTheme("system", false, false)).toMatchObject({ dark: false, themeSource: "system" });
  });

  it("makes Chromium dark when only the theme of the desktop says it (Cinnamon with dark panels)", () => {
    expect(resolveTheme("system", false, true)).toMatchObject({ dark: true, systemDark: true, themeSource: "dark" });
  });

  it("tells who listens when the choice or the desktop change it, and sets the theme of Chromium", () => {
    const native = new FakeNativeTheme(false);
    const theme = new ThemeController(native, "system");
    const states: ThemeState[] = [];
    theme.onChange((state) => states.push(state));

    native.setDesktopDark(true);
    expect(states.at(-1)).toMatchObject({ dark: true, systemDark: true });

    theme.setChoice("light");
    expect(native.themeSource).toBe("light");
    expect(states.at(-1)).toMatchObject({ dark: false, systemDark: true });

    theme.setChoice("system");
    native.setDesktopDark(false);
    expect(native.themeSource).toBe("system");
    expect(theme.state).toMatchObject({ dark: false, systemDark: false });

    theme.setDesktopDark(true);
    expect(native.themeSource).toBe("dark");
    expect(states.at(-1)).toMatchObject({ dark: true, systemDark: true });
  });

  it("says nothing when nothing changes", () => {
    const native = new FakeNativeTheme(true);
    const theme = new ThemeController(native, "dark");
    let changes = 0;
    theme.onChange(() => changes++);
    theme.setChoice("dark");
    theme.setDesktopDark(false);
    expect(changes).toBe(0);
  });
});
