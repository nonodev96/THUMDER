import type { InterfaceFileItem } from "@app/Types";
import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";
import { IndexedDbFileStore, mergePlan, missingFolders, normalizeFile, remoteFile, toMillis } from "./file-store";

const file = (key: string, dateModified: number, extra: Partial<InterfaceFileItem> = {}) =>
  normalizeFile({ key, $key: key, name: `${key}.s`, content: key, dateModified, e1_uid: "local", ...extra });

describe("normalizeFile", () => {
  it("turns every kind of date into milliseconds (DAT-04)", () => {
    expect(toMillis(1000)).toBe(1000);
    expect(toMillis(new Date(2000))).toBe(2000);
    expect(toMillis({ seconds: 3, nanoseconds: 500_000_000 })).toBe(3500);
    expect(toMillis({ toMillis: () => 42 })).toBe(42);
    expect(toMillis("1970-01-01T00:00:05.000Z")).toBe(5000);
    expect(toMillis("not a date")).toBe(0);
    expect(toMillis(undefined)).toBe(0);
  });

  it("gives every field its type, the path keys from the path and the size from the content", () => {
    const item = normalizeFile({ $key: "a", name: 3, path: "p/q", content: "abc", isDirectory: "yes", dateModified: "1970-01-01T00:00:01Z" });
    expect(item).toMatchObject({ $key: "a", key: "a", name: "", path: "p/q", pathKeys: ["p", "q"], size: 3, isDirectory: false, dateModified: 1000 });
    expect(normalizeFile(null).key).toBe("");
  });

  it("does not send to the account what only this device knows", () => {
    expect(remoteFile(file("a", 1, { syncedAt: 1, $key: "" }), "u1")).toMatchObject({ $key: "a", e1_uid: "u1" });
    expect("syncedAt" in remoteFile(file("a", 1, { syncedAt: 1 }), "u1")).toBe(false);
  });
});

describe("missingFolders", () => {
  it("creates the folders of the paths that are not there, once", () => {
    let n = 0;
    const items = [file("a", 1, { path: "p/q" }), file("b", 1, { path: "p" }), normalizeFile({ key: "r", name: "r", path: "", isDirectory: true })];
    const missing = missingFolders([...items, file("c", 1, { path: "r/s" })], () => `new-${++n}`, 5);
    expect(missing.map((item) => [item.path, item.name, item.isDirectory, item.key])).toEqual([
      ["", "p", true, "new-1"],
      ["p", "q", true, "new-2"],
      ["r", "s", true, "new-3"],
    ]);
    expect(missingFolders([...items, ...missing], () => "x")).toEqual([]);
  });
});

describe("mergePlan", () => {
  it("uploads the files of the guest, as files of the account", () => {
    const plan = mergePlan([file("a", 10)], [], [], "u1");
    expect(plan.toRemote).toHaveLength(1);
    expect(plan.toRemote[0]).toMatchObject({ key: "a", $key: "a", e1_uid: "u1" });
    expect([plan.toLocal, plan.removeLocal, plan.removeRemote]).toEqual([[], [], []]);
  });

  it("downloads the files of the account that are not here", () => {
    const plan = mergePlan([], [file("b", 10, { $key: "doc-b", e1_uid: "u1" })], [], "u1");
    expect(plan.toLocal.map((item) => item.$key)).toEqual(["doc-b"]);
  });

  it("keeps the newer version of a file that is in both", () => {
    const plan = mergePlan([file("a", 20), file("b", 5)], [file("a", 10), file("b", 15)], [], "u1");
    expect(plan.toRemote.map((item) => item.key)).toEqual(["a"]);
    expect(plan.toLocal.map((item) => item.key)).toEqual(["b"]);
  });

  it("does nothing with the files that are the same", () => {
    const plan = mergePlan([file("a", 10)], [file("a", 10)], [], "u1");
    expect([plan.toLocal, plan.toRemote, plan.removeLocal, plan.removeRemote]).toEqual([[], [], [], []]);
  });

  it("deletes from the account what was deleted here, unless it changed there afterwards", () => {
    const plan = mergePlan([], [file("a", 10), file("b", 30)], [{ key: "a", at: 20 }, { key: "b", at: 20 }], "u1");
    expect(plan.removeRemote.map((item) => item.key)).toEqual(["a"]);
    expect(plan.toLocal.map((item) => item.key)).toEqual(["b"]);
  });

  it("deletes here what was deleted on another device, unless it changed here afterwards", () => {
    const plan = mergePlan([file("a", 10, { syncedAt: 10 }), file("b", 30, { syncedAt: 10 })], [], [], "u1");
    expect(plan.removeLocal).toEqual(["a"]);
    expect(plan.toRemote.map((item) => item.key)).toEqual(["b"]);
  });

  it("removes the copies of a file that older versions left in the account", () => {
    const plan = mergePlan([file("a", 10)], [file("a", 10, { $key: "doc-1" }), file("a", 10, { $key: "doc-2" })], [], "u1");
    expect(plan.removeRemote.map((item) => item.$key)).toEqual(["doc-2"]);
  });
});

describe("IndexedDbFileStore", () => {
  const store = () => new IndexedDbFileStore(new IDBFactory());

  it("keeps the files by key, replaces them and deletes them", async () => {
    const files = store();
    await files.put([file("a", 1), file("b", 2)]);
    await files.put([file("a", 3, { content: "new" })]);
    expect((await files.all()).map((item) => [item.key, item.content])).toEqual([
      ["a", "new"],
      ["b", "b"],
    ]);
    await files.remove(["a"]);
    expect((await files.all()).map((item) => item.key)).toEqual(["b"]);
  });

  it("remembers the deletions until they are forgotten, and a file created again is not deleted", async () => {
    const files = store();
    await files.put([file("a", 1), file("b", 1)]);
    await files.remove(["a", "b"]);
    await files.remove(["c"], false);
    expect((await files.tombstones()).map((tombstone) => tombstone.key).sort()).toEqual(["a", "b"]);
    await files.put([file("a", 5)]);
    expect((await files.tombstones()).map((tombstone) => tombstone.key)).toEqual(["b"]);
    await files.forget(["b"]);
    expect(await files.tombstones()).toEqual([]);
  });

  it("clears everything", async () => {
    const files = store();
    await files.put([file("a", 1)]);
    await files.remove(["a"]);
    await files.put([file("b", 1)]);
    await files.clear();
    expect([await files.all(), await files.tombstones()]).toEqual([[], []]);
  });
});
