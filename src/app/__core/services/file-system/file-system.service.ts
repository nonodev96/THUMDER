import { Injectable, inject } from "@angular/core";
import type { InterfaceFileItem } from "@app/Types";
import { Utils } from "@app/Utils";
import { logger } from "@core/logger/logger";
import { FileSystemStorageService } from "@core/services/file-system/file-system-storage.service";
import { type Observable, Subject } from "rxjs";
import { BUILTIN_FOLDERS, copyFolderOf, isBuiltin, isBuiltinPath, isModule, loadBuiltinFiles } from "./builtin-files";
import { cleanName, type NameError, nameError, uniqueName } from "./file-names";
import { normalizeFile } from "./file-store";
import { createZip, readZip, type ZipEntry } from "./zip";

export class FileSystemItem {
  path: string;
  isDirectory: boolean;
  pathKeys: string[];
  name: string = "";
  key: string = "";
  dateModified: number = Date.now();
  size: number = 0;
  hasSubDirectories: boolean = false;
  thumbnail: string = "";
  dataItem: any = null;

  constructor(path: string, isDirectory: boolean, pathKeys: string[]) {
    this.path = path;
    this.isDirectory = isDirectory;
    this.pathKeys = [...pathKeys];
  }
}

export class THUMDER_FileItem extends FileSystemItem implements InterfaceFileItem {
  $key: string;
  content: string;
  description: string;
  e1_uid: string;
  f_id: string;

  constructor(path: string, isDirectory: boolean, pathKeys: Array<string>) {
    super(path, isDirectory, pathKeys);
    this.$key = "";
    this.content = "";
    this.description = "";
    this.e1_uid = "";
    this.f_id = "";
  }
}

/** A name that cannot be used: `reason` is the key of its message (FILE_MANAGER.NAME_<reason>) */
export class InvalidNameError extends Error {
  constructor(
    public readonly reason: NameError,
    name: string,
  ) {
    super(`Invalid name "${name}": ${reason}`);
  }
}

/** A change in a folder of THUMDER (builtin-files.ts), which is read only */
export class ReadOnlyError extends Error {
  constructor(name: string) {
    super(`Read only: ${name}`);
  }
}

/** The files that can be imported: DLX programs and texts, and ZIP files with them */
export const IMPORT_EXTENSIONS = [".s", ".txt", ".zip"];

/**
 * The files and folders of the file manager, as a tree of paths ("" is the root folder): the folders of THUMDER (read
 * only, builtin-files.ts) and the files of the person
 */
@Injectable({
  providedIn: "root",
})
export class FileSystemService {
  fileSystemStorageService = inject(FileSystemStorageService);

  /** The folders of THUMDER with their files, and the files of the person */
  public items: THUMDER_FileItem[] = [];
  private own: THUMDER_FileItem[] = [];
  private builtins: THUMDER_FileItem[] = [];
  private builtinsLoading: Promise<void> | null = null;
  private updateUI$: Subject<void> = new Subject<void>();

  constructor() {
    this.fileSystemStorageService.changes().subscribe((items) => {
      this.own = items.map((item) => FileSystemService.toFileItem(item));
      this.publish();
    });
  }

  private publish(): void {
    this.items = [...this.builtins, ...this.own];
    this.updateUI$.next();
  }

  /** The first time, with no files at all, two classic programs; and the folders of THUMDER */
  public async init(): Promise<void> {
    await this.fileSystemStorageService.generateDefaultFiles();
    await this.loadBuiltins();
  }

  /** The folders of THUMDER, read once (if they could not be read, they are read again the next time) */
  private loadBuiltins(): Promise<void> {
    this.builtinsLoading ??= (async () => {
      try {
        const exercises = await this.fileSystemStorageService.fetchExercises();
        const files = await loadBuiltinFiles((path) => this.fileSystemStorageService.fetchExample(path), exercises);
        this.builtins = files.map((item) => FileSystemService.toFileItem(item));
        this.publish();
        await this.renameClashes();
      } catch (error) {
        logger.error(error);
        this.builtinsLoading = null;
      }
    })();
    return this.builtinsLoading;
  }

  /** What the person has at the root with the name of a folder of THUMDER (older versions made them) takes another one */
  private async renameClashes(): Promise<void> {
    for (const clash of this.own.filter((item) => item.path === "" && BUILTIN_FOLDERS.includes(item.name))) {
      await this.renameItem(clash, uniqueName(copyFolderOf(clash.name), this.namesIn("")));
    }
  }

