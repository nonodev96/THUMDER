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

Los binarios **no tienen firma de Windows ni de macOS**: SmartScreen y Gatekeeper avisarán la primera vez. En macOS, abre la aplicación con clic derecho → Abrir. Los ficheros \`latest*.yml\` describen cada versión para las actualizaciones automáticas.

**Verificar una descarga**

Cada binario tiene una atestación de procedencia (SLSA) y otra de su SBOM, firmadas con Sigstore por el flujo de GitHub que lo compiló. Para comprobar que un fichero salió de este repositorio, de esta versión y de ese flujo, sin cambios:

\`\`\`sh
gh attestation verify THUMDER-v${version}-linux-x86_64.AppImage --repo nonodev96/THUMDER --signer-workflow nonodev96/THUMDER/.github/workflows/create-release.yaml
\`\`\`

El SBOM (la lista de dependencias) está en \`THUMDER-v${version}-sbom.cdx.json\` (CycloneDX) y \`THUMDER-v${version}-sbom.spdx.json\` (SPDX), y los ficheros \`*.sigstore.json\` son las atestaciones de cada sistema, para comprobarlas sin conexión con \`gh attestation verify --bundle\` o con cosign. Más en el README, «Verificar las descargas».`);
