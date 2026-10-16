// The notes of a release (CI-03): its section of CHANGELOG.md and what the binaries are and are not.
// Usage: node scripts/release-notes.mjs 1.7.0 > notes.md
import { readFileSync } from "node:fs";
import { join } from "node:path";

const version = process.argv[2] ?? JSON.parse(readFileSync(join(import.meta.dirname, "..", "package.json"), "utf8")).version;
const changelog = readFileSync(join(import.meta.dirname, "..", "CHANGELOG.md"), "utf8");

// The section of the version: from its title (## 1.7.0 or ## <small>1.7.0 ...</small>) to the next one
const sections = changelog.split(/^(?=## )/m);
const section = sections.find((text) => new RegExp(`^## (<small>)?${version.replace(/\./g, "\\.")}\\b`).test(text));
const body = section ? section.replace(/^## .*\n/, "").trim() : "Sin cambios anotados en CHANGELOG.md.";

console.log(`${body}

---

**Descargas**

- Windows: \`.exe\` (instalador) o la versión portable.
- macOS: \`.dmg\` o \`.zip\`.
- Linux: \`.AppImage\`.
- Sin instalar nada: la versión web.

Los binarios **no están firmados**: Windows (SmartScreen) y macOS (Gatekeeper) avisarán la primera vez. En macOS, abre la aplicación con clic derecho → Abrir. Los ficheros \`latest*.yml\` describen cada versión para las actualizaciones automáticas.`);
