import { computed, DOCUMENT, effect, Injectable, inject, signal } from "@angular/core";

export type ThemeChoice = "light" | "dark" | "system";

const KEY = "theme";
const CHOICES: ThemeChoice[] = ["light", "dark", "system"];

/**
 * The theme of THUMDER (UI-07): light, dark or the one of the system (prefers-color-scheme, the default). The dark one
 * is the `dark-mode` of AdminLTE on the body; Monaco, the canvases and the views of THUMDER follow `dark`.
 */
@Injectable({ providedIn: "root" })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly media = this.document.defaultView?.matchMedia?.("(prefers-color-scheme: dark)") ?? null;
  private readonly systemDark = signal(this.media?.matches ?? false);

  public readonly choice = signal<ThemeChoice>(ThemeService.saved());
  public readonly dark = computed(() => this.choice() === "dark" || (this.choice() === "system" && this.systemDark()));

  constructor() {
    this.media?.addEventListener?.("change", (event) => this.systemDark.set(event.matches));
    effect(() => {
      const dark = this.dark();
      this.document.body.classList.toggle("dark-mode", dark);
      // The scrollbars, the inputs and the menus of the browser
      this.document.documentElement.style.colorScheme = dark ? "dark" : "light";
    });
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
  }
}
