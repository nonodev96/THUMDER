import { describe, expect, it } from "vitest";
import { assetOf, DOC_PAGES, DOC_SECTIONS, prepareMarkdown, RAW, REPOSITORY, resolvePath, slug, withoutTitle } from "./docs.catalog";

describe("the documentation", () => {
  const simulator = DOC_PAGES.find((page) => page.id === "simulator")!;
  const readme = DOC_PAGES.find((page) => page.id === "readme")!;

  it("has three parts, each page once", () => {
    expect(DOC_SECTIONS.map((section) => section.id)).toEqual(["use", "dlx", "dev"]);
    expect(new Set(DOC_PAGES.map((page) => page.id)).size).toBe(DOC_PAGES.length);
    expect(new Set(DOC_PAGES.map((page) => page.path)).size).toBe(DOC_PAGES.length);
  });

  it("finds the files of the repository where the build serves them", () => {
    expect(resolvePath("docs/simulador.md", "../README.md")).toBe("README.md");
    expect(resolvePath("README.md", "docs/simulador.md")).toBe("docs/simulador.md");
    expect(resolvePath("wiki/01.TheRegisterWindow.md", "./wiki-assets/a.png")).toBe("wiki/wiki-assets/a.png");
    expect(assetOf("wiki/wiki-assets/a.png")).toBe("wiki-assets/a.png");
    expect(assetOf("wiki/07.TheExecutionProcess.md")).toBe("assets/wiki/07.TheExecutionProcess.md");
    expect(assetOf("docs/manual-simulador-dlx/01-iconos.png")).toBe("assets/docs/manual-simulador-dlx/01-iconos.png");
    expect(assetOf("src/assets/docs.md")).toBe("assets/docs.md");
    expect(assetOf("CONTRIBUTING.md")).toBe("assets/md/CONTRIBUTING.md");
    expect(assetOf("scripts/changelog.mjs")).toBe(`${REPOSITORY}scripts/changelog.mjs`);
    expect(assetOf("assets/favicon.256x256.png")).toBe("assets/favicon.256x256.png");
  });

  it("makes the links between pages open them in THUMDER, and the images point to the build", () => {
    const text = prepareMarkdown(
      "[manual](manual-simulador-dlx.md#notas) ![x](manual-simulador-dlx/01-iconos.png \"Iconos\") [web](https://example.org) [arriba](#top) [script](../scripts/changelog.mjs) <img src=\"manual-simulador-dlx/02.jpg\">",
      simulator,
    );
    expect(text).toContain("[manual](/auth/documentation?page=windlx#notas)");
    expect(text).toContain('![x](assets/docs/manual-simulador-dlx/01-iconos.png "Iconos")');
    expect(text).toContain("[web](https://example.org)");
    expect(text).toContain("[arriba](#top)");
    expect(text).toContain(`[script](${REPOSITORY}scripts/changelog.mjs)`);
    expect(text).toContain('<img src="assets/docs/manual-simulador-dlx/02.jpg">');
    // An image the build does not copy comes from GitHub as it is (not its page)
    expect(prepareMarkdown("![logo](../images/logo.svg)", simulator)).toBe(`![logo](${RAW}images/logo.svg)`);
    expect(prepareMarkdown("[c](CONTRIBUTING.md) [s](docs/simulador.md)", readme)).toBe(
      "[c](/auth/documentation?page=contributing) [s](/auth/documentation?page=simulator)",
    );
  });

  it("leaves out the first title of a page, which the page shows itself", () => {
    expect(withoutTitle("# Primeros pasos\n\nTexto")).toBe("\nTexto");
    expect(withoutTitle("Cookies\n=======\n\nTexto")).toBe("\nTexto");
    expect(withoutTitle("Texto\n\n# Otro")).toBe("Texto\n\n# Otro");
  });

  it("gives the headings the ids of GitHub", () => {
    expect(slug("Notes/Assumptions")).toBe("notesassumptions");
    expect(slug("1. Introducción al simulador WinDLX")).toBe("1-introducción-al-simulador-windlx");
  });
});
