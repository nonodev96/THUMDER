import { readFileSync } from "node:fs";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { ERRORS_COLLECTION, errorReport } from "../src/app/__core/errors/error-report";
import { normalizeFile, remoteFile } from "../src/app/__core/services/file-system/file-store";

// The rules of firestore.rules, against the Firestore emulator: pnpm test:rules. The documents are the ones THUMDER
// writes (file-store.ts: remoteFile, and AuthService.SetUserData), so the rules and the application cannot drift apart

let env: RulesTestEnvironment;

/** A file as FileSystemStorageService sends it to the account */
const file = (uid: string, extra: Record<string, unknown> = {}) =>
  remoteFile(normalizeFile({ key: "f1", name: "bucle.s", path: "", content: "loop: j loop\n", dateModified: 1, ...extra }), uid);

/** The profile as AuthService writes it when the person signs in */
const profile = (uid: string) => ({ uid, email: `${uid}@example.org`, displayName: uid, photoURL: "", emailVerified: true });

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-thumder",
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8085 },
  });
});

afterAll(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "file-items/f1"), file("ana"));
    await setDoc(doc(context.firestore(), "file-items/f2"), file("eva", { key: "f2" }));
    await setDoc(doc(context.firestore(), "users/ana"), profile("ana"));
  });
});

describe("file-items, as THUMDER uses them", () => {
  it("the owner lists their files with the query of the synchronisation (where e1_uid == uid)", async () => {
    const db = env.authenticatedContext("ana").firestore();
    await assertSucceeds(getDocs(query(collection(db, "file-items"), where("e1_uid", "==", "ana"))));
  });

  it("nobody lists all the files, or those of another person", async () => {
    const db = env.authenticatedContext("ana").firestore();
    await assertFails(getDocs(collection(db, "file-items")));
    await assertFails(getDocs(query(collection(db, "file-items"), where("e1_uid", "==", "eva"))));
    await assertFails(getDocs(query(collection(env.unauthenticatedContext().firestore(), "file-items"), where("e1_uid", "==", "ana"))));
  });

  it("the owner creates, replaces (setDoc) and deletes their files", async () => {
    const db = env.authenticatedContext("ana").firestore();
    await assertSucceeds(setDoc(doc(db, "file-items/f3"), file("ana", { key: "f3", isDirectory: true, content: "" })));
    await assertSucceeds(setDoc(doc(db, "file-items/f1"), file("ana", { content: "otro texto", dateModified: 2 })));
    await assertSucceeds(updateDoc(doc(db, "file-items/f1"), { content: "nuevo", dateModified: 3 }));
    await assertSucceeds(deleteDoc(doc(db, "file-items/f1")));
  });

  it("deleting a file that never reached the account is not an error", async () => {
    const db = env.authenticatedContext("ana").firestore();
    await assertSucceeds(deleteDoc(doc(db, "file-items/never-uploaded")));
  });

  it("nobody else reads, changes or deletes them, nor without a session", async () => {
    for (const db of [env.authenticatedContext("eva").firestore(), env.unauthenticatedContext().firestore()]) {
      await assertFails(getDoc(doc(db, "file-items/f1")));
      await assertFails(setDoc(doc(db, "file-items/f1"), file("eva")));
      await assertFails(updateDoc(doc(db, "file-items/f1"), { content: "mío" }));
      await assertFails(deleteDoc(doc(db, "file-items/f1")));
    }
  });

  it("a file is created only for oneself and as THUMDER writes it", async () => {
    const db = env.authenticatedContext("eva").firestore();
    await assertSucceeds(setDoc(doc(db, "file-items/f4"), file("eva", { key: "f4" })));
    await assertFails(setDoc(doc(db, "file-items/f5"), file("ana", { key: "f5" })));
    await assertFails(setDoc(doc(db, "file-items/f6"), { ...file("eva", { key: "f6" }), name: "" }));
    await assertFails(setDoc(doc(db, "file-items/f7"), { ...file("eva", { key: "f7" }), dateModified: "ayer" }));
    await assertFails(setDoc(doc(db, "file-items/f8"), file("eva", { key: "f8", content: "x".repeat(512001) })));
    await assertFails(setDoc(doc(db, "file-items/f9"), { ...file("eva", { key: "f9" }), name: "n".repeat(101) }));
  });

  it("a file has only the fields of THUMDER", async () => {
    const db = env.authenticatedContext("eva").firestore();
    await assertFails(setDoc(doc(db, "file-items/f10"), { ...file("eva", { key: "f10" }), extra: "x".repeat(100000) }));
    await assertFails(updateDoc(doc(db, "file-items/f2"), { extra: true }));
  });

  it("the owner of a file cannot change", async () => {
    const db = env.authenticatedContext("ana").firestore();
    await assertFails(updateDoc(doc(db, "file-items/f1"), { e1_uid: "eva" }));
    await assertFails(setDoc(doc(db, "file-items/f1"), file("eva")));
  });
});