  /** A file or a folder, of THUMDER or of the person */
  public async find(key: string): Promise<THUMDER_FileItem | undefined> {
    if (isBuiltin({ key })) await this.loadBuiltins();
    const found = this.items.find((item) => item.key === key) ?? (await this.fileSystemStorageService.getFile(key));
    return found ? FileSystemService.toFileItem(found) : undefined;
  }

  /** A folder of THUMDER, or something inside one, cannot change */
  private static writable(path: string, item?: { key?: string; name?: string }): void {
    if (isBuiltin(item) || isBuiltinPath(path)) throw new ReadOnlyError(item?.name || path);
  }

  public getUpdateUIObservable(): Observable<void> {
    return this.updateUI$.asObservable();
  }

  /** The names in a folder (except the item `except`, for a rename) */
  public namesIn(path: string, except?: string): string[] {
    return this.items.filter((item) => item.path === path && item.key !== except).map((item) => item.name);
  }

  /** The name, clean and valid in the folder, or an InvalidNameError */
  private checkName(name: string, path: string, except?: string): string {
    const error = nameError(name, this.namesIn(path, except));
    if (error !== null) throw new InvalidNameError(error, name);
    return cleanName(name);
  }

  /** The item and everything inside it, if it is a folder (among the files of THUMDER, or among those of the person) */
  private withContents(item: { key: string }): THUMDER_FileItem[] {
    const list = isBuiltin(item) ? this.builtins : this.own;
    const found = list.find((value) => value.key === item.key);
    if (found === undefined) return [];
    if (!found.isDirectory) return [found];
    const fullPath = FileSystemService.join(found.path, found.name);
    return [found, ...list.filter((value) => FileSystemService.isInside(value.path, fullPath))];
  }

  private static newItem(path: string, name: string, isDirectory: boolean, content = "", date = Date.now()): THUMDER_FileItem {
    const item = new THUMDER_FileItem(path, isDirectory, path ? path.split("/") : []);
    item.key = Utils.uuidv4();
    item.$key = item.key;
    item.name = name;
    item.content = content;
    item.size = content.length;
    item.dateModified = date;
    return item;
  }

  public async createDirectory(parentDirectory: FileSystemItem, name: string): Promise<THUMDER_FileItem> {
    FileSystemService.writable(parentDirectory.path);
    const folder = FileSystemService.newItem(parentDirectory.path, this.checkName(name, parentDirectory.path), true);
    await this.fileSystemStorageService.save([folder]);
    return folder;
  }

  /** A new empty file with a free name: "nuevo.s", "nuevo (2).s"... (`baseName` comes translated) */
  public async createFile(parent: FileSystemItem, extension: string, baseName = "nuevo"): Promise<THUMDER_FileItem> {
    FileSystemService.writable(parent.path);
    const file = FileSystemService.newItem(parent.path, uniqueName(`${baseName}${extension}`, this.namesIn(parent.path)), false);
    await this.fileSystemStorageService.save([file]);
    return file;
  }

  /**
   * Saves the text of a file of the editor. A file the file manager does not have (deleted meanwhile) is created again.
   * A program of THUMDER is not saved: without changes it stays as it is, and with changes it goes as a copy to the
   * files of the person (copyOf)
   */
  public async editFileItem(edited: InterfaceFileItem): Promise<THUMDER_FileItem> {
    if (isBuiltin(edited)) {
      await this.loadBuiltins();
      const original = this.builtins.find((value) => value.key === edited.key);
      if (original !== undefined && original.content === edited.content) return original;
      return this.copyOf({ ...(original ?? edited), content: edited.content });
    }
    const current = edited.key
      ? (this.items.find((value) => value.key === edited.key) ?? (await this.fileSystemStorageService.getFile(edited.key)))
      : undefined;
    const file = current
      ? FileSystemService.toFileItem({ ...current, content: edited.content, description: edited.description, dateModified: Date.now() })
      : FileSystemService.newItem(edited.path, uniqueName(edited.name || "nuevo.s", this.namesIn(edited.path)), false, edited.content);
    file.size = file.content.length;
    await this.fileSystemStorageService.save([file]);
    return file;
  }

