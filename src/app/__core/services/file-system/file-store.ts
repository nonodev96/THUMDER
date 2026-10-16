import type { InterfaceFileItem } from "@app/Types";

// Where the files of the file manager are kept. The browser (IndexedDB) is always the first copy, so THUMDER works with
// no account and no connection; with an account, Firestore is a second copy that synchronises the devices (merge).

/** A file deleted here: kept until the deletion reaches the other copy */
export type Tombstone = { key: string; at: number };

export interface FileStore {
  all(): Promise<InterfaceFileItem[]>;
  /** Creates or replaces the files (by `key`) */
  put(items: InterfaceFileItem[]): Promise<void>;
  remove(keys: string[]): Promise<void>;
}

/** The milliseconds of a date as it may come: a number, a Date, a Timestamp of Firestore or a text (DAT-04) */
export function toMillis(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "object" && value !== null) {
    const timestamp = value as { toMillis?: () => number; seconds?: number; nanoseconds?: number };
    if (typeof timestamp.toMillis === "function") return timestamp.toMillis();
    if (typeof timestamp.seconds === "number") return timestamp.seconds * 1000 + Math.floor((timestamp.nanoseconds ?? 0) / 1e6);
  }
  if (typeof value === "string") {
    const time = Date.parse(value);
    if (Number.isFinite(time)) return time;
  }
  return 0;
}

const text = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);

/** A file as THUMDER keeps it, whatever version or copy it comes from: plain data, with every field and its type */
export function normalizeFile(raw: unknown): InterfaceFileItem {
  const item = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const path = text(item.path);
  const content = text(item.content);
  return {
    $key: text(item.$key),
    f_id: text(item.f_id),
    e1_uid: text(item.e1_uid),
    key: text(item.key, text(item.$key)),
    path,
    pathKeys: path ? path.split("/") : [],
    name: text(item.name),
    content,
    description: text(item.description),
    dateModified: toMillis(item.dateModified),
    size: item.isDirectory === true ? 0 : content.length,
    isDirectory: item.isDirectory === true,
    hasSubDirectories: item.hasSubDirectories === true,
    thumbnail: text(item.thumbnail),
    dataItem: item.dataItem ?? null,
    ...(typeof item.syncedAt === "number" ? { syncedAt: item.syncedAt } : {}),
  };
}

/** A file as it goes to the account: without what only this device knows */
export function remoteFile(item: InterfaceFileItem, uid: string): InterfaceFileItem {
  const { syncedAt: _, ...file } = normalizeFile(item);
  return { ...file, $key: file.$key || file.key, e1_uid: uid };
}

/**
 * The folders that the files name in their path but that are not there (the versions before 1.7 could leave them, and
 * an account can bring them): `newKey` gives the key of each one
 */
export function missingFolders(items: InterfaceFileItem[], newKey: () => string, now = Date.now()): InterfaceFileItem[] {
  const folders = new Set(items.filter((item) => item.isDirectory).map((item) => (item.path ? `${item.path}/${item.name}` : item.name)));
  const missing: InterfaceFileItem[] = [];
  for (const item of items) {
    const parts = item.path ? item.path.split("/") : [];
    for (let i = 1; i <= parts.length; i++) {
      const full = parts.slice(0, i).join("/");
      if (folders.has(full)) continue;
      folders.add(full);
      const key = newKey();
      missing.push(
        normalizeFile({
          key,
          $key: key,
          name: parts[i - 1],
          path: parts.slice(0, i - 1).join("/"),
          isDirectory: true,
          dateModified: now,
          e1_uid: item.e1_uid,
        }),
      );
    }
  }
  return missing;
}

/** What a synchronisation has to do so the two copies end up with the same files */
export type MergePlan = {
  /** Write here (they are newer there, or only there) */
  toLocal: InterfaceFileItem[];
  /** Write there */
  toRemote: InterfaceFileItem[];
  /** Delete here: synchronised before, gone from the account and not changed here since (deleted on another device) */
  removeLocal: string[];
  /** Delete there: deleted here after its last change there */
  removeRemote: InterfaceFileItem[];
};

/**
 * The plan to synchronise this device with the account. Each file is the same in both copies when it has the same
 * `key`; the newer one wins. A file deleted here goes from the account too, unless it changed there afterwards, and a
 * file deleted on another device goes from here, unless it changed here afterwards. The files of the guest become files
 * of the account (`uid`).
 */
