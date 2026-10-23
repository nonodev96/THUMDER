import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { DEV_SERVER_URL, type Environment } from "./environment";

const EXTERNAL_PROTOCOLS = new Set(["https:", "http:", "mailto:"]);

/** A link that opens in the browser (or the mail application) of the system: http(s) and mailto, nothing else */
export function isExternalUrl(link: unknown): link is string {
  if (typeof link !== "string") return false;
  try {
    return EXTERNAL_PROTOCOLS.has(new URL(link).protocol);
  } catch {
    return false;
  }
}

/**
 * A page of THUMDER: the only ones that open in its window and that can talk to the main process. While developing,
 * those of `ng serve`; if not, the files of the application built (compared as paths, so spaces, accents or the letter
 * of the drive on Windows do not matter)
 */
export function isAppUrl(link: unknown, environment: Pick<Environment, "dev" | "browserDir">): boolean {
  if (typeof link !== "string") return false;
  try {
    const url = new URL(link);
    if (environment.dev) return url.origin === new URL(DEV_SERVER_URL).origin;
    if (url.protocol !== "file:") return false;
    const relative = path.relative(environment.browserDir, fileURLToPath(url));
    return relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
  } catch {
    return false;
  }
}