  /** Renames a file or a folder (and the paths of what is inside it) */
  public async renameItem(item: FileSystemItem, newName: string): Promise<THUMDER_FileItem> {
    FileSystemService.writable(item.path, item);
    const [own, ...contents] = this.withContents(item);
    if (own === undefined) throw new Error(`Item not found: ${item.name}`);
    const name = this.checkName(newName, own.path, own.key);
    const now = Date.now();
    const renamed = { ...own, name, dateModified: now };
    const oldPath = FileSystemService.join(own.path, own.name);
    const newPath = FileSystemService.join(own.path, name);
    const moved = contents.map((child) => ({ ...child, path: newPath + child.path.slice(oldPath.length), dateModified: now }));
    await this.fileSystemStorageService.save([renamed, ...moved]);
    return FileSystemService.toFileItem(renamed);
  }

  /** Deletes a file, or a folder with everything inside it */
  public async deleteItem(item: FileSystemItem): Promise<void> {
    FileSystemService.writable(item.path, item);
    const items = this.withContents(item);
    if (items.length === 0) throw new Error(`Item not found: ${item.name}`);
    await this.fileSystemStorageService.remove(items);
  }

  /** Moves a file or a folder (with what is inside it) into a folder; with the name taken there, it gets a free one */
  public async moveItem(item: THUMDER_FileItem, destinationDirectory: FileSystemItem): Promise<void> {
    const destPath = FileSystemService.join(destinationDirectory.path, destinationDirectory.name);
    FileSystemService.writable(item.path, item);
    FileSystemService.writable(destPath);
    const [own, ...contents] = this.withContents(item);
    if (own === undefined) throw new Error(`Item not found: ${item.name}`);
    const oldPath = FileSystemService.join(own.path, own.name);
    if (own.isDirectory && FileSystemService.isInside(destPath, oldPath)) {
      throw new Error(`A folder cannot be moved into itself: ${oldPath}`);
    }
    if (own.path === destPath) return;
    const now = Date.now();
    const name = uniqueName(own.name, this.namesIn(destPath));
    const newPath = FileSystemService.join(destPath, name);
    const moved = { ...own, name, path: destPath, dateModified: now };
    const children = contents.map((child) => ({ ...child, path: newPath + child.path.slice(oldPath.length), dateModified: now }));
    await this.fileSystemStorageService.save([moved, ...children]);
  }

  /**
   * The other DLX files in the folder of a file: the modules a program can use (the simulator only takes those that
   * define, with .global, the symbols the program needs)
   */
  public async programFiles(current: InterfaceFileItem): Promise<{ name: string; content: string }[]> {
    // A program of THUMDER: the modules of its folder
    if (isBuiltin(current)) {
      await this.loadBuiltins();
      return this.builtins
        .filter((file) => !file.isDirectory && file.path === current.path && file.key !== current.key && isModule(file.name))
        .map((file) => ({ name: file.name, content: file.content }));
    }
    try {
      const files = await this.fileSystemStorageService.getFiles();
      return files
        .filter((file) => !file.isDirectory && file.path === current.path && file.key !== current.key && file.name !== current.name)
        .filter((file) => /\.s$/i.test(file.name))
        .map((file) => ({ name: file.name, content: file.content ?? "" }));
    } catch (error) {
      logger.error(error);
      return [];
    }
  }

  // "" is the root folder
  public static join(parentPath: string, name: string): string {
    return parentPath ? (name ? `${parentPath}/${name}` : parentPath) : name;
  }

  /** Whether the path is the folder or is inside it */
  public static isInside(path: string, folderPath: string): boolean {
    return path === folderPath || path.startsWith(`${folderPath}/`);
  }

  /**
   * A copy of a program of THUMDER in the files of the person: in "mis ejemplos" (or "mis ejercicios"), which is
   * created the first time with the modules of the folder of THUMDER, so that the copy can use them
   */
  private async copyOf(file: InterfaceFileItem): Promise<THUMDER_FileItem> {
    const folder = copyFolderOf(file.path);
    const items: THUMDER_FileItem[] = [];
    if (!this.own.some((item) => item.isDirectory && item.path === "" && item.name === folder)) {
      items.push(FileSystemService.newItem("", folder, true));
      for (const module of this.builtins.filter((item) => item.path === file.path && isModule(item.name) && item.name !== file.name)) {
        items.push(FileSystemService.newItem(folder, module.name, false, module.content));
      }
    }
    const names = [...this.namesIn(folder), ...items.filter((item) => item.path === folder).map((item) => item.name)];
    const copy = FileSystemService.newItem(folder, uniqueName(file.name, names), false, file.content);
    copy.description = file.description;
    await this.fileSystemStorageService.save([...items, copy]);
    return copy;
  }

