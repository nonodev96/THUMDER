// The dependencies of THUMDER with their licence, author and page, for the page «Sobre nosotros» (src/assets/licenses.json).
// It runs after `pnpm install` (postinstall): the page reads them from here instead of asking a server for each one.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

const read = (name) => {
  try {
    const data = JSON.parse(readFileSync(join(root, "node_modules", name, "package.json"), "utf8"));
    const author = typeof data.author === "string" ? data.author.replace(/\s*[<(].*$/, "") : data.author?.name;
    const homepage = data.homepage ?? (typeof data.repository === "string" ? data.repository : data.repository?.url)?.replace(/^git\+/, "").replace(/\.git$/, "");
    return { name, version: data.version, license: typeof data.license === "string" ? data.license : data.license?.type, author: author ?? "", homepage: homepage ?? "", description: data.description ?? "" };
  } catch {
    return { name, version: "", license: "", author: "", homepage: "", description: "" };
  }
};

const list = (dependencies = {}) => Object.keys(dependencies).sort().map(read);
const licenses = { dependencies: list(pkg.dependencies), devDependencies: list(pkg.devDependencies) };
writeFileSync(join(root, "src", "assets", "licenses.json"), `${JSON.stringify(licenses, null, 2)}\n`);
console.log(`licenses.json: ${licenses.dependencies.length} dependencies and ${licenses.devDependencies.length} for development`);