export function mergePlan(local: InterfaceFileItem[], remote: InterfaceFileItem[], tombstones: Tombstone[], uid: string): MergePlan {
  const plan: MergePlan = { toLocal: [], toRemote: [], removeLocal: [], removeRemote: [] };
  const locals = new Map(local.map((item) => [item.key, item]));
  const deleted = new Map(tombstones.map((tombstone) => [tombstone.key, tombstone.at]));
  const seen = new Set<string>();
  for (const there of remote) {
    if (seen.has(there.key)) {
      // The same file twice in the account (older versions created copies): the extra document goes
      plan.removeRemote.push(there);
      continue;
    }
    seen.add(there.key);
    const here = locals.get(there.key);
    const deletedAt = deleted.get(there.key);
    if (here === undefined) {
      if (deletedAt !== undefined && deletedAt >= there.dateModified) plan.removeRemote.push(there);
      else plan.toLocal.push(there);
    } else if (here.dateModified > there.dateModified) {
      plan.toRemote.push(remoteFile({ ...here, $key: there.$key }, uid));
    } else if (here.dateModified < there.dateModified || here.$key !== there.$key) {
      plan.toLocal.push(there);
    }
  }
  for (const here of local) {
    if (seen.has(here.key)) continue;
    if (here.syncedAt !== undefined && here.dateModified <= here.syncedAt) plan.removeLocal.push(here.key);
    else plan.toRemote.push(remoteFile(here, uid));
  }
  return plan;
}

// ─── IndexedDB ────────────────────────────────────────────────────────────────────────────────────────────────────

const DB_NAME = "thumder";
const DB_VERSION = 1;
const FILES = "files";
const DELETED = "deleted";

const done = <T>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const finished = (transaction: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });

/** The files in the browser (IndexedDB), with the deletions not yet sent to the account */
export class IndexedDbFileStore implements FileStore {
  private db: Promise<IDBDatabase> | null = null;

  constructor(
    private readonly factory: IDBFactory = indexedDB,
    private readonly name = DB_NAME,
  ) {}

  private open(): Promise<IDBDatabase> {
    this.db ??= new Promise((resolve, reject) => {
      const request = this.factory.open(this.name, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(FILES)) db.createObjectStore(FILES, { keyPath: "key" });
        if (!db.objectStoreNames.contains(DELETED)) db.createObjectStore(DELETED, { keyPath: "key" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return this.db;
  }

  public async all(): Promise<InterfaceFileItem[]> {
    const db = await this.open();
    const items = await done(db.transaction(FILES).objectStore(FILES).getAll());
    return items.map(normalizeFile);
  }

  public async put(items: InterfaceFileItem[]): Promise<void> {
    if (items.length === 0) return;
    const db = await this.open();
    const transaction = db.transaction([FILES, DELETED], "readwrite");
    for (const item of items) {
      transaction.objectStore(FILES).put(normalizeFile(item));
      // A file that comes back (synchronised or created again) is not deleted any more
      transaction.objectStore(DELETED).delete(item.key);
    }
    await finished(transaction);
  }

  /** Deletes the files and remembers it (`track`), so the synchronisation deletes them from the account too */
  public async remove(keys: string[], track = true): Promise<void> {
    if (keys.length === 0) return;
    const db = await this.open();
    const transaction = db.transaction([FILES, DELETED], "readwrite");
    const at = Date.now();
    for (const key of keys) {
      transaction.objectStore(FILES).delete(key);
      if (track) transaction.objectStore(DELETED).put({ key, at } satisfies Tombstone);
    }
    await finished(transaction);
  }

  public async tombstones(): Promise<Tombstone[]> {
    const db = await this.open();
    return done(db.transaction(DELETED).objectStore(DELETED).getAll());
  }

  public async forget(keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    const db = await this.open();
    const transaction = db.transaction(DELETED, "readwrite");
    for (const key of keys) transaction.objectStore(DELETED).delete(key);
    await finished(transaction);
  }

  /** Everything goes (signing out of an account) */
  public async clear(): Promise<void> {
    const db = await this.open();
    const transaction = db.transaction([FILES, DELETED], "readwrite");
    transaction.objectStore(FILES).clear();
    transaction.objectStore(DELETED).clear();
    await finished(transaction);
  }

  public close(): void {
    void this.db?.then((db) => db.close());
    this.db = null;
  }
}
