import { describe, expect, it } from "vitest";
import {
  assetOf,
  DOC_PAGES,
  DOC_SECTIONS,
  langOf,
  pageById,
  pathOf,
  prepareMarkdown,
  RAW,
  REPOSITORY,
  resolvePath,
  slug,
  withoutGitHubOnly,
  withoutTitle,
} from "./docs.catalog";

describe("the documentation", () => {
  const simulator = pageById("simulator")!;
  const readme = pageById("readme")!;
  const simulate = pageById("simulate")!;
  const windlx = pageById("windlx")!;

  it("has five parts, each page and each file once", () => {
    expect(DOC_SECTIONS.map((section) => section.id)).toEqual(["start", "use", "learn", "reference", "dev"]);
    const ids = DOC_PAGES.flatMap((page) => [page.id, ...(page.aliases ?? [])]);
    expect(new Set(ids).size).toBe(ids.length);
    const paths = DOC_PAGES.flatMap((page) => Object.values(page.paths));
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("has every page in Spanish and English, except the reference written in one language", () => {
    const single = DOC_PAGES.filter((page) => Object.keys(page.paths).length < 2).map((page) => page.id);
    expect(single).toEqual(["instruction-table", "instruction-set", "opcodes", "windlx"]);
    for (const page of DOC_PAGES.filter((page) => !single.includes(page.id))) {
      expect(page.paths.en).toBe(page.paths.es?.replace(/\.md$/, ".en.md"));
    }
  });

  it("opens the old links with the page that replaces them", () => {
    expect(pageById("start")?.id).toBe("first-steps");
    expect(pageById("breakpoints")?.id).toBe("simulate");
    expect(pageById("registers")?.id).toBe("views");
    expect(pageById("execution")?.id).toBe("pipeline");
    expect(pageById("simulator")).toBe(simulator);
    expect(pageById("nothing")).toBeNull();
    expect(pageById(null)).toBeNull();
  });

  it("shows a page in the language of the application, or in the one it has", () => {
    expect(langOf(simulate, "en")).toBe("en");
    expect(pathOf(simulate, "en")).toBe("docs/guide/simular.en.md");
    expect(pathOf(simulate, "es")).toBe("docs/guide/simular.md");
    expect(langOf(windlx, "en")).toBe("es");
    expect(pathOf(windlx, "en")).toBe("docs/manual-simulador-dlx.md");
    expect(langOf(pageById("opcodes")!, "es")).toBe("en");
  });

  it("finds the files of the repository where the build serves them", () => {
    expect(resolvePath("docs/simulador.md", "../README.md")).toBe("README.md");
    expect(resolvePath("README.md", "docs/simulador.md")).toBe("docs/simulador.md");
    expect(resolvePath("docs/guide/vistas.md", "./img/pipeline.png")).toBe("docs/guide/img/pipeline.png");
    expect(assetOf("docs/guide/img/pipeline.en.png")).toBe("assets/docs/guide/img/pipeline.en.png");
    expect(assetOf("README.en.md")).toBe("assets/md/README.en.md");
    expect(assetOf("docs/manual-simulador-dlx/01-iconos.png")).toBe("assets/docs/manual-simulador-dlx/01-iconos.png");
    expect(assetOf("src/assets/docs.md")).toBe("assets/docs.md");
    expect(assetOf("CONTRIBUTING.md")).toBe("assets/md/CONTRIBUTING.md");
    expect(assetOf("scripts/changelog.mjs")).toBe(`${REPOSITORY}scripts/changelog.mjs`);
    expect(assetOf("assets/favicon.256x256.png")).toBe("assets/favicon.256x256.png");
    expect(assetOf("assets/screenshots/pipeline.png")).toBe("assets/screenshots/pipeline.png");
  });

  it("makes the links between pages open them in THUMDER, and the images point to the build", () => {
    const text = prepareMarkdown(
      "[manual](manual-simulador-dlx.md#notas) ![x](manual-simulador-dlx/01-iconos.png \"Iconos\") [web](https://example.org) [arriba](#top) [script](../scripts/changelog.mjs) <img src=\"manual-simulador-dlx/02.jpg\">",
      simulator,
      "es",
    );
    expect(text).toContain("[manual](/auth/documentation?page=windlx#notas)");
    expect(text).toContain('![x](assets/docs/manual-simulador-dlx/01-iconos.png "Iconos")');
    expect(text).toContain("[web](https://example.org)");
    expect(text).toContain("[arriba](#top)");
    expect(text).toContain(`[script](${REPOSITORY}scripts/changelog.mjs)`);
    expect(text).toContain('<img src="assets/docs/manual-simulador-dlx/02.jpg">');
    // An image the build does not copy comes from GitHub as it is (not its page)
    expect(prepareMarkdown("![logo](../images/logo.svg)", simulator, "es")).toBe(`![logo](${RAW}images/logo.svg)`);
    expect(prepareMarkdown("[c](CONTRIBUTING.md) [s](docs/simulador.md)", readme, "es")).toBe(
      "[c](/auth/documentation?page=contributing) [s](/auth/documentation?page=simulator)",
    );
  });

  it("makes the links of a page in English open the pages too, from the folder of its file", () => {
    expect(
      prepareMarkdown(
        "[v](vistas.en.md#pipeline) [s](../superdlx.en.md) [t](../../DLX-TABLE-Instructions.md) [m](../manual-simulador-dlx.md) ![p](img/pipeline.en.png)",
        simulate,
        "en",
      ),
    ).toBe(
      "[v](/auth/documentation?page=views#pipeline) [s](/auth/documentation?page=superdlx) [t](/auth/documentation?page=instruction-table) [m](/auth/documentation?page=windlx) ![p](assets/docs/guide/img/pipeline.en.png)",
    );
    expect(prepareMarkdown("[c](CONTRIBUTING.en.md) <img src=\"./docs/guide/img/datapath.en.png\">", readme, "en")).toBe(
      '[c](/auth/documentation?page=contributing) <img src="assets/docs/guide/img/datapath.en.png">',
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

describe("withoutGitHubOnly", () => {
  it("removes what only makes sense on GitHub (the badges of the README)", () => {
    const markdown = "# T\n\n<!-- github-only -->\n<p><img src=\"https://img.shields.io/x\"/></p>\n<!-- /github-only -->\n\nText";
    expect(withoutGitHubOnly(markdown)).toBe("# T\n\nText");
    expect(withoutGitHubOnly("Text")).toBe("Text");
  });
});