describe("the files of the versions before 1.7", () => {
  // As THUMDER 1.6 wrote them: the date as text (JSON of a Date) and its own id
  const old = { ...file("ana", { key: "uuid-1" }), $key: "random-id", dateModified: "2022-06-28T10:00:00.000Z" };

  beforeEach(async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "file-items/random-id"), old);
    });
  });

  it("the owner reads, deletes and rewrites them in the new format", async () => {
    const db = env.authenticatedContext("ana").firestore();
    await assertSucceeds(getDocs(query(collection(db, "file-items"), where("e1_uid", "==", "ana"))));
    await assertSucceeds(setDoc(doc(db, "file-items/random-id"), file("ana", { key: "uuid-1", $key: "random-id", dateModified: 2 })));
    await assertSucceeds(deleteDoc(doc(db, "file-items/random-id")));
  });

  it("an old version cannot write them with the date as text any more", async () => {
    const db = env.authenticatedContext("ana").firestore();
    await assertFails(setDoc(doc(db, "file-items/random-id"), { ...old, content: "cambio" }));
  });
});

describe("users", () => {
  it("each person writes and reads only their own profile, as THUMDER writes it", async () => {
    await assertSucceeds(setDoc(doc(env.authenticatedContext("eva").firestore(), "users/eva"), profile("eva")));
    await assertSucceeds(getDoc(doc(env.authenticatedContext("ana").firestore(), "users/ana")));
    await assertFails(getDoc(doc(env.authenticatedContext("eva").firestore(), "users/ana")));
    await assertFails(setDoc(doc(env.authenticatedContext("eva").firestore(), "users/ana"), profile("eva")));
  });

  it("a profile has its own uid and only the fields of THUMDER", async () => {
    const db = env.authenticatedContext("eva").firestore();
    await assertFails(setDoc(doc(db, "users/eva"), profile("ana")));
    await assertFails(setDoc(doc(db, "users/eva"), { ...profile("eva"), admin: true }));
  });

  it("nothing else can be read or written", async () => {
    const db = env.authenticatedContext("ana").firestore();
    await assertFails(setDoc(doc(db, "other/x"), { a: 1 }));
    await assertFails(getDoc(doc(db, "other/x")));
  });
});

describe("client-errors, as ErrorReporter sends them", () => {
  /** An error as THUMDER sends it, with the time of the server */
  const report = (extra: Record<string, unknown> = {}) => ({
    ...errorReport(new TypeError("x is undefined"), { path: "/auth/editor?x=1", version: "1.7.1", userAgent: "Mozilla/5.0 Electron/38", lang: "es" }),
    createdAt: serverTimestamp(),
    ...extra,
  });

  it("anyone sends an error, with or without an account", async () => {
    await assertSucceeds(addDoc(collection(env.unauthenticatedContext().firestore(), ERRORS_COLLECTION), report()));
    await assertSucceeds(addDoc(collection(env.authenticatedContext("ana").firestore(), ERRORS_COLLECTION), report()));
  });

  it("from the web, the desktop and the applications of Android and iOS", async () => {
    const errors = collection(env.unauthenticatedContext().firestore(), ERRORS_COLLECTION);
    for (const platform of ["web", "electron", "android", "ios"]) await assertSucceeds(addDoc(errors, report({ platform })));
  });

  it("nobody reads, changes or deletes them (they are read in the console of Firebase)", async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), `${ERRORS_COLLECTION}/e1`), { ...report(), createdAt: new Date() });
    });
    const db = env.authenticatedContext("ana").firestore();
    await assertFails(getDoc(doc(db, `${ERRORS_COLLECTION}/e1`)));
    await assertFails(getDocs(collection(db, ERRORS_COLLECTION)));
    await assertFails(updateDoc(doc(db, `${ERRORS_COLLECTION}/e1`), { message: "otro" }));
    await assertFails(deleteDoc(doc(db, `${ERRORS_COLLECTION}/e1`)));
  });

  it("only the fields of an error, with their limits and the time of the server", async () => {
    const errors = collection(env.unauthenticatedContext().firestore(), ERRORS_COLLECTION);
    await assertFails(addDoc(errors, report({ uid: "ana" })));
    await assertFails(addDoc(errors, report({ message: "" })));
    await assertFails(addDoc(errors, report({ message: "x".repeat(501) })));
    await assertFails(addDoc(errors, report({ stack: "x".repeat(4001) })));
    await assertFails(addDoc(errors, report({ platform: "symbian" })));
    await assertFails(addDoc(errors, report({ createdAt: new Date(0) })));
  });
});

