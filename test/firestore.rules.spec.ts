import { readFileSync } from "node:fs";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
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
