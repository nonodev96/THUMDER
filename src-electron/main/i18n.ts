// The texts of the window (its menu and the one of the tray) come from the translations of THUMDER, the same files the
// page uses (src/assets/i18n/<lang>.json), in their section DESKTOP: one place for all the texts, with the same keys in
// every language (src/app/i18n.spec.ts)
import * as fs from "node:fs";
import * as path from "node:path";
import { isLanguageCode } from "./validation";

type Translations = { readonly [key: string]: string | Translations };

/** A function that gives the text of a key ("DESKTOP.MENU.EDIT") */
export type Translate = (key: string) => string;

export class Translator {
  private readonly cache = new Map<string, Translations | null>();

  /**
   * @param dir The folder of the translations (assets/i18n)
   * @param fallback The language of the texts that a language does not have
   */
  constructor(
    private readonly dir: string,
    private readonly fallback = "en",
  ) {}

  /** Whether THUMDER has this language */
  public has(lang: string): boolean {
    return this.load(lang) !== null;
  }

  /** The texts of a language: those it does not have, in the fallback language, and if not, the key */
  public for(lang: string): Translate {
    const texts = this.load(lang);
    const fallback = this.load(this.fallback);
    return (key) => lookup(texts, key) ?? lookup(fallback, key) ?? key;
  }

  private load(lang: string): Translations | null {
    if (!isLanguageCode(lang)) return null;
    let texts = this.cache.get(lang);
    if (texts === undefined) {
      try {
        texts = JSON.parse(fs.readFileSync(path.join(this.dir, `${lang}.json`), "utf8")) as Translations;
      } catch {
        texts = null;
      }
      this.cache.set(lang, texts);
    }
    return texts;
  }
}

function lookup(texts: Translations | null, key: string): string | undefined {
  let value: string | Translations | undefined = texts ?? undefined;
  for (const part of key.split(".")) {
    if (typeof value !== "object") return undefined;
    value = value[part];
  }
  return typeof value === "string" ? value : undefined;
}
