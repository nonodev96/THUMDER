#!/usr/bin/env node
/**
 * Replaces relative imports with tsconfig path aliases where applicable.
 *
 * Aliases (from tsconfig.json paths):
 *   @app        -> src/app
 *   @core       -> src/app/__core
 *   @shared     -> src/app/__shared
 *   @layout     -> src/app/_layouts
 *   @components -> src/app/components
 *   @views      -> src/app/views
 *
 * NOTE: @app must come LAST so more-specific aliases match first.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC_APP = path.join(ROOT, "src", "app");

const ALIASES = [
  { alias: "@core", dir: path.join(SRC_APP, "__core") },
  { alias: "@shared", dir: path.join(SRC_APP, "__shared") },
  { alias: "@layout", dir: path.join(SRC_APP, "_layouts") },
  { alias: "@components", dir: path.join(SRC_APP, "components") },
  { alias: "@views", dir: path.join(SRC_APP, "views") },
  // @app must be last so more-specific aliases take priority
  { alias: "@app", dir: SRC_APP },
];

// Regex: matches only import/export ... from "..." or require("...") with relative paths
const IMPORT_RE = /^((?:import|export)\s[^'"]*from\s*|.*?(?:require|import)\s*\()(['"])(\.\.?\/[^'"]+)\2/gm;

function resolveAlias(filePath, importPath) {
  const absTarget = path.resolve(path.dirname(filePath), importPath);
  for (const { alias, dir } of ALIASES) {
    if (absTarget === dir) {
      return alias;
    }
    const prefix = dir + path.sep;
    if (absTarget.startsWith(prefix)) {
      const rest = absTarget.slice(prefix.length).replace(/\\/g, "/");
      return `${alias}/${rest}`;
    }
  }
  return null;
}

function walkDir(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full, results);
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

let totalFiles = 0;
let totalReplacements = 0;

for (const filePath of walkDir(SRC_APP)) {
  const original = fs.readFileSync(filePath, "utf8");
  let changed = false;

  const updated = original.replace(IMPORT_RE, (match, prefix, quote, importPath) => {
    const aliased = resolveAlias(filePath, importPath);
    if (aliased) {
      changed = true;
      totalReplacements++;
      return `${prefix}${quote}${aliased}${quote}`;
    }
    return match;
  });

  if (changed) {
    fs.writeFileSync(filePath, updated, "utf8");
    totalFiles++;
    console.log("Updated:", path.relative(ROOT, filePath));
  }
}

console.log(`\nDone: ${totalReplacements} replacement(s) in ${totalFiles} file(s).`);
