import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { Translator } from "./i18n";

// The translations of THUMDER, the same ones the page uses
const I18N = path.join(__dirname, "..", "..", "src", "assets", "i18n");

describe("The texts of the window", () => {
  it("come from the translations of THUMDER", () => {
    const translator = new Translator(I18N);
    expect(translator.for("es")("DESKTOP.MENU.HELP")).toBe("Ayuda");
    expect(translator.for("en")("DESKTOP.MENU.HELP")).toBe("Help");
    expect(translator.has("es")).toBe(true);
    expect(translator.has("xx")).toBe(false);
  });

  it("take what a language does not have from the fallback one, and if not, show the key", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "thumder-i18n-"));
    try {
      fs.writeFileSync(path.join(dir, "en.json"), JSON.stringify({ DESKTOP: { MENU: { EDIT: "Edit", VIEW: "View" } } }));
      fs.writeFileSync(path.join(dir, "es.json"), JSON.stringify({ DESKTOP: { MENU: { EDIT: "Edición" } } }));
      const t = new Translator(dir, "en").for("es");
      expect(t("DESKTOP.MENU.EDIT")).toBe("Edición");
      expect(t("DESKTOP.MENU.VIEW")).toBe("View");
      expect(t("DESKTOP.MENU.HELP")).toBe("DESKTOP.MENU.HELP");
      // A section is not a text
      expect(t("DESKTOP.MENU")).toBe("DESKTOP.MENU");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("never read a file out of the folder of the translations", () => {
    const translator = new Translator(I18N);
    expect(translator.has("../../../package")).toBe(false);
    expect(translator.for("../i18n/es")("DESKTOP.MENU.HELP")).toBe("Help");
  });
});