  /**
   * Copies a file or a folder of THUMDER to the files of the person: a file to "mis ejemplos", and a folder to a new
   * folder of the root ("mis ejemplos", or "mis ejemplos (2)"...). Returns the folder where the copy is
   */
  public async copyToMine(item: FileSystemItem): Promise<string> {
    const [original, ...contents] = this.withContents(item);
    if (original === undefined || !isBuiltin(original)) throw new Error(`Not a file of THUMDER: ${item.name}`);
    if (!original.isDirectory) return (await this.copyOf(original)).path;
    const name = uniqueName(copyFolderOf(original.name), this.namesIn(""));
    const oldPath = FileSystemService.join(original.path, original.name);
    await this.fileSystemStorageService.save([
      FileSystemService.newItem("", name, true),
      ...contents.map((child) =>
        FileSystemService.newItem(name + child.path.slice(oldPath.length), child.name, child.isDirectory, child.content),
      ),
    ]);
    return name;
  }

  /**
   * Imports files into a folder: DLX programs and texts, and ZIP files (with their folders). A name already taken
   * gets a free one ("bucle (2).s"). Returns how many files were imported
   */
  public async importFiles(files: File[], destinationPath: string): Promise<number> {
    FileSystemService.writable(destinationPath);
    const entries: ZipEntry[] = [];
    for (const file of files) {
      if (/\.zip$/i.test(file.name)) {
        for (const entry of await readZip(await file.arrayBuffer())) entries.push({ ...entry, date: entry.date ?? file.lastModified });
      } else {
        entries.push({ path: file.name, content: await file.text(), date: file.lastModified });
      }
    }
    const items: THUMDER_FileItem[] = [];
    const names = (path: string) => [...this.namesIn(path), ...items.filter((item) => item.path === path).map((item) => item.name)];
    // The folders of the paths, created once (the existing ones are used)
    const folder = (parts: string[]): string => {
      let path = destinationPath;
      for (const part of parts) {
        const name = nameError(part, []) === null ? cleanName(part) : "carpeta";
        const existing = [...this.own, ...items].find((item) => item.isDirectory && item.path === path && item.name === name);
        const created = existing ?? FileSystemService.newItem(path, uniqueName(name, names(path)), true);
        if (existing === undefined) items.push(created);
        path = FileSystemService.join(path, created.name);
      }
      return path;
    };
    let count = 0;
    for (const entry of entries) {
      const parts = entry.path.split("/").filter((part) => part !== "" && part !== "." && part !== "..");
      const fileName = parts.pop();
      if (fileName === undefined || !/\.(s|txt)$/i.test(fileName)) continue;
      const path = folder(parts);
      const name = uniqueName(nameError(fileName, []) === null ? cleanName(fileName) : "importado.s", names(path));
      items.push(FileSystemService.newItem(path, name, false, entry.content, entry.date));
      count++;
    }
    await this.fileSystemStorageService.save(items);
    return count;
  }

  /**
   * What to download for some items: one file as it is (a .s), or a ZIP with the files and the folders (keeping the
   * folders). With no items, all the files of the person
   */
  public exportItems(selected: FileSystemItem[]): { name: string; blob: Blob } {
    const items = selected.length > 0 ? selected.flatMap((item) => this.withContents(item)) : this.own;
    const files = items.filter((item) => !item.isDirectory);
    if (selected.length === 1 && !selected[0].isDirectory && files.length === 1) {
      return { name: files[0].name, blob: new Blob([files[0].content], { type: "text/plain" }) };
    }
    // The paths inside the ZIP start at the folder of the selection
    const base = selected.length > 0 ? selected[0].path : "";
    const entries = files.map((file) => ({
      path: FileSystemService.join(base ? file.path.slice(base.length + 1) : file.path, file.name),
      content: file.content,
      date: file.dateModified,
    }));
    const name = selected.length === 1 && selected[0].isDirectory ? `${selected[0].name}.zip` : "thumder.zip";
    return { name, blob: createZip(entries) };
  }

  private static toFileItem(item: InterfaceFileItem): THUMDER_FileItem {
    const file = normalizeFile(item);
    return Object.assign(new THUMDER_FileItem(file.path, file.isDirectory, file.pathKeys), file);
  }
}
