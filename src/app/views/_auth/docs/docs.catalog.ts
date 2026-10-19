// The documentation of THUMDER, in three parts: how to use it, the DLX architecture and how it is made. Each page is a
// Markdown file of the repository (`path`); the build copies them to the assets (angular.json), and assetOf() gives the
// URL of each one. The links between them, written as paths of the repository, open the page of the documentation.

export type DocPage = {
  id: string;
  /** Its title (a text of DOCS.PAGES) */
  title: string;
  /** Where it is in the repository */
  path: string;
  lang: "es" | "en";
  /** A page that THUMDER draws itself, in the language of the application, instead of its Markdown file */
  view?: "instruction-table";
  /** The file the page is made from, for its link to GitHub (`path` if it has none) */
  source?: string;
};

export type DocSection = { id: "use" | "dlx" | "dev"; title: string; description: string; icon: string; pages: DocPage[] };

const page = (id: string, path: string, lang: "es" | "en" = "es"): DocPage => ({
  id,
  title: `DOCS.PAGES.${id.toUpperCase().replace(/-/g, "_")}`,
  path,
  lang,
});

export const DOC_SECTIONS: DocSection[] = [
  {
    id: "use",
    title: "DOCS.SECTIONS.USE",
    description: "DOCS.SECTIONS.USE_HELP",
    icon: "fa-play-circle",
    pages: [
      page("start", "docs/primeros-pasos.md"),
      page("install", "wiki/0.Installation.md"),
      page("account", "wiki/00.Account.md"),
      page("files", "wiki/09.FileManager.md"),
      page("editor", "wiki/10.FileEditor.md"),
      page("process", "wiki/07.TheExecutionProcess.md"),
      page("breakpoints", "wiki/06.TheBreakpoints.md"),
      page("config", "wiki/08.TheConfiguration.md"),
      page("registers", "wiki/01.TheRegisterWindow.md"),
      page("memory", "wiki/02.TheMemoryWindow.md"),
      page("code", "wiki/03.TheCodeWindow.md"),
      page("pipeline", "wiki/04.ThePipelineWindow.md"),
      page("diagram", "wiki/04.TheClockCycleDiagramWindow.md"),
      page("statistics", "wiki/05.TheStatisticsWindow.md"),
      page("multiview", "wiki/11.Multiview.md"),
    ],
  },
  {
    id: "dlx",
    title: "DOCS.SECTIONS.DLX",
    description: "DOCS.SECTIONS.DLX_HELP",
    icon: "fa-microchip",
    pages: [
      page("execution", "wiki/00.TheExecutionOfInstructions.md"),
      page("examples", "docs/ejemplos-dlx.md"),
      page("windlx", "docs/manual-simulador-dlx.md"),
      page("instruction-set", "src/assets/docs.md", "en"),
      page("opcodes", "src/assets/dlxmap.md", "en"),
      // Made from the definitions of the engine: what THUMDER assembles and simulates
      {
        ...page("instruction-table", "DLX-TABLE-Instructions.md", "en"),
        view: "instruction-table",
        source: "src/app/__core/engine/isa.ts",
      },
    ],
  },
  {
    id: "dev",
    title: "DOCS.SECTIONS.DEV",
    description: "DOCS.SECTIONS.DEV_HELP",
    icon: "fa-code",
    pages: [page("readme", "README.md"), page("contributing", "CONTRIBUTING.md"), page("simulator", "docs/simulador.md")],
  },
];

export const DOC_PAGES: DocPage[] = DOC_SECTIONS.flatMap((section) => section.pages);

/** The repository, to open what is not part of the documentation (a licence, a script...) */
export const REPOSITORY = "https://github.com/nonodev96/THUMDER/blob/dev/";
/** The files of the repository as they are, for the images that the build does not copy */
export const RAW = "https://raw.githubusercontent.com/nonodev96/THUMDER/dev/";

export function sectionOf(page: DocPage): DocSection {
  return DOC_SECTIONS.find((section) => section.pages.includes(page)) as DocSection;
}

/** A path of the repository relative to the folder of another one: "../README.md" from "docs/x.md" is "README.md" */
export function resolvePath(from: string, relative: string): string {
  const parts = from.split("/").slice(0, -1);
  for (const part of relative.split("/")) {
    if (part === "..") parts.pop();
    else if (part !== "." && part !== "") parts.push(part);
  }
  return parts.join("/");
}

/** Where the build serves a file of the repository (angular.json: assets) */
export function assetOf(path: string): string {
  if (path.startsWith("wiki/wiki-assets/")) return path.slice("wiki/".length);
  if (path.startsWith("wiki/")) return `assets/${path}`;
  if (path.startsWith("docs/")) return `assets/${path}`;
  if (path.startsWith("src/assets/")) return path.slice("src/".length);
  // The images of the root folder assets/ and of its screenshots (angular.json copies their PNG files)
  if (/^assets\/(screenshots\/)?[^/]+\.png$/i.test(path)) return path;
  if (!path.includes("/")) return `assets/md/${path}`;
  return `${REPOSITORY}${path}`;
}

const ABSOLUTE = /^([a-z][a-z0-9+.-]*:|\/\/|\/|#)/i;

/**
 * A page ready to show: its images point to where the build serves them, and its links to other pages of the
 * documentation open them (`/auth/documentation?page=…`); the other files of the repository open in GitHub
 */
export function prepareMarkdown(markdown: string, page: DocPage): string {
  const link = (target: string, image: boolean): string => {
    if (ABSOLUTE.test(target)) return target;
    const [file, anchor] = target.split("#");
    const path = resolvePath(page.path, file);
    if (image) {
      const asset = assetOf(path);
      return asset.startsWith(REPOSITORY) ? `${RAW}${path}` : asset;
    }
    const other = DOC_PAGES.find((candidate) => candidate.path === path);
    if (other) return `/auth/documentation?page=${other.id}${anchor ? `#${anchor}` : ""}`;
    return `${REPOSITORY}${path}${anchor ? `#${anchor}` : ""}`;
  };
  return withoutTitle(withoutGitHubOnly(markdown))
    .replace(/(!?)\[([^\]]*)\]\(([^)\s]+)((?:\s+"[^"]*")?)\)/g, (_, bang: string, text: string, target: string, title: string) => {
      return `${bang}[${text}](${link(target, bang === "!")}${title})`;
    })
    .replace(/(<img\b[^>]*\bsrc=")([^"]+)(")/gi, (_, start: string, target: string, end: string) => `${start}${link(target, true)}${end}`);
}

/**
 * The text without what only makes sense on GitHub (the badges of the README, images of other sites that the Content
 * Security Policy of THUMDER does not load): a block between `<!-- github-only -->` and `<!-- /github-only -->`
 */
export function withoutGitHubOnly(markdown: string): string {
  return markdown.replace(/<!--\s*github-only\s*-->[\s\S]*?<!--\s*\/github-only\s*-->\s*/g, "");
}

/** The text without its first title (# Title, or Title and ===): the page shows its own */
export function withoutTitle(markdown: string): string {
  return markdown.replace(/^\s*(#\s[^\n]*|[^\n]+\n=+[ \t]*)(\n|$)/, "");
}

/** The id of a heading, as GitHub makes it, so that the links to a section (#notation) work */
export function slug(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/\s/g, "-");
}
