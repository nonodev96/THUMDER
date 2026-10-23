import { HttpClient } from "@angular/common/http";
import { EnvironmentInjector, Injectable, inject, runInInjectionContext, signal } from "@angular/core";
import { collection, deleteDoc, doc, Firestore, getDocs, query, setDoc, where } from "@angular/fire/firestore";
import { LOCAL_USER } from "@app/CONSTANTS";
import type { InterfaceFileItem } from "@app/Types";
import { Utils } from "@app/Utils";
import type { Exercise } from "@core/exercises/exercises";
import { logger } from "@core/logger/logger";
import { BehaviorSubject, firstValueFrom, type Observable } from "rxjs";
import { isBuiltin } from "./builtin-files";
import { IndexedDbFileStore, mergePlan, missingFolders, normalizeFile, remoteFile } from "./file-store";

/** Where the files were kept before IndexedDB (moved to it the first time) */
export const LOCAL_FILE_ITEMS_KEY = "local_file_items";

/** The collection of the files in Firestore */
const REMOTE_PATH = "file-items";

/** The copy of the files in the account: Firestore (the tests use another one) */
export type RemoteFiles = {
  all(uid: string): Promise<InterfaceFileItem[]>;
  put(file: InterfaceFileItem): Promise<void>;
  remove(id: string): Promise<void>;
};

/** How the files of this device are with the account */
export type SyncState = "guest" | "syncing" | "synced" | "error";

/**
 * The files of the file manager (DAT-01, DAT-02). They are always in the browser (IndexedDB), with or without an
 * account; with an account they are also in Firestore, and `sync` joins both copies (file-store.ts, mergePlan). Every
 * change goes to the browser first and then, if possible, to the account; what could not be sent goes in the next
 * synchronisation.
 */
@Injectable({ providedIn: "root" })
export class FileSystemStorageService {
  private httpClient = inject(HttpClient);
  private injector = inject(EnvironmentInjector);
  // Missing without Firebase keys: THUMDER has no accounts
  private firestore = inject(Firestore, { optional: true });

  private readonly local = new IndexedDbFileStore();
  private readonly items$ = new BehaviorSubject<InterfaceFileItem[]>([]);
  private readonly ready: Promise<void>;
  /** The account the files are synchronised with, if any */
  private uid: string | null = null;
  private syncing: Promise<void> | null = null;
  private persistenceAsked = false;

  private readonly syncStateSignal = signal<SyncState>("guest");
  public readonly syncState = this.syncStateSignal.asReadonly();

  constructor() {
    this.ready = this.load();
  }

  /** The owner of the new files: the account, or the guest */
  public get owner(): string {
    return this.uid ?? LOCAL_USER.uid;
  }

  private async load(): Promise<void> {
    try {
      await this.moveFromLocalStorage();
      await this.refresh();
    } catch (error) {
      // No IndexedDB (a private window of an old browser): the files live in memory until the page closes
      logger.error(error);
    }
  }

  /** The files of the versions before IndexedDB (localStorage) */
  private async moveFromLocalStorage(): Promise<void> {
    const saved = localStorage.getItem(LOCAL_FILE_ITEMS_KEY);
    if (saved === null) return;
    try {
      const items = (JSON.parse(saved) as unknown[]).map(normalizeFile).map((item) => ({ ...item, key: item.key || Utils.uuidv4() }));
      await this.local.put(items);
    } catch (error) {
      logger.error(error);
      return;
    }
    localStorage.removeItem(LOCAL_FILE_ITEMS_KEY);
  }

  private async refresh(): Promise<void> {
    const items = await this.local.all();
    // A file in a folder that is not there: the folder is created (and goes to the account in the next synchronisation)
    const missing = missingFolders(items, Utils.uuidv4);
    if (missing.length > 0) {
      await this.local.put(missing);
      items.push(...missing);
    }
    this.items$.next(items.sort((a, b) => a.name.localeCompare(b.name)));
  }

  /** The files, in order of name, every time they change */
  public changes(): Observable<InterfaceFileItem[]> {
    return this.items$.asObservable();
  }

  public async getFiles(): Promise<InterfaceFileItem[]> {
    await this.ready;
    return this.items$.value;
  }

  public async getFile(key: string): Promise<InterfaceFileItem | undefined> {
    return (await this.getFiles()).find((item) => item.key === key);
  }

  /** Creates or replaces files, here and in the account (the files of THUMDER are never saved) */
  public async save(items: InterfaceFileItem[]): Promise<void> {
    await this.ready;
    const files = items
      .filter((item) => !isBuiltin(item))
      .map((item) => normalizeFile({ ...item, e1_uid: this.owner, $key: item.$key || item.key }));
    try {
      await this.local.put(files);
    } catch (error) {
      // Without IndexedDB the list in memory is the only copy
      logger.error(error);
      const keys = new Set(files.map((file) => file.key));
      this.items$.next([...this.items$.value.filter((item) => !keys.has(item.key)), ...files].sort((a, b) => a.name.localeCompare(b.name)));
      return;
    }
    await this.refresh();
    this.askPersistence();
    if (this.uid !== null) await this.remote(() => this.putRemote(files));
  }

