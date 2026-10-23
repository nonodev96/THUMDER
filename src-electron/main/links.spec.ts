import * as path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { resolveEnvironment } from "./environment";
import { isAppUrl, isExternalUrl } from "./links";

const appPath = path.join(path.sep, "opt", "THUMDER con espacios", "resources", "app.asar");
const built = resolveEnvironment({ argv: [], appPath, mainDir: path.join(appPath, "dist-electron", "main"), platform: "linux" });
const dev = resolveEnvironment({ argv: [".", "--serve"], appPath, mainDir: path.join(appPath, "dist-electron", "main"), platform: "linux" });

describe("The links of the window", () => {
  it("open in the browser of the system only with http(s) and mailto", () => {
    expect(["https://github.com/nonodev96/THUMDER", "http://example.org", "mailto:a@b.c"].every(isExternalUrl)).toBe(true);
    expect(["file:///etc/passwd", "javascript:alert(1)", "smb://server/share", "not a url", 42].some(isExternalUrl)).toBe(false);
  });

  it("are pages of THUMDER only inside the application built, with any character in its path", () => {
    expect(isAppUrl(built.pageUrl, built)).toBe(true);
    expect(isAppUrl(pathToFileURL(path.join(built.browserDir, "auth", "registers")).href, built)).toBe(true);
    expect(isAppUrl(`${built.pageUrl}#/auth/memory`, built)).toBe(true);
    expect(isAppUrl("file:///etc/passwd", built)).toBe(false);
    expect(isAppUrl(pathToFileURL(path.join(built.browserDir, "..", "secret.html")).href, built)).toBe(false);
    expect(isAppUrl(`${pathToFileURL(built.browserDir).href}-other/index.html`, built)).toBe(false);
    expect(isAppUrl("https://example.org", built)).toBe(false);
    expect(isAppUrl(undefined, built)).toBe(false);
  });

  it("are pages of THUMDER only from `ng serve` while developing", () => {
    expect(isAppUrl("http://localhost:4200/auth/home", dev)).toBe(true);
    expect(isAppUrl("http://localhost:4201/", dev)).toBe(false);
    expect(isAppUrl(built.pageUrl, dev)).toBe(false);
  });
});

describe("The environment", () => {
  it("loads the application built, with its assets and the preload script next to the main process", () => {
    expect(built.dev).toBe(false);
    expect(built.pageUrl).toBe(pathToFileURL(path.join(appPath, "dist", "browser", "index.html")).href);
    expect(built.assetsDir).toBe(path.join(appPath, "dist", "browser", "assets"));
    expect(built.preload).toBe(path.join(appPath, "dist-electron", "preload", "index.js"));
    expect(built.ownTitleBar).toBe(true);
  });

  it("loads `ng serve` and the assets of the sources while developing; macOS keeps its title bar", () => {
    expect(dev.pageUrl).toBe("http://localhost:4200/");
    expect(dev.assetsDir).toBe(path.join(appPath, "src", "assets"));
    expect(resolveEnvironment({ argv: [], appPath, mainDir: appPath, platform: "darwin" }).ownTitleBar).toBe(false);
  });
});
