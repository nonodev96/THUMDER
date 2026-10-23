import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { IDBFactory } from "fake-indexeddb";
import { firstValueFrom } from "rxjs";
import { filter } from "rxjs/operators";
import type { InterfaceFileItem } from "@app/Types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { normalizeFile } from "./file-store";
import { FileSystemStorageService, LOCAL_FILE_ITEMS_KEY } from "./file-system-storage.service";

describe("FileSystemStorageService as a guest (no Firebase)", () => {
  const start = () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    return TestBed.inject(FileSystemStorageService);
  };

  beforeEach(() => {
    localStorage.clear();
    // A new, empty IndexedDB for each test
    (globalThis as { indexedDB: IDBFactory }).indexedDB = new IDBFactory();
  });

  afterEach(() => TestBed.resetTestingModule());

  it("moves the files of the versions before IndexedDB, with their dates as numbers", async () => {
    localStorage.setItem(LOCAL_FILE_ITEMS_KEY, JSON.stringify([{ $key: "k1", key: "a", name: "prim.s", content: "x", dateModified: "1970-01-01T00:00:02Z" }, { name: "sin-clave.s" }]));
    const storage = start();
    const files = await storage.getFiles();
    expect(files.map((file) => file.name)).toEqual(["prim.s", "sin-clave.s"]);
    expect(files[0]).toMatchObject({ key: "a", $key: "k1", dateModified: 2000 });
    expect(files[1].key).not.toBe("");
    expect(localStorage.getItem(LOCAL_FILE_ITEMS_KEY)).toBeNull();
    expect(storage.syncState()).toBe("guest");
  });

  it("saves and deletes files in the browser, for the guest", async () => {
    const storage = start();
    const changed = firstValueFrom(storage.changes().pipe(filter((items) => items.length === 2)));
    await storage.save([normalizeFile({ key: "b", name: "b.s" }), normalizeFile({ key: "a", name: "a.s" })]);
    expect((await changed).map((file) => file.name)).toEqual(["a.s", "b.s"]);
    expect((await storage.getFile("a"))?.e1_uid).toBe("local");
    expect((await storage.getFile("a"))?.$key).toBe("a");
    await storage.remove([normalizeFile({ key: "a" })]);
    expect((await storage.getFiles()).map((file) => file.key)).toEqual(["b"]);
    // A new start reads them from IndexedDB
    TestBed.resetTestingModule();
    expect((await start().getFiles()).map((file) => file.key)).toEqual(["b"]);
  });

  it("creates the two classic programs the first time, and not again", async () => {
    const storage = start();
    const http = TestBed.inject(HttpTestingController);
    const creating = storage.generateDefaultFiles();
    // Each request is made once the files of IndexedDB are read and the previous one has arrived
    for (const name of ["prim.s", "win-dlx.s"]) {
      let found = http.match(`assets/examples-dlx/${name}`);
      for (let i = 0; i < 200 && found.length === 0; i++) {
        await new Promise((resolve) => setTimeout(resolve, 5));
        found = http.match(`assets/examples-dlx/${name}`);
      }
      expect(found).toHaveLength(1);
      found[0].flush(`; ${name}`);
    }
    expect(await creating).toBe(0);
    expect((await storage.getFiles()).map((file) => file.name)).toEqual(["prim.s", "win-dlx.s"]);
    expect(await storage.generateDefaultFiles()).toBe(1);
    http.verify();
  });

  it("has nothing to synchronise without an account", async () => {
    const storage = start();
    expect(await storage.sync()).toBe(false);
    expect(await storage.disconnect()).toBe(true);
  });
});

