#!/usr/bin/env node
// Writes the GitHub wiki (the submodule wiki/) from the documentation of docs/: each page in Spanish and in English, a
// home page, a sidebar and a footer, with the links between pages and the screenshots made for the wiki. The wiki is
// generated: a page edited there by hand is replaced (or deleted) the next time. Then commit and push inside wiki/.
//
//   git submodule update --init wiki   (the first time)
//   pnpm run wiki
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, join, posix } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const WIKI = join(ROOT, "wiki");
const REPOSITORY = "https://github.com/nonodev96/THUMDER/blob/dev/";
const RAW = "https://raw.githubusercontent.com/nonodev96/THUMDER/dev/";
const APP = "https://thumder.netlify.app";
/** Where the screenshots of docs/guide/img go in the wiki */
const IMAGES = "wiki-assets/guide";
const LANGS = ["es", "en"];

/** The parts of the documentation, as in the application (docs.catalog.ts): each page with its name in the wiki */
const SECTIONS = [
  {
    title: { es: "Empezar", en: "Get started" },
    pages: [
      ["docs/guide/que-es-thumder", "Qué-es-THUMDER", "What-is-THUMDER"],
      ["docs/guide/primeros-pasos", "Primeros-pasos", "First-steps"],
      ["docs/guide/instalar", "Instalar-THUMDER", "Install-THUMDER"],
    ],
  },
  {
    title: { es: "Usar THUMDER", en: "Use THUMDER" },
    pages: [
      ["docs/guide/ficheros-y-editor", "Ficheros-y-editor", "Files-and-editor"],
      ["docs/guide/simular", "Simular-un-programa", "Simulate-a-program"],
      ["docs/guide/vistas", "Las-vistas", "The-views"],
      ["docs/guide/configuracion", "Configuración", "Settings"],
      ["docs/guide/cuenta", "Cuenta-y-privacidad", "Account-and-privacy"],
      ["docs/guide/preguntas", "Preguntas-frecuentes", "FAQ"],
    ],
  },
  {
    title: { es: "Aprender DLX", en: "Learn DLX" },
    pages: [
      ["docs/guide/pipeline", "El-pipeline-de-DLX", "The-DLX-pipeline"],
      ["docs/superdlx", "SuperDLX-el-DLX-superescalar", "SuperDLX-the-superscalar-DLX"],
      ["docs/ejemplos-dlx", "Ejemplos-comentados", "Commented-examples"],
      ["docs/guide/ejercicios", "Ejercicios", "Exercises"],
    ],
  },
  {
    title: { es: "Referencia", en: "Reference" },
    // Written in one language, or drawn by THUMDER: they stay in the application and in the repository
    links: [
      [{ es: "La tabla de instrucciones", en: "The instruction table" }, `${APP}/auth/documentation?page=instruction-table`],
      [{ es: "El juego de instrucciones (en inglés)", en: "The instruction set" }, `${REPOSITORY}src/assets/docs.md`],
      [{ es: "Los códigos de operación (en inglés)", en: "The opcodes" }, `${REPOSITORY}src/assets/dlxmap.md`],
      [{ es: "El manual de WinDLX", en: "The WinDLX manual (in Spanish)" }, `${REPOSITORY}docs/manual-simulador-dlx.md`],
    ],
  },
  {
    title: { es: "Desarrollo", en: "Development" },
    links: [
      [{ es: "El proyecto (README)", en: "The project (README)" }, { es: `${REPOSITORY}README.md`, en: `${REPOSITORY}README.en.md` }],
      [{ es: "Cómo contribuir", en: "How to contribute" }, { es: `${REPOSITORY}CONTRIBUTING.md`, en: `${REPOSITORY}CONTRIBUTING.en.md` }],
    ],
    pages: [
      ["docs/simulador", "El-simulador-por-dentro", "The-simulator-inside"],
      ["docs/movil", "Las-aplicaciones-de-Android-e-iOS", "The-Android-and-iOS-applications"],
    ],
  },
];

const PAGES = SECTIONS.flatMap((section) => section.pages ?? []).map(([base, es, en]) => ({
  files: { es: `${base}.md`, en: `${base}.en.md` },
  names: { es, en },
}));

/** The page of the wiki of a file of the repository, in its language */
function wikiPageOf(path) {
  for (const page of PAGES) {
    for (const lang of LANGS) if (page.files[lang] === path) return page.names[lang];
  }
  return null;
}

