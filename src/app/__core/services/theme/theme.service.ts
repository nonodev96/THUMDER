import { computed, DOCUMENT, effect, Injectable, inject, NgZone, signal } from "@angular/core";
import { desktopBridge } from "@core/services/electron/electron.service";
import { cssColourNumber } from "./palette";

export type ThemeChoice = "light" | "dark" | "system";

const KEY = "theme";
const CHOICES: ThemeChoice[] = ["light", "dark", "system"];

/**
 * The theme of THUMDER (UI-07): light, dark or the one of the system (prefers-color-scheme, the default). The dark one
 * is `data-theme="dark"` on the html element (the variables of theme.scss) and the `dark-mode` of AdminLTE on the
 * body; Monaco, the canvases and the views of THUMDER follow `dark`.
 *
 * In the desktop application the system is the desktop as main.ts sees it (on Linux, also the theme of its panels,
 * which Chromium does not read), and the choice goes to main.ts: the window, its buttons and its menus follow it.
 */
@Injectable({ providedIn: "root" })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly bridge = desktopBridge();
  // In the desktop application the system is the one main.ts sees (prefers-color-scheme there follows the choice)
  private readonly media = this.bridge ? null : (this.document.defaultView?.matchMedia?.("(prefers-color-scheme: dark)") ?? null);
  private readonly systemDark = signal(this.bridge ? this.bridge.systemDark : (this.media?.matches ?? false));

  public readonly choice = signal<ThemeChoice>(ThemeService.saved());
  public readonly dark = computed(() => this.choice() === "dark" || (this.choice() === "system" && this.systemDark()));

  constructor() {
    this.media?.addEventListener?.("change", (event) => {
      this.systemDark.set(event.matches);
      this.apply();
    });
    const zone = inject(NgZone);
    this.bridge?.onSystemDark((dark) =>
      zone.run(() => {
        this.systemDark.set(dark);
        this.apply();
      }),
    );
    this.apply();
    effect(() => this.apply());
  }

  /**
   * The theme on the page. It is applied as soon as it changes (not only in the effect), so the canvases that redraw
   * with the change already read the colours of the new one
   */
  private apply(): void {
    const dark = this.dark();
    this.document.body.classList.toggle("dark-mode", dark);
    this.document.documentElement.dataset.theme = dark ? "dark" : "light";
    // The scrollbars, the inputs and the menus of the browser
    this.document.documentElement.style.colorScheme = dark ? "dark" : "light";
    // The bar of the system on a phone, with the colour of the navbar
    for (const meta of this.document.querySelectorAll('meta[name="theme-color"]'))
      meta.setAttribute("content", dark ? "#1e293b" : "#ffffff");
    // The desktop application: the window and its buttons with the colours of the theme
    this.bridge?.setPreferences({ theme: this.choice() });
  }

  /** A colour of theme.scss that changes with the theme (`--thumder-<name>-light` or `-dark`), as a number for PixiJS */
  public colour(name: string, light: string, dark: string): number {
    return this.dark() ? cssColourNumber(`${name}-dark`, dark) : cssColourNumber(`${name}-light`, light);
  }

  private static saved(): ThemeChoice {
    try {
      const value = localStorage.getItem(KEY) as ThemeChoice | null;
      return value && CHOICES.includes(value) ? value : "system";
    } catch {
      return "system";
    }
  }

  public set(choice: ThemeChoice): void {
    try {
      localStorage.setItem(KEY, choice);
    } catch {
      // Without storage the choice lasts until the page closes
    }
    this.choice.set(choice);
    this.apply();
  }
}