describe("FileSystemStorageService with an account", () => {
  /** The account in memory: like firestore.rules, it can refuse a file (`refuse`) or a deletion (`failDeletes`) */
  class FakeAccount {
    public docs = new Map<string, InterfaceFileItem>();
    public refuse = new Set<string>();
    public failDeletes = false;
    public readonly files = {
      all: async (uid: string) => [...this.docs.values()].filter((file) => file.e1_uid === uid).map((file) => ({ ...file })),
      put: async (file: InterfaceFileItem) => {
        if (this.refuse.has(file.name)) throw new Error("PERMISSION_DENIED");
        this.docs.set(file.$key, { ...file });
      },
      remove: async (id: string) => {
        if (this.failDeletes) throw new Error("unavailable");
        this.docs.delete(id);
      },
    };
  }

  let storage: FileSystemStorageService;
  let account: FakeAccount;
  const names = async () => (await storage.getFiles()).map((file) => file.name).sort();

  beforeEach(() => {
    for (const level of ["warn", "info"] as const) vi.spyOn(console, level).mockImplementation(() => undefined);
    localStorage.clear();
    (globalThis as { indexedDB: IDBFactory }).indexedDB = new IDBFactory();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    storage = TestBed.inject(FileSystemStorageService);
    account = new FakeAccount();
    storage.remoteFiles = account.files;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it("joins the files of the guest to the account when the person signs in", async () => {
    await storage.save([normalizeFile({ key: "a", name: "a.s", dateModified: 1 })]);
    await storage.connect("ana");
    expect(storage.syncState()).toBe("synced");
    expect(account.docs.get("a")).toMatchObject({ e1_uid: "ana", name: "a.s" });
    expect(await storage.getFile("a")).toMatchObject({ e1_uid: "ana", syncedAt: 1 });
  });

  it("a file the account refuses does not stop the others, is not lost and goes in the next synchronisation", async () => {
    account.refuse.add("malo.s");
    await storage.save([normalizeFile({ key: "a", name: "a.s", dateModified: 1 }), normalizeFile({ key: "m", name: "malo.s", dateModified: 1 })]);
    await storage.connect("ana");
    expect(storage.syncState()).toBe("error");
    expect([...account.docs.keys()]).toEqual(["a"]);
    expect((await storage.getFile("m"))?.syncedAt).toBeUndefined();
    // Again, still refused: it stays here
    expect(await storage.sync()).toBe(false);
    expect(await names()).toEqual(["a.s", "malo.s"]);
    account.refuse.clear();
    expect(await storage.sync()).toBe(true);
    expect([...account.docs.keys()].sort()).toEqual(["a", "m"]);
  });

  it("a deletion that does not reach the account is made in the next synchronisation", async () => {
    await storage.save([normalizeFile({ key: "a", name: "a.s", dateModified: 1 })]);
    await storage.connect("ana");
    account.failDeletes = true;
    await storage.remove([normalizeFile({ key: "a", $key: "a" })]);
    expect(storage.syncState()).toBe("error");
    expect(account.docs.has("a")).toBe(true);
    account.failDeletes = false;
    expect(await storage.sync()).toBe(true);
    expect(account.docs.has("a")).toBe(false);
    expect(await names()).toEqual([]);
  });

  it("a file deleted on another device goes from here too, unless it changed here", async () => {
    await storage.save([normalizeFile({ key: "a", name: "a.s", dateModified: 1 }), normalizeFile({ key: "b", name: "b.s", dateModified: 1 })]);
    await storage.connect("ana");
    // Another device deletes both; meanwhile, here, b changes without a connection (the change does not arrive)
    account.docs.delete("a");
    account.docs.delete("b");
    account.refuse.add("b.s");
    await storage.save([{ ...(await storage.getFile("b"))!, content: "cambiado", dateModified: 5 }]);
    account.refuse.clear();
    expect(await storage.sync()).toBe(true);
    expect(await names()).toEqual(["b.s"]);
    expect(account.docs.get("b")?.content).toBe("cambiado");
  });

  it("deleting the account deletes its files there and here, and only if they all went from the account", async () => {
    await storage.save([normalizeFile({ key: "a", name: "a.s", dateModified: 1 }), normalizeFile({ key: "b", name: "b.s", dateModified: 1 })]);
    await storage.connect("ana");
    // The files of another person stay
    account.docs.set("x", normalizeFile({ key: "x", $key: "x", name: "x.s", e1_uid: "eva" }));
    account.failDeletes = true;
    expect(await storage.deleteAccountFiles()).toBe(false);
    expect(await names()).toEqual(["a.s", "b.s"]);
    expect(storage.syncState()).not.toBe("guest");
    account.failDeletes = false;
    expect(await storage.deleteAccountFiles()).toBe(true);
    expect([...account.docs.keys()]).toEqual(["x"]);
    expect(await names()).toEqual([]);
    expect(storage.syncState()).toBe("guest");
    expect(storage.owner).toBe("local");
  });
});