  /**
   * The browser, and iOS in its applications, may delete what a page keeps when the device is short of space: the
   * first file saved asks to keep it (navigator.storage.persist). The files of a guest are only here
   */
  private askPersistence(): void {
    if (this.persistenceAsked) return;
    this.persistenceAsked = true;
    globalThis.navigator?.storage
      ?.persist?.()
      .then((kept) => logger.info(`The files are ${kept ? "" : "not "}kept when space is short`))
      .catch((error: unknown) => logger.warn(error));
  }

  /** Deletes files, here and in the account */
  public async remove(all: InterfaceFileItem[]): Promise<void> {
    await this.ready;
    const items = all.filter((item) => !isBuiltin(item));
    try {
      await this.local.remove(items.map((item) => item.key));
      await this.refresh();
    } catch (error) {
      logger.error(error);
      const keys = new Set(items.map((item) => item.key));
      this.items$.next(this.items$.value.filter((item) => !keys.has(item.key)));
    }
    if (this.uid !== null) {
      await this.remote(async () => {
        const removed = await this.removeRemote(items);
        await this.local.forget(removed.map((item) => item.key));
        if (removed.length < items.length) throw new Error("Some files could not be deleted from the account");
      });
    }
  }

  /** A change in the account: if it fails (no connection), the next synchronisation sends it */
  private async remote(change: () => Promise<void>): Promise<void> {
    try {
      await change();
      if (this.syncStateSignal() === "error") await this.sync();
      else this.syncStateSignal.set("synced");
    } catch (error) {
      logger.warn(error);
      this.syncStateSignal.set("error");
    }
  }

  // ─── The account ────────────────────────────────────────────────────────────────────────────────────────────────

  private inContext<T>(call: () => Promise<T>): Promise<T> {
    // @angular/fire wants its calls in an injection context
    return runInInjectionContext(this.injector, call);
  }

  private get db(): Firestore {
    if (this.firestore === null) throw new Error("THUMDER has no accounts (no Firebase keys)");
    return this.firestore;
  }

  /** The files in Firestore, in the collection of the files, by the id of each document ($key) */
  public remoteFiles: RemoteFiles = {
    all: async (uid) => {
      const snapshot = await this.inContext(() => getDocs(query(collection(this.db, REMOTE_PATH), where("e1_uid", "==", uid))));
      return snapshot.docs.map((document) => normalizeFile({ ...document.data(), $key: document.id }));
    },
    put: (file) => this.inContext(() => setDoc(doc(this.db, REMOTE_PATH, file.$key), file)),
    remove: (id) => this.inContext(() => deleteDoc(doc(this.db, REMOTE_PATH, id))),
  };

  /** A write to the account, one file at a time: a file it does not take does not stop the others */
  private async attempt(name: string, write: () => Promise<unknown>): Promise<boolean> {
    try {
      await write();
      return true;
    } catch (error) {
      logger.warn(`The account did not take ${name}`, error);
      return false;
    }
  }

  /** Sends files to the account. Returns those that arrived */
  private async uploadAll(items: InterfaceFileItem[], uid: string): Promise<InterfaceFileItem[]> {
    const sent: InterfaceFileItem[] = [];
    for (const item of items) {
      const file = remoteFile(item, uid);
      if (await this.attempt(file.name, () => this.remoteFiles.put(file))) sent.push(item);
    }
    return sent;
  }

  private async putRemote(items: InterfaceFileItem[]): Promise<void> {
    const uid = this.uid;
    if (uid === null) return;
    const sent = await this.uploadAll(items, uid);
    // Only what is in the account is synchronised: the rest goes again in the next synchronisation
    await this.local.put(sent.map((item) => ({ ...item, e1_uid: uid, syncedAt: item.dateModified })));
    await this.refresh();
    if (sent.length < items.length) throw new Error("Some files could not be sent to the account");
  }

  /** Deletes files from the account. Returns those that went */
  private async removeRemote(items: InterfaceFileItem[]): Promise<InterfaceFileItem[]> {
    const removed: InterfaceFileItem[] = [];
    for (const item of items) {
      if (await this.attempt(item.name, () => this.remoteFiles.remove(item.$key || item.key))) removed.push(item);
    }
    return removed;
  }

  /** Signed in with an account: from now on the files are synchronised with it (the ones of the guest join it) */
  public async connect(uid: string): Promise<void> {
    this.uid = uid;
    await this.sync();
  }

