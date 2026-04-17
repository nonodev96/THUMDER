/**
 * Patches monaco-editor/package.json to add an explicit extensionless export
 * mapping required by esbuild (@covalent/code-editor imports without .js extension).
 * Run automatically as a postinstall script.
 */
const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '..', 'node_modules', 'monaco-editor', 'package.json');

if (!fs.existsSync(pkgPath)) {
  console.log('monaco-editor not found, skipping patch.');
  process.exit(0);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

if (pkg.exports && pkg.exports['./esm/vs/editor/editor.api']) {
  console.log('monaco-editor already patched, skipping.');
  process.exit(0);
}

// Insert the specific export before the catch-all "./*": "./*"
const newExports = {};
for (const [key, value] of Object.entries(pkg.exports || {})) {
  if (key === './*') {
    newExports['./esm/vs/editor/editor.api'] = './esm/vs/editor/editor.api.js';
  }
  newExports[key] = value;
}
pkg.exports = newExports;

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
console.log('monaco-editor patched successfully.');
