import { assemble, type SourceFile } from "@core/engine/assembler";
import { doubleFromBits } from "@core/engine/cpu";
import { EXAMPLES, testIO } from "@core/engine/examples.spec-helper";
import { runReference } from "@core/engine/reference";
import { describe, expect, it } from "vitest";

const files = (...names: string[]): SourceFile[] => names.map((name) => ({ name, content: EXAMPLES[name] }));
const build = (...names: string[]) => {
  const program = assemble(files(...names), { memorySize: 0x8000 });
  expect(program.messages.filter((m) => m.severity === "error")).toEqual([]);
  return program;
};

describe("runReference", () => {
  it("prim.s writes the first 10 prime numbers in Table", () => {
    const program = build("prim.s");
    const run = runReference(program, testIO());
    expect(run.error).toBeUndefined();
    expect(run.halted).toBe(true);
    const table = program.symbols.get("Table") as number;
    const view = new DataView(run.memory.bytes.buffer);
    expect(Array.from({ length: 10 }, (_, i) => view.getUint32(table + 4 * i))).toEqual([2, 3, 5, 7, 11, 13, 17, 19, 23, 29]);
  });

  it("gcm.s reads two numbers and prints their greatest common measure", () => {
    const io = testIO(["12", "18"]);
    const run = runReference(build("gcm.s", "input.s"), io);
    expect(run.error).toBeUndefined();
    expect(run.halted).toBe(true);
    expect(io.output).toBe("First Number:Second Number: gcM=6\n\n");
  });

  it("fact.s computes a factorial with doubles", () => {
    const io = testIO(["5"]);
    const run = runReference(build("fact.s", "input.s"), io);
    expect(run.error).toBeUndefined();
    expect(io.output).toBe("An integer value >1 : Factorial = 120\n\n");
    expect(doubleFromBits(run.registers.F[2], run.registers.F[3])).toBe(120);
  });

  it("base.s counts the days above 14 degrees", () => {
    const run = runReference(build("base.s"), testIO());
    expect(run.halted).toBe(true);
    expect(run.registers.R[5]).toBe(7);
  });

  it("win-dlx.s runs to the end", () => {
    const run = runReference(build("win-dlx.s"), testIO());
    expect(run.error).toBeUndefined();
    expect(run.halted).toBe(true);
  });

  it("stops and waits when the program needs input", () => {
    const run = runReference(build("gcm.s", "input.s"), testIO(["12"]));
    expect(run.waitingForInput).toBe(true);
  });

  it("stops at errors of the program", () => {
    const program = assemble([{ name: "a.s", content: " addi r1,r0,1\n lw r2,2(r1)" }], { memorySize: 0x8000 });
    expect(runReference(program, testIO()).error).toMatch(/not aligned/);
  });
});
