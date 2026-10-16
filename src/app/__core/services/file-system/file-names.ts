// The names of the files and folders of the file manager (DAT-05)

/** Why a name is not valid: the key of its message in the translations (FILE_MANAGER.NAME_*) */
export type NameError = "EMPTY" | "TOO_LONG" | "INVALID_CHARACTERS" | "RESERVED" | "TAKEN";

const MAX_LENGTH = 100;
// The characters Windows, macOS and Linux do not accept in a name, and the control ones
// biome-ignore lint/suspicious/noControlCharactersInRegex: the control characters are what it looks for
const INVALID = /[\\/:*?"<>|\u0000-\u001f]/;
// Windows does not accept these names, with or without an extension
const RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i;

/** The name without the spaces around it */
export function cleanName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

/** Why the name is not valid, or null. `taken`: the names already in the folder (a rename does not count its own) */
export function nameError(name: string, taken: readonly string[]): NameError | null {
  const clean = cleanName(name);
  if (clean === "" || clean === "." || clean === "..") return "EMPTY";
  if (clean.length > MAX_LENGTH) return "TOO_LONG";
  if (INVALID.test(clean)) return "INVALID_CHARACTERS";
  if (RESERVED.test(clean)) return "RESERVED";
  if (taken.some((other) => other.localeCompare(clean, undefined, { sensitivity: "accent" }) === 0)) return "TAKEN";
  return null;
}

/** The name and its extension: "bucle.s" is ["bucle", ".s"], "datos" is ["datos", ""] */
export function splitName(name: string): [string, string] {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? [name.slice(0, dot), name.slice(dot)] : [name, ""];
}

/** The name cut to `MAX_LENGTH` characters, keeping its extension (the account does not take longer names) */
function withinLimit(stem: string, suffix: string): string {
  return `${stem.slice(0, Math.max(1, MAX_LENGTH - suffix.length)).trimEnd()}${suffix}`;
}

/** A name that is not taken in the folder: "nuevo.s", then "nuevo (2).s", "nuevo (3).s"... always within 100 characters */
export function uniqueName(name: string, taken: readonly string[]): string {
  const [base, extension] = splitName(name);
  const first = name.length > MAX_LENGTH ? withinLimit(base, extension) : name;
  if (nameError(first, taken) !== "TAKEN") return first;
  const stem = base.replace(/ \(\d+\)$/, "");
  for (let n = 2; ; n++) {
    const candidate = withinLimit(stem, ` (${n})${extension}`);
    if (nameError(candidate, taken) !== "TAKEN") return candidate;
  }
}
