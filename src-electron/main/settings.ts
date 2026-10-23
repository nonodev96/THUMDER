// What the desktop application remembers between sessions: userData/desktop.json
import * as fs from "node:fs";
import * as path from "node:path";
import type { Rectangle } from "electron";
import type { ThemeChoice } from "../shared/contract";
import { isLanguageCode, isRectangle, isThemeChoice } from "./validation";

export interface Settings {
  theme: ThemeChoice;
  lang: string;
  /** Where the window was and how big, when it was not maximized */
  bounds?: Rectangle;
  maximized: boolean;
}

/** The saved settings, with the defaults for what is missing or is not valid */
export function parseSettings(saved: unknown, defaults: Settings): Settings {
  const value = (typeof saved === "object" && saved !== null ? saved : {}) as Record<string, unknown>;
  return {
    theme: isThemeChoice(value.theme) ? value.theme : defaults.theme,
    lang: isLanguageCode(value.lang) ? value.lang : defaults.lang,
    bounds: isRectangle(value.bounds) ? value.bounds : defaults.bounds,
    maximized: typeof value.maximized === "boolean" ? value.maximized : defaults.maximized,
  };
}

/** The settings in a JSON file: they are written a moment after they change (a window that is moved changes them a lot) */
export class SettingsStore {
  private settings: Settings;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly file: string,
    defaults: Settings,
    private readonly delay = 500,
  ) {
    this.settings = parseSettings(SettingsStore.read(file), defaults);
  }

  public get value(): Readonly<Settings> {
    return this.settings;
  }

  public update(changes: Partial<Settings>): void {
    this.settings = { ...this.settings, ...changes };
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), this.delay);
  }

  /** Writes them now (when the window closes) */
  public flush(): void {
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      fs.writeFileSync(this.file, `${JSON.stringify(this.settings, null, 2)}\n`);
    } catch (error) {
      console.error("THUMDER: the settings of the window could not be saved", error);
    }
  }

  private static read(file: string): unknown {
    try {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
      return undefined;
    }
  }
}
