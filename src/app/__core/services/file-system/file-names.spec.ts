import { describe, expect, it } from "vitest";
import { nameError, splitName, uniqueName } from "./file-names";

describe("file names (DAT-05)", () => {
  it("rejects the empty, long, reserved and taken names and the invalid characters", () => {
    expect(nameError("  ", [])).toBe("EMPTY");
    expect(nameError("..", [])).toBe("EMPTY");
    expect(nameError("a".repeat(101), [])).toBe("TOO_LONG");
    for (const name of ["a/b", "a\\b", "a:b", "a*b", "a?b", 'a"b', "a<b", "a|b", "a\u0007b"]) expect(nameError(name, [])).toBe("INVALID_CHARACTERS");
    expect(nameError("con", [])).toBe("RESERVED");
    expect(nameError("LPT1.s", [])).toBe("RESERVED");
    expect(nameError("bucle.s", ["Bucle.S"])).toBe("TAKEN");
    expect(nameError(" bucle.s ", ["bucle.s"])).toBe("TAKEN");
    expect(nameError("bucle.s", ["búcle.s"])).toBeNull();
    expect(nameError("consola.s", [])).toBeNull();
  });

  it("finds a free name: nuevo.s, nuevo (2).s, nuevo (3).s", () => {
    expect(uniqueName("nuevo.s", [])).toBe("nuevo.s");
    expect(uniqueName("nuevo.s", ["nuevo.s"])).toBe("nuevo (2).s");
    expect(uniqueName("nuevo.s", ["nuevo.s", "nuevo (2).s"])).toBe("nuevo (3).s");
    expect(uniqueName("nuevo (2).s", ["nuevo (2).s"])).toBe("nuevo (3).s");
    expect(uniqueName("ejemplos", ["ejemplos"])).toBe("ejemplos (2)");
    expect(splitName(".gitignore")).toEqual([".gitignore", ""]);
  });
});

describe("file names within the limit of the account (firestore.rules: 100 characters)", () => {
  it("a free name never goes over 100 characters, keeping its extension", () => {
    const long = `${"a".repeat(98)}.s`;
    const free = uniqueName(long, [long]);
    expect(free.length).toBeLessThanOrEqual(100);
    expect(free.endsWith(" (2).s")).toBe(true);
    expect(nameError(free, [long])).toBeNull();
    const longer = `${"b".repeat(150)}.s`;
    expect(uniqueName(longer, []).length).toBeLessThanOrEqual(100);
  });
});
