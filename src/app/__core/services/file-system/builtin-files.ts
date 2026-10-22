import { DLX_EXAMPLES, DLX_EXAMPLES_FOLDER, DLX_EXAMPLES_MODULES, SUPERDLX_EXAMPLES, SUPERDLX_EXAMPLES_FOLDER } from "@app/CONSTANTS";
import type { InterfaceFileItem } from "@app/Types";
import type { Exercise } from "@core/exercises/exercises";
import { normalizeFile } from "./file-store";

// The folders of THUMDER: the classic DLX examples (with the ones of SuperDLX in a folder inside) and the programs of the
// guided exercises, at the root of the file manager for everyone (with or without an account). They come with the application (src/assets), so they are read
// only and are never saved, neither in the browser nor in the account. A program of them that is changed is saved as
// a copy in the files of the person ("mis ejemplos", "mis ejercicios").

/** The keys of the files of THUMDER start with this */
export const BUILTIN_PREFIX = "thumder:";

/** The owner of the files of THUMDER */
export const BUILTIN_OWNER = "thumder";

export const EXAMPLES_FOLDER = DLX_EXAMPLES_FOLDER;
export const EXERCISES_FOLDER = "ejercicios";
/** The folder of the examples of SuperDLX: "ejemplos/superdlx" */
export const SUPERDLX_FOLDER = `${DLX_EXAMPLES_FOLDER}/${SUPERDLX_EXAMPLES_FOLDER}`;
export const BUILTIN_FOLDERS = [EXAMPLES_FOLDER, EXERCISES_FOLDER];

/** What a file of the guided exercises keeps in `dataItem`: the id of its exercise */
export type BuiltinData = { exercise: string };

export function isBuiltin(item: { key?: string } | null | undefined): boolean {
  return item?.key?.startsWith(BUILTIN_PREFIX) ?? false;
}

/** Whether a path is one of the folders of THUMDER, or is inside one */
export function isBuiltinPath(path: string): boolean {
  return BUILTIN_FOLDERS.some((folder) => path === folder || path.startsWith(`${folder}/`));
}

/** The folder of the person where the changed programs of a folder of THUMDER go: "mis ejemplos" */
export function copyFolderOf(path: string): string {
  return `mis ${path.split("/")[0]}`;
}

/** The key of the file of a guided exercise */
export function exerciseKey(id: string): string {
  return `${BUILTIN_PREFIX}${EXERCISES_FOLDER}/${id}.s`;
}

/** The modules of a folder of THUMDER, which go with the copies of its programs */
export function isModule(name: string): boolean {
  return DLX_EXAMPLES_MODULES.includes(name);
}

function builtinItem(
  path: string,
  name: string,
  isDirectory: boolean,
  content = "",
  dataItem: BuiltinData | null = null,
): InterfaceFileItem {
  const key = `${BUILTIN_PREFIX}${path ? `${path}/` : ""}${name}`;
  return normalizeFile({ key, $key: key, e1_uid: BUILTIN_OWNER, path, name, isDirectory, content, dataItem, dateModified: 0 });
}

/**
 * The folders of THUMDER with their files. `fetchText` reads a file of src/assets/examples-dlx (each one is read once,
 * although several exercises use the same program)
 */
export async function loadBuiltinFiles(fetchText: (path: string) => Promise<string>, exercises: Exercise[]): Promise<InterfaceFileItem[]> {
  const texts = new Map<string, Promise<string>>();
  const text = (path: string) => {
    if (!texts.has(path)) texts.set(path, fetchText(path));
    return texts.get(path) as Promise<string>;
  };
  const examples = await Promise.all(DLX_EXAMPLES.map((name) => text(`${EXAMPLES_FOLDER}/${name}`)));
  const modules = await Promise.all(DLX_EXAMPLES_MODULES.map((name) => text(name)));
  const superdlx = await Promise.all(SUPERDLX_EXAMPLES.map((name) => text(`${SUPERDLX_FOLDER}/${name}`)));
  const programs = await Promise.all(exercises.map((exercise) => text(exercise.file)));
  return [
    builtinItem("", EXAMPLES_FOLDER, true),
    ...DLX_EXAMPLES.map((name, index) => builtinItem(EXAMPLES_FOLDER, name, false, examples[index])),
    ...DLX_EXAMPLES_MODULES.map((name, index) => builtinItem(EXAMPLES_FOLDER, name, false, modules[index])),
    builtinItem(EXAMPLES_FOLDER, SUPERDLX_EXAMPLES_FOLDER, true),
    ...SUPERDLX_EXAMPLES.map((name, index) => builtinItem(SUPERDLX_FOLDER, name, false, superdlx[index])),
    builtinItem("", EXERCISES_FOLDER, true),
    ...exercises.map((exercise, index) =>
      builtinItem(EXERCISES_FOLDER, `${exercise.id}.s`, false, programs[index], { exercise: exercise.id }),
    ),
  ];
}