  /**
   * Joins the files of this device and the ones of the account, without copies (file-store.ts, mergePlan). Returns
   * whether it could; a second call while one is going on waits for it
   */
  public async sync(): Promise<boolean> {
    if (this.uid === null) return false;
    this.syncing ??= this.runSync(this.uid).finally(() => {
      this.syncing = null;
    });
    await this.syncing;
    return this.syncStateSignal() === "synced";
  }

  private async runSync(uid: string): Promise<void> {
    await this.ready;
    this.syncStateSignal.set("syncing");
    try {
      const [local, remote, tombstones] = await Promise.all([this.local.all(), this.remoteFiles.all(uid), this.local.tombstones()]);
      const plan = mergePlan(local, remote, tombstones, uid);
      const removed = new Set((await this.removeRemote(plan.removeRemote)).map((item) => item.key));
      // The deletions that did not reach the account are tried again next time
      const pending = new Set(plan.removeRemote.filter((item) => !removed.has(item.key)).map((item) => item.key));
      await this.local.forget(tombstones.filter((tombstone) => !pending.has(tombstone.key)).map((tombstone) => tombstone.key));
      await this.local.remove(plan.removeLocal, false);
      const sent = await this.uploadAll(plan.toRemote, uid);
      // A file the account did not take is not marked as synchronised: otherwise the next synchronisation would
      // think it was deleted on another device and delete it here
      const failed = new Set(plan.toRemote.filter((file) => !sent.includes(file)).map((file) => file.key));
      // Everything that is in both copies now is synchronised (the newer version of each file: the later ones win)
      const synced = [...local.filter((item) => !plan.removeLocal.includes(item.key)), ...sent, ...plan.toLocal].filter(
        (item) => !failed.has(item.key),
      );
      const latest = new Map(synced.map((item) => [item.key, item]));
      await this.local.put([...latest.values()].map((item) => ({ ...item, e1_uid: uid, syncedAt: item.dateModified })));
      await this.refresh();
      this.syncStateSignal.set(failed.size > 0 || pending.size > 0 ? "error" : "synced");
      logger.info(
        `Synchronised: ${plan.toLocal.length} from the account, ${plan.toRemote.length} to it, ${plan.removeLocal.length + plan.removeRemote.length} deleted`,
      );
    } catch (error) {
      logger.warn(error);
      this.syncStateSignal.set("error");
    }
  }

  /**
   * Signing out: what is not in the account yet goes (if it can), and the files leave this device (on a shared
   * computer the next person must not see them). Returns false, and keeps everything, if they could not be sent
   */
  public async disconnect(): Promise<boolean> {
    // A guest keeps the files: they are only in this browser
    if (this.uid === null) return true;
    if (!(await this.sync())) return false;
    this.uid = null;
    this.syncStateSignal.set("guest");
    await this.local.clear();
    await this.refresh();
    return true;
  }

  /**
   * Deleting the account: all its files go from the account and from this device (they are the files of the account),
   * and this device is a guest again. Returns false, and deletes nothing here, if the account did not delete them all
   * (without a connection, for example)
   */
  public async deleteAccountFiles(): Promise<boolean> {
    const uid = this.uid;
    if (uid === null) return true;
    await this.ready;
    try {
      const remote = await this.remoteFiles.all(uid);
      if ((await this.removeRemote(remote)).length < remote.length) return false;
    } catch (error) {
      logger.warn(error);
      return false;
    }
    this.uid = null;
    this.syncStateSignal.set("guest");
    await this.local.clear();
    await this.refresh();
    return true;
  }

  // ─── Examples ───────────────────────────────────────────────────────────────────────────────────────────────────

  /** The text of a file of src/assets/examples-dlx (for example "ejemplos/01-hola-mundo.s") */
  public async fetchExample(path: string): Promise<string> {
    return firstValueFrom(this.httpClient.get(`assets/examples-dlx/${path}`, { responseType: "text" }));
  }

  /** The catalogue of the guided exercises (src/assets/exercises/exercises.json) */
  public async fetchExercises(): Promise<Exercise[]> {
    return firstValueFrom(this.httpClient.get<Exercise[]>("assets/exercises/exercises.json"));
  }

  /** The first time (no files at all), two classic programs to start with */
  public async generateDefaultFiles(force = false): Promise<number> {
    if (!force && (await this.getFiles()).length > 0) return 1;
    const files: InterfaceFileItem[] = [];
    for (const name of ["prim.s", "win-dlx.s"]) {
      const content = await this.fetchExample(name);
      const key = Utils.uuidv4();
      files.push(normalizeFile({ key, $key: key, name, content, dateModified: Date.now() }));
    }
    await this.save(files);
    return 0;
  }
}
