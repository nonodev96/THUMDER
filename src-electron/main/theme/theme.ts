// The theme of the window: it follows the one chosen in THUMDER and, with «system», the one of the desktop. Chromium
// reads the preference of the portal and the GTK theme; on Linux THUMDER also reads the theme of the desktop itself
// (desktop-theme.ts), whose panels can be dark with light applications. The native parts of the window (menus,
// scrollbars, dialogs, the buttons of the window) follow it through `nativeTheme.themeSource`.
import type { NativeTheme } from "electron";
import type { ThemeChoice } from "../../shared/contract";

/** The colours of the window: the navbar (--thumder-surface), its text (--thumder-text) and the page (--thumder-bg) of src/theme.scss */
export interface Palette {
  readonly bar: string;
  readonly symbol: string;
  readonly background: string;
}

export const PALETTES: Readonly<Record<"light" | "dark", Palette>> = {
  light: { bar: "#ffffff", symbol: "#0f172a", background: "#f1f5f9" },
  dark: { bar: "#1e293b", symbol: "#e2e8f0", background: "#0f172a" },
};

export interface ThemeState {
  /** Whether the desktop is dark, for the page when its choice is «system» */
  readonly systemDark: boolean;
  /** Whether the window is dark */
  readonly dark: boolean;
  readonly palette: Palette;
  /** What Chromium follows: the choice, or the desktop (forced to dark when only the theme of the desktop says it) */
  readonly themeSource: NativeTheme["themeSource"];
}

/**
 * The theme from the choice of THUMDER, what Chromium sees (nativeDark) and what the desktop says that Chromium does
 * not read (desktopDark)
 */
export function resolveTheme(choice: ThemeChoice, nativeDark: boolean, desktopDark: boolean): ThemeState {
  const systemDark = nativeDark || desktopDark;
  const dark = choice === "dark" || (choice === "system" && systemDark);
  return {
    systemDark,
    dark,
    palette: dark ? PALETTES.dark : PALETTES.light,
    themeSource: choice !== "system" ? choice : desktopDark && !nativeDark ? "dark" : "system",
  };
}

/** What the controller uses of the `nativeTheme` of Electron */
export interface NativeThemeSource {
  themeSource: NativeTheme["themeSource"];
  readonly shouldUseDarkColors: boolean;
  on(event: "updated", listener: () => void): unknown;
}

/** The theme while THUMDER is open: the choice and the desktop change it, and whoever listens follows it */
export class ThemeController {
  private choice: ThemeChoice;
  private nativeDark: boolean;
  private desktopDark = false;
  private readonly listeners = new Set<(state: ThemeState) => void>();

  constructor(
    private readonly nativeTheme: NativeThemeSource,
    choice: ThemeChoice,
  ) {
    this.choice = choice;
    // Read before THUMDER chooses for Chromium
    this.nativeDark = nativeTheme.shouldUseDarkColors;
    nativeTheme.on("updated", () => {
      // What the desktop says, only while Chromium follows it (not while THUMDER chooses for it)
      if (this.nativeTheme.themeSource !== "system") return;
      this.setNativeDark(this.nativeTheme.shouldUseDarkColors);
    });
    this.apply();
  }

  public get state(): ThemeState {
    return resolveTheme(this.choice, this.nativeDark, this.desktopDark);
  }

  public setChoice(choice: ThemeChoice): void {
    if (choice === this.choice) return;
    this.choice = choice;
    this.changed();
  }

  /** Linux: what the theme of the desktop says (desktop-theme.ts) */
  public setDesktopDark(dark: boolean): void {
    if (dark === this.desktopDark) return;
    this.desktopDark = dark;
    this.changed();
  }

  /** It returns what stops listening */
  public onChange(listener: (state: ThemeState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setNativeDark(dark: boolean): void {
    if (dark === this.nativeDark) return;
    this.nativeDark = dark;
    this.changed();
  }

  private changed(): void {
    this.apply();
    const state = this.state;
    for (const listener of this.listeners) listener(state);
  }

  private apply(): void {
    const { themeSource } = this.state;
    if (this.nativeTheme.themeSource !== themeSource) this.nativeTheme.themeSource = themeSource;
  }
}
