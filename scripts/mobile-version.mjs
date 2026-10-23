// The version of THUMDER (package.json) in the application of iOS: MARKETING_VERSION ("1.13.1") and
// CURRENT_PROJECT_VERSION (1013001, the versionCode of Android: src-mobile/android/app/build.gradle reads package.json
// itself). `pnpm version` runs it ("version" script) after changing package.json and before its commit.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const { version } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const [major, minor, patch] = version.split(/[.-]/).map(Number);
const build = major * 1_000_000 + minor * 1_000 + patch;
const project = join(root, "src-mobile", "ios", "App", "App.xcodeproj", "project.pbxproj");

const before = readFileSync(project, "utf8");
const after = before
  .replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${version};`)
  .replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${build};`);
if (after !== before) writeFileSync(project, after);
console.log(`iOS: ${version} (${build})`);
execFileSync("git", ["add", project], { cwd: root });
