// What comes from outside the main process (the page, desktop.json) is checked here before it is used
import type { Rectangle } from "electron";
import type { Preferences, ThemeChoice } from "../shared/contract";

export const THEME_CHOICES: readonly ThemeChoice[] = ["light", "dark", "system"];

/** The navbar is between these heights (pixels of the page): anything else is not a navbar */
export const TITLE_BAR_LIMITS = { min: 16, max: 200 } as const;

export function isThemeChoice(value: unknown): value is ThemeChoice {
  return THEME_CHOICES.includes(value as ThemeChoice);
}

/** The code of a language ("es", "en", "pt-BR"): it names a file of the translations, so nothing else gets through */
export function isLanguageCode(value: unknown): value is string {
  return typeof value === "string" && /^[a-z]{2,3}(-[A-Z]{2})?$/.test(value);
}

export function isRectangle(value: unknown): value is Rectangle {
  if (typeof value !== "object" || value === null) return false;
  const { x, y, width, height } = value as Record<string, unknown>;
  return [x, y, width, height].every((n) => typeof n === "number" && Number.isFinite(n));
}

export function isTitleBarHeight(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= TITLE_BAR_LIMITS.min && value <= TITLE_BAR_LIMITS.max;
}

/** The preferences sent by the page, with only what is valid */
export function parsePreferences(value: unknown): Preferences {
  if (typeof value !== "object" || value === null) return {};
  const { theme, lang, titleBar } = value as Record<string, unknown>;
  return {
    ...(isThemeChoice(theme) ? { theme } : {}),
    ...(isLanguageCode(lang) ? { lang } : {}),
    ...(isTitleBarHeight(titleBar) ? { titleBar } : {}),
  };
}