const read = (path) => readFileSync(join(ROOT, path), "utf8");
/** The first title of a file (# Title) */
const titleOf = (markdown) => markdown.match(/^#\s+(.+)$/m)?.[1].trim() ?? "";
const withoutTitle = (markdown) => markdown.replace(/^\s*#\s[^\n]*\n+/, "");
const ABSOLUTE = /^([a-z][a-z0-9+.-]*:|\/\/|\/|#)/i;

/** A link of a file of docs/ as the wiki needs it: another page of the wiki, a screenshot of the wiki, or GitHub */
function linkOf(from, target, image) {
  if (ABSOLUTE.test(target)) return target;
  const [file, anchor] = target.split("#");
  const path = posix.normalize(posix.join(posix.dirname(from), file));
  const hash = anchor ? `#${anchor}` : "";
  if (path.startsWith("docs/guide/img/")) return `${IMAGES}/${basename(path)}`;
  if (image) return `${RAW}${path}`;
  const page = wikiPageOf(path);
  if (page) return `${page}${hash}`;
  if (path === "DLX-TABLE-Instructions.md") return `${APP}/auth/documentation?page=instruction-table`;
  return `${REPOSITORY}${path}${hash}`;
}

/** The links and images of a text, outside its code blocks */
function convertLinks(from, markdown) {
  return markdown
    .split(/(^```[\s\S]*?^```)/m)
    .map((part, index) =>
      index % 2 === 1
        ? part
        : part
            .replace(/(!?)\[([^\]]*)\]\(([^)\s]+)((?:\s+"[^"]*")?)\)/g, (_, bang, text, target, title) => `${bang}[${text}](${linkOf(from, target, bang === "!")}${title})`)
            .replace(/(<img\b[^>]*\bsrc=")([^"]+)(")/gi, (_, start, target, end) => `${start}${linkOf(from, target, true)}${end}`),
    )
    .join("");
}

function languageSwitch(page, lang) {
  return lang === "es" ? `**Español** | [English](${page.names.en})` : `[Español](${page.names.es}) | **English**`;
}

/** The index of the documentation in a language: the parts with their pages */
function index(lang, heading) {
  const lines = [];
  for (const section of SECTIONS) {
    lines.push(`${heading} ${section.title[lang]}`, "");
    for (const [base, ...names] of section.pages ?? []) {
      const name = names[LANGS.indexOf(lang)];
      lines.push(`- [${titleOf(read(`${base}${lang === "es" ? "" : ".en"}.md`))}](${name})`);
    }
    for (const [text, url] of section.links ?? []) lines.push(`- [${text[lang]}](${typeof url === "string" ? url : url[lang]})`);
    lines.push("");
  }
  return lines.join("\n");
}

const HOME = `<p align="center">
  <img src="${RAW}assets/favicon.256x256.png" alt="THUMDER" width="120" height="120"/>
</p>

<p align="center"><strong>THe UltiMate Dlx EmulatoR</strong></p>

<p align="center">
  <a href="${APP}"><strong>Abrir THUMDER | Open THUMDER</strong></a> |
  <a href="https://github.com/nonodev96/THUMDER">GitHub</a> |
  <a href="https://github.com/nonodev96/THUMDER/releases">Descargas | Downloads</a>
</p>

## Español

THUMDER es un simulador del procesador **DLX** para aprender cómo funciona un pipeline: escribes un programa en ensamblador, lo cargas y ves, ciclo a ciclo, qué hace cada instrucción y por qué se detiene. Esta documentación también está dentro de THUMDER, en **Documentación**.

${index("es", "###")}
## English

THUMDER is a simulator of the **DLX** processor for learning how a pipeline works: you write a program in assembler, load it and watch, cycle by cycle, what each instruction does and why it stalls. This documentation is also inside THUMDER, in **Documentation**.

${index("en", "###")}`;

const SIDEBAR = `**[THUMDER](Home)**

<details open>
<summary><strong>Español</strong></summary>

${index("es", "####")}
</details>

<details open>
<summary><strong>English</strong></summary>

${index("en", "####")}
</details>
`;

const FOOTER = `Esta wiki se genera a partir de [docs/](https://github.com/nonodev96/THUMDER/tree/dev/docs): los cambios se hacen allí. | This wiki is generated from [docs/](https://github.com/nonodev96/THUMDER/tree/dev/docs): changes are made there.
`;

if (!existsSync(join(WIKI, ".git"))) {
  console.error("The wiki is not here: git submodule update --init wiki");
  process.exit(1);
}

const written = new Set(["Home.md", "_Sidebar.md", "_Footer.md"]);
writeFileSync(join(WIKI, "Home.md"), HOME);
writeFileSync(join(WIKI, "_Sidebar.md"), SIDEBAR);
writeFileSync(join(WIKI, "_Footer.md"), FOOTER);
for (const page of PAGES) {
  for (const lang of LANGS) {
    const from = page.files[lang];
    const body = convertLinks(from, withoutTitle(read(from)));
    const file = `${page.names[lang]}.md`;
    writeFileSync(join(WIKI, file), `${languageSwitch(page, lang)}\n\n${body}`);
    written.add(file);
  }
}

// The pages that are no longer in the documentation
for (const file of readdirSync(WIKI)) {
  if (file.endsWith(".md") && !written.has(file)) {
    rmSync(join(WIKI, file));
    console.log(`deleted ${file}`);
  }
}

// The screenshots, as they are in docs/guide/img
const images = join(ROOT, "docs", "guide", "img");
const target = join(WIKI, IMAGES);
mkdirSync(target, { recursive: true });
const sources = new Set(readdirSync(images));
for (const file of sources) copyFileSync(join(images, file), join(target, file));
for (const file of readdirSync(target)) if (!sources.has(file)) rmSync(join(target, file));

console.log(`wiki: ${written.size} pages and ${sources.size} screenshots in ${WIKI}`);
