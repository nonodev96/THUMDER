import { TestBed } from "@angular/core/testing";
import type { InterfaceFileItem } from "@app/Types";
import { FileSystemItem, FileSystemService, InvalidNameError } from "@core/services/file-system/file-system.service";
import { FileSystemStorageService } from "@core/services/file-system/file-system-storage.service";
import { BehaviorSubject } from "rxjs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { normalizeFile } from "./file-store";
import { createZip, readZip } from "./zip";

/** The files in memory, as FileSystemStorageService keeps them */
class FakeStorage {
  public readonly items$ = new BehaviorSubject<InterfaceFileItem[]>([]);
  public removed: string[] = [];

  changes() {
    return this.items$.asObservable();
  }

  async getFiles() {
    return this.items$.value;
  }

  async getFile(key: string) {
    return this.items$.value.find((item) => item.key === key);
  }

  async save(items: InterfaceFileItem[]) {
    const keys = new Set(items.map((item) => item.key));
    this.items$.next([...this.items$.value.filter((item) => !keys.has(item.key)), ...items.map(normalizeFile)]);
  }

  async remove(items: InterfaceFileItem[]) {
    this.removed.push(...items.map((item) => item.key));
    const keys = new Set(items.map((item) => item.key));
    this.items$.next(this.items$.value.filter((item) => !keys.has(item.key)));
  }

  async fetchExample(path: string) {
    return `; ${path}`;
  }
}

const item = (path: string, name: string, isDirectory: boolean, content = "") =>
  normalizeFile({ key: `${path}/${name}`, $key: `${path}/${name}`, path, name, isDirectory, content, dateModified: 1 });

describe("FileSystemService", () => {
  let service: FileSystemService;
  let storage: FakeStorage;
  const byName = (name: string) => service.items.find((value) => value.name === name) as InterfaceFileItem;
  const root = new FileSystemItem("", true, []);

  beforeEach(async () => {
    storage = new FakeStorage();
    TestBed.configureTestingModule({ providers: [{ provide: FileSystemStorageService, useValue: storage }] });
    service = TestBed.inject(FileSystemService);
    await storage.save([
      item("", "practica", true),
      item("practica", "bucle.s", false, "bucle"),
      item("practica", "datos", true),
      item("practica/datos", "tabla.s", false, "tabla"),
      item("", "otro.s", false, "otro"),
    ]);
  });

  afterEach(() => TestBed.resetTestingModule());

  it("joins paths from the root folder", () => {
    expect(FileSystemService.join("", "practica")).toBe("practica");
    expect(FileSystemService.join("practica", "datos")).toBe("practica/datos");
    expect(FileSystemService.join("", "")).toBe("");
    expect(FileSystemService.isInside("practica/datos", "practica")).toBe(true);
    expect(FileSystemService.isInside("practicas", "practica")).toBe(false);
  });

  it("deletes a folder with everything inside it", async () => {
    await service.deleteItem(byName("practica"));
    expect(storage.removed.sort()).toEqual(["/practica", "practica/bucle.s", "practica/datos", "practica/datos/tabla.s"].sort());
    expect(service.items.map((value) => value.name)).toEqual(["otro.s"]);
  });

  it("does not move a folder into itself", async () => {
    await expect(service.moveItem(byName("practica") as never, byName("datos"))).rejects.toThrow(/into itself/);
  });

  it("moves a folder and its contents to the root, with a free name", async () => {
    await storage.save([item("", "datos", false)]);
    await service.moveItem(byName("tabla.s") as never, root);
    await service.moveItem(service.items.find((value) => value.name === "datos" && value.isDirectory) as never, root);
    expect(service.items.find((value) => value.name === "datos (2)")?.path).toBe("");
    expect(byName("tabla.s").path).toBe("");
  });

  it("renames a folder and the paths of what is inside it", async () => {
    await service.renameItem(byName("practica"), "practica-1");
    expect(byName("bucle.s").path).toBe("practica-1");
    expect(byName("tabla.s").path).toBe("practica-1/datos");
  });

  it("does not accept a taken or invalid name", async () => {
    await expect(service.renameItem(byName("otro.s"), "Practica")).rejects.toBeInstanceOf(InvalidNameError);
    await expect(service.createDirectory(root, "a/b")).rejects.toMatchObject({ reason: "INVALID_CHARACTERS" });
    // Its own name, with other capitals, is not taken
    await expect(service.renameItem(byName("otro.s"), "Otro.s")).resolves.toMatchObject({ name: "Otro.s" });
  });

  it("names the new files nuevo.s, nuevo (2).s...", async () => {
    await service.createFile(root, ".s");
    await service.createFile(root, ".s");
    expect(service.namesIn("").filter((name) => name.startsWith("nuevo"))).toEqual(["nuevo.s", "nuevo (2).s"]);
  });

  it("saves the text of the editor, and creates again a file that was deleted", async () => {
    const saved = await service.editFileItem({ ...byName("otro.s"), content: "nuevo texto" });
    expect(byName("otro.s").content).toBe("nuevo texto");
    expect(saved.dateModified).toBeGreaterThan(1);
    const again = await service.editFileItem({ ...item("", "perdido.s", false), key: "missing", content: "x" });
    expect(again.key).not.toBe("missing");
    expect(byName("perdido.s").content).toBe("x");
  });

  it("imports programs and ZIP files with their folders, with free names", async () => {
    const zip = createZip([
      { path: "practica/bucle.s", content: "otro bucle" },
      { path: "nueva/carpeta/a.s", content: "a" },
      { path: "imagen.png", content: "?" },
    ]);
    const count = await service.importFiles(
      [new File(["texto"], "otro.s"), new File([await zip.arrayBuffer()], "curso.zip", { type: "application/zip" })],
      "",
    );
    expect(count).toBe(3);
    expect(byName("otro (2).s").content).toBe("texto");
    expect(service.items.filter((value) => value.path === "practica").map((value) => value.name).sort()).toEqual(["bucle (2).s", "bucle.s", "datos"]);
    expect(byName("a.s").path).toBe("nueva/carpeta");
    expect(service.items.filter((value) => value.isDirectory && value.name === "practica")).toHaveLength(1);
  });

  it("downloads one file as it is, and a folder as a ZIP with its folders", async () => {
    const one = service.exportItems([byName("otro.s") as never]);
    expect(one.name).toBe("otro.s");
    expect(await one.blob.text()).toBe("otro");
    const folder = service.exportItems([byName("practica") as never]);
    expect(folder.name).toBe("practica.zip");
    expect((await readZip(await folder.blob.arrayBuffer())).map((entry) => entry.path).sort()).toEqual(["practica/bucle.s", "practica/datos/tabla.s"]);
    const all = service.exportItems([]);
    expect(all.name).toBe("thumder.zip");
    expect(await readZip(await all.blob.arrayBuffer())).toHaveLength(3);
  });
});
