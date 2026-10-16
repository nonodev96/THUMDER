import { describe, expect, it } from "vitest";
import en from "../assets/i18n/en.json";
import es from "../assets/i18n/es.json";

type Translations = { [key: string]: string | Translations };

const keys = (translations: Translations, prefix = ""): string[] =>
  Object.entries(translations).flatMap(([key, value]) =>
    typeof value === "string" ? [`${prefix}${key}`] : keys(value, `${prefix}${key}.`),
  );

describe("Translations", () => {
  it("have the same keys in English and Spanish", () => {
    expect(keys(es as Translations).sort()).toEqual(keys(en as Translations).sort());
  });
});
