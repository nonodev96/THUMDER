// The documentation of THUMDER, in five parts: getting started, using it, learning DLX, the reference and how it is made.
// Each page is a Markdown file of the repository for each language it is written in (`paths`): `x.md` in Spanish and
// `x.en.md` in English. The build copies them to the assets (angular.json), and assetOf() gives the URL of each one. The
// links between them, written as paths of the repository, open the page of the documentation in the language shown.

export type DocLang = "es" | "en";

export type DocPage = {
  id: string;
  /** Its title (a text of DOCS.PAGES) */
  title: string;
  /** Where it is in the repository, in each language it is written in */
  paths: Partial<Record<DocLang, string>>;
  /** A page that THUMDER draws itself, in the language of the application, instead of its Markdown file */
  view?: "instruction-table";
  /** The file the page is made from, for its link to GitHub (its path if it has none) */
  source?: string;
  /** The ids of the pages it replaces, so that their links still open it */
  aliases?: string[];
};

export type DocSection = {
  id: "start" | "use" | "learn" | "reference" | "dev";
  title: string;
  description: string;
  icon: string;
  pages: DocPage[];
};

const titleOf = (id: string) => `DOCS.PAGES.${id.toUpperCase().replace(/-/g, "_")}`;

/** A page in Spanish (`path.md`) and in English (`path.en.md`) */
const page = (id: string, path: string, aliases?: string[]): DocPage => ({
  id,
  title: titleOf(id),
  paths: { es: `${path}.md`, en: `${path}.en.md` },
  ...(aliases ? { aliases } : {}),
});

/** A page written in one language only */
const only = (id: string, path: string, lang: DocLang): DocPage => ({ id, title: titleOf(id), paths: { [lang]: path } });

export const DOC_SECTIONS: DocSection[] = [
  {
    id: "start",
    title: "DOCS.SECTIONS.START",
    description: "DOCS.SECTIONS.START_HELP",
    icon: "fa-flag-checkered",
    pages: [
      page("what-is", "docs/guide/que-es-thumder"),
      page("first-steps", "docs/guide/primeros-pasos", ["start"]),
      page("install", "docs/guide/instalar"),
    ],
  },
  {
    id: "use",
    title: "DOCS.SECTIONS.USE",
    description: "DOCS.SECTIONS.USE_HELP",
    icon: "fa-play-circle",
    pages: [
      page("files", "docs/guide/ficheros-y-editor", ["editor"]),
      page("simulate", "docs/guide/simular", ["process", "breakpoints"]),
      page("views", "docs/guide/vistas", ["registers", "memory", "code", "diagram", "statistics", "multiview"]),
      page("config", "docs/guide/configuracion"),
      page("account", "docs/guide/cuenta"),
      page("faq", "docs/guide/preguntas"),
    ],
  },
  {
    id: "learn",
    title: "DOCS.SECTIONS.LEARN",
    description: "DOCS.SECTIONS.LEARN_HELP",
    icon: "fa-graduation-cap",
    pages: [
      page("pipeline", "docs/guide/pipeline", ["execution"]),
      page("superdlx", "docs/superdlx"),
      page("examples", "docs/ejemplos-dlx"),
      page("exercises", "docs/guide/ejercicios"),
    ],
  },
  {
    id: "reference",
    title: "DOCS.SECTIONS.REFERENCE",
    description: "DOCS.SECTIONS.REFERENCE_HELP",
    icon: "fa-book",
    pages: [
      // Made from the definitions of the engine: what THUMDER assembles and simulates
      {
        ...only("instruction-table", "DLX-TABLE-Instructions.md", "en"),
        view: "instruction-table",
        source: "src/app/__core/engine/isa.ts",
      },
      only("instruction-set", "src/assets/docs.md", "en"),
      only("opcodes", "src/assets/dlxmap.md", "en"),
      only("windlx", "docs/manual-simulador-dlx.md", "es"),
    ],
  },
  {
    id: "dev",
    title: "DOCS.SECTIONS.DEV",
    description: "DOCS.SECTIONS.DEV_HELP",
    icon: "fa-code",
    pages: [
      page("readme", "README"),
      page("contributing", "CONTRIBUTING"),
      page("simulator", "docs/simulador"),
      page("mobile", "docs/movil"),
    ],
  },
];

export const DOC_PAGES: DocPage[] = DOC_SECTIONS.flatMap((section) => section.pages);

/** The page with that id, or the one that replaces it */
export function pageById(id: string | null | undefined): DocPage | null {
  if (!id) return null;
  return DOC_PAGES.find((page) => page.id === id) ?? DOC_PAGES.find((page) => page.aliases?.includes(id)) ?? null;
}

/** The language a page is shown in: the one asked for if it is written in it, if not the one it has */
export function langOf(page: DocPage, lang: string): DocLang {
  if (lang in page.paths) return lang as DocLang;
  return Object.keys(page.paths)[0] as DocLang;
}

/** The file of a page in a language (or in the one it has) */
export function pathOf(page: DocPage, lang: string): string {
  return page.paths[langOf(page, lang)] as string;
}

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
export function prepareMarkdown(markdown: string, page: DocPage, lang: string): string {
  const from = pathOf(page, lang);
  const link = (target: string, image: boolean): string => {
    if (ABSOLUTE.test(target)) return target;
    const [file, anchor] = target.split("#");
    const path = resolvePath(from, file);
    if (image) {
      const asset = assetOf(path);
      return asset.startsWith(REPOSITORY) ? `${RAW}${path}` : asset;
    }
    const other = DOC_PAGES.find((candidate) => Object.values(candidate.paths).includes(path));
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
