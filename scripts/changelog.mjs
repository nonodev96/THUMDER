// The section of a new version in CHANGELOG.md (CI-03), from the conventional commits since the last version: the
// features, the fixes and the performance changes. `pnpm version` runs it ("version" script) after changing
// package.json and before its commit. A section written by hand for that version is kept as it is.
// Usage: node scripts/changelog.mjs [version]
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const version = process.argv[2] ?? pkg.version;
const file = join(root, "CHANGELOG.md");
const changelog = readFileSync(file, "utf8");

if (new RegExp(`^## (<small>)?${version.replace(/\./g, "\\.")}\\b`, "m").test(changelog)) {
  console.log(`CHANGELOG.md already has ${version}`);
} else {
  const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  let since = "";
  try {
    since = git("describe", "--tags", "--abbrev=0", "--match", "v[0-9]*");
  } catch {
    // No version yet: every commit
  }
  const log = git("log", "--no-merges", "--format=%h%x09%s", ...(since ? [`${since}..HEAD`] : []));
  const url = String(pkg.repository?.url ?? "https://github.com/nonodev96/THUMDER").replace(/^git\+/, "").replace(/\.git$/, "");
  const groups = { feat: "Nuevas funciones", fix: "Correcciones", perf: "Rendimiento" };
  const lines = { feat: [], fix: [], perf: [] };
  for (const line of log.split("\n").filter(Boolean)) {
    const [hash, subject] = line.split("\t");
    const match = /^(feat|fix|perf)(\([^)]*\))?!?:\s*(.+)$/.exec(subject);
    if (match) lines[match[1]].push(`* ${match[3]} ([${hash}](${url}/commit/${hash}))`);
  }
  const date = new Date().toISOString().slice(0, 10);
  const body = Object.entries(groups)
    .filter(([type]) => lines[type].length > 0)
    .map(([type, title]) => `### ${title}\n\n${lines[type].join("\n")}`)
    .join("\n\n");
  writeFileSync(file, `## ${version} (${date})\n\n${body || "Sin cambios de funciones ni correcciones."}\n\n\n\n${changelog}`);
  console.log(`CHANGELOG.md: ${version}`);
}
execFileSync("git", ["add", "CHANGELOG.md"], { cwd: root });
