import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

export const REPOSITORY = "https://github.com/nonodev96/THUMDER";
export const DEV_SERVER_URL = "http://localhost:4200/";

/** Where THUMDER runs and where its files are */
export interface Environment {
  /** `electron . --serve`: the page comes from `ng serve`, with the developer tools, and Electron restarts when it is compiled */
  readonly dev: boolean;
  readonly platform: NodeJS.Platform;
  /** Windows and Linux: the navbar is the title bar, with the buttons of the window over it (macOS keeps its own) */
  readonly ownTitleBar: boolean;
  /** The page of THUMDER */
  readonly pageUrl: string;
  /** The folder of the Angular application built (dist/browser): its pages are the only ones of THUMDER */
  readonly browserDir: string;
  /** The assets of the Angular application: the icon and the translations */
  readonly assetsDir: string;
  /** The compiled preload script */
  readonly preload: string;
  /** The icon of the window and of the tray, if it is there */
  readonly icon: string | undefined;
  /** The compiled desktop application (dist-electron): while developing, Electron restarts when it changes */
  readonly compiledDir: string;
}

/**
 * The environment of THUMDER: from its arguments, the folder of the application (`app.getAppPath()`: the project or
 * app.asar, where package.json is) and the folder of the compiled main process (dist-electron/main)
 */
export function resolveEnvironment(options: {
  argv: readonly string[];
  appPath: string;
  mainDir: string;
  platform: NodeJS.Platform;
}): Environment {
  const { argv, appPath, mainDir, platform } = options;
  const dev = argv.includes("--serve");
  // The Angular application: built by `ng build` into dist/browser, or served by `ng serve` (its assets are the sources)
  const browser = path.join(appPath, "dist", "browser");
  const assetsDir = dev ? path.join(appPath, "src", "assets") : path.join(browser, "assets");
  const icon = path.join(assetsDir, "icons", "thumder-desktop.png");
  return {
    dev,
    platform,
    ownTitleBar: platform !== "darwin",
    pageUrl: dev ? DEV_SERVER_URL : pathToFileURL(path.join(browser, "index.html")).href,
    browserDir: browser,
    assetsDir,
    preload: path.join(mainDir, "..", "preload", "index.js"),
    icon: fs.existsSync(icon) ? icon : undefined,
    compiledDir: path.join(mainDir, ".."),
  };
}
