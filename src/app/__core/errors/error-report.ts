// What THUMDER sends of an error to the collection client-errors of Firestore (firestore.rules: create only): technical
// data, cut to the limits of the rules. No account, no file, no folder of the computer.

/** Where the errors go */
export const ERRORS_COLLECTION = "client-errors";

/** The limits of the fields (firestore.rules: validError) */
export const ERROR_LIMITS = { message: 500, name: 100, stack: 4000, path: 200, version: 20, userAgent: 300, lang: 10 } as const;

export type ErrorReport = {
  message: string;
  name: string;
  stack: string;
  /** The view (the route, without what follows ? or #) */
  path: string;
  version: string;
  platform: "web" | "electron";
  userAgent: string;
  lang: string;
};

export type ErrorContext = { path: string; version: string; userAgent: string; lang: string };

const cut = (text: string, size: number) => (text.length > size ? `${text.slice(0, size - 1)}…` : text);

/** The folders of a file of the computer (in the stacks of Electron): only the name of the file stays */
const withoutFolders = (text: string) => text.replace(/file:\/\/\/[^\s)]*\/(?=[^/\s)]+)/g, "file:///…/");

export function errorReport(error: unknown, context: ErrorContext): ErrorReport {
  const value = error instanceof Error ? error : null;
  const message = value?.message || (typeof error === "string" ? error : (JSON.stringify(error) ?? String(error))) || "Unknown error";
  return {
    message: cut(withoutFolders(message), ERROR_LIMITS.message),
    name: cut(value?.name ?? typeof error, ERROR_LIMITS.name),
    stack: cut(withoutFolders(value?.stack ?? ""), ERROR_LIMITS.stack),
    path: cut(context.path.split(/[?#]/)[0] || "/", ERROR_LIMITS.path),
    version: cut(context.version, ERROR_LIMITS.version),
    platform: /electron/i.test(context.userAgent) ? "electron" : "web",
    userAgent: cut(context.userAgent, ERROR_LIMITS.userAgent),
    lang: cut(context.lang, ERROR_LIMITS.lang),
  };
}

/** The same error twice is sent once (the message and the start of the stack) */
export function errorKey(report: ErrorReport): string {
  return `${report.message}\n${report.stack.slice(0, 300)}`;
}
