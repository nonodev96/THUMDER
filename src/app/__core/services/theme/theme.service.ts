import { computed, DOCUMENT, effect, Injectable, inject, signal } from "@angular/core";
import { cssColourNumber } from "./palette";

export type ThemeChoice = "light" | "dark" | "system";

const KEY = "theme";
const CHOICES: ThemeChoice[] = ["light", "dark", "system"];

/**
 * The theme of THUMDER (UI-07): light, dark or the one of the system (prefers-color-scheme, the default). The dark one
 * is `data-theme="dark"` on the html element (the variables of theme.scss) and the `dark-mode` of AdminLTE on the
 * body; Monaco, the canvases and the views of THUMDER follow `dark`.
 */
@Injectable({ providedIn: "root" })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly media = this.document.defaultView?.matchMedia?.("(prefers-color-scheme: dark)") ?? null;
  private readonly systemDark = signal(this.media?.matches ?? false);

  public readonly choice = signal<ThemeChoice>(ThemeService.saved());
  public readonly dark = computed(() => this.choice() === "dark" || (this.choice() === "system" && this.systemDark()));

  constructor() {
    this.media?.addEventListener?.("change", (event) => {
      this.systemDark.set(event.matches);
      this.apply();
    });
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
