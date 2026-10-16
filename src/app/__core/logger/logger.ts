import { AppConfig } from "../../../environments/_environment";

/** From the most detailed to none */
export type LogLevel = "debug" | "info" | "warn" | "error" | "off";

const ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3, off: 4 };

/** `log_level` in localStorage, to see everything in a production build; if not, all in development and warnings up in production */
export function defaultLogLevel(production = AppConfig.production): LogLevel {
  try {
    const stored = localStorage.getItem("log_level");
    if (stored !== null && stored in ORDER) return stored as LogLevel;
  } catch {
    // No storage (a private window, a worker): the default
  }
  return production ? "warn" : "debug";
}

/** The messages of THUMDER for the console of the browser, by level (instead of console.*) */
export const logger = {
  level: defaultLogLevel(),
  enabled(level: Exclude<LogLevel, "off">): boolean {
    return ORDER[level] >= ORDER[this.level];
  },
  debug(...args: unknown[]): void {
    if (this.enabled("debug")) console.debug(...args);
  },
  info(...args: unknown[]): void {
    if (this.enabled("info")) console.info(...args);
  },
  warn(...args: unknown[]): void {
    if (this.enabled("warn")) console.warn(...args);
  },
  error(...args: unknown[]): void {
    if (this.enabled("error")) console.error(...args);
  },
};
