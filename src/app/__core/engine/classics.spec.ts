import { type AssemblyResult, assemble, type SourceFile } from "@core/engine/assembler";
import { DEFAULT_MACHINE_CONFIG, doubleFromBits, type MachineConfig } from "@core/engine/cpu";
import { CLASSICS, EXAMPLES, testIO } from "@core/engine/examples.spec-helper";
import { type CycleReport, FLOATING_UNITS, Pipeline, type StallLabel } from "@core/engine/pipeline";
import { runReference } from "@core/engine/reference";
import { describe, expect, it } from "vitest";

// The classic examples of src/assets/examples-dlx/ejemplos: each one does what its comments say

const NAMES = Object.keys(CLASSICS);

/** What each example reads from the console */
const INPUT: Record<string, string[]> = {
  "20-media-entrada.s": ["4", "8", "15", "16", "23", "42", "0"],
};

/** The files of an example: 20-media-entrada.s needs the module input.s */
function files(name: string, content = CLASSICS[name]): SourceFile[] {
  const list = [{ name, content }];
  if (/InputUnsigned/.test(content)) list.push({ name: "input.s", content: EXAMPLES["input.s"] });
  return list;
}

function build(name: string, content?: string, memorySize = DEFAULT_MACHINE_CONFIG.memorySize): AssemblyResult {
  const program = assemble(files(name, content), { memorySize });
  expect(program.messages).toEqual([]);
  return program;
}

/** What the header of an example says it prints: the line of "; Resultado:" or the indented lines after it */
function documentedResult(content: string): string[] | null {
  const lines = content.split("\n");
  const start = lines.findIndex((line) => line.startsWith("; Resultado:"));
  if (start < 0) return null;
  const inline = lines[start].slice("; Resultado:".length).trim();
  if (inline) return [inline];
  const result: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (!line.startsWith(";   ")) break;
    result.push(line.slice(4).trimEnd());
  }
  return result;
}

const outputLines = (output: string) => output.replace(/\n+$/, "").split("\n").map((line) => line.trimEnd());

type Run = { pipeline: Pipeline; program: AssemblyResult; output: string; stalls: (label: string, offset?: number) => StallLabel[] };

/**
 * Runs an example in the pipeline; `stalls(label, offset)` are the stall labels, cycle by cycle, of the instruction at
 * that label (plus `offset` bytes)
 */
function simulate(name: string, config: Partial<MachineConfig> = {}, content?: string): Run {
  const machine = { ...DEFAULT_MACHINE_CONFIG, ...config };
  const program = build(name, content, machine.memorySize);
  const io = testIO(INPUT[name]);
  const pipeline = new Pipeline(machine, program.memory, program.entry, io);
  const labels = new Map<number, StallLabel[]>();
  for (let cycle = 0; !pipeline.complete && cycle < 500_000; cycle++) {
    const report = pipeline.tick();
    expect(report.error).toBeUndefined();
    const cells: CycleReport["IF"][] = [report.IF, report.ID, report.intEX, report.MEM, report.WB, ...FLOATING_UNITS.flatMap((unit) => report.units[unit])];
    for (const cell of cells) {
      if (cell && cell.label !== true) labels.set(cell.instance.pc, [...(labels.get(cell.instance.pc) ?? []), cell.label]);
    }
  }
  expect(pipeline.complete).toBe(true);
  const stalls = (label: string, offset = 0) => labels.get((program.symbols.get(label) as number) + offset) ?? [];
  return { pipeline, program, output: io.output, stalls };
}

const word = (memory: Uint8Array, address: number) => new DataView(memory.buffer).getInt32(address);

describe("Classic DLX examples", () => {
  it("are at least 15, numbered, with a header that explains them", () => {
    expect(NAMES.length).toBeGreaterThanOrEqual(15);
    NAMES.forEach((name, i) => {
      const number = String(i + 1).padStart(2, "0");
      expect(name.startsWith(`${number}-`)).toBe(true);
      expect(CLASSICS[name]).toContain(`; THUMDER - Ejemplo ${number}:`);
      expect(CLASSICS[name]).toContain("; Conceptos:");
      expect(CLASSICS[name]).toContain("; Qué mirar en THUMDER:");
    });
  });

  it.each(NAMES)("%s prints what its header says", (name) => {
    const io = testIO(INPUT[name]);
    const run = runReference(build(name), io);
    expect(run.error).toBeUndefined();
    expect(run.halted).toBe(true);
    const documented = documentedResult(CLASSICS[name]);
    if (documented) expect(outputLines(io.output)).toEqual(documented);
  });
});

// The same final state in the pipeline as in the reference executor, whatever the configuration
const CONFIGS: [string, Partial<MachineConfig>][] = [
  ["with forwarding", {}],
  ["without forwarding", { forwarding: false }],
  ["with fast and many floating point units", { fadd: { count: 2, delay: 1 }, fmul: { count: 3, delay: 2 }, fdiv: { count: 2, delay: 4 } }],
  ["with slow floating point units", { forwarding: false, fadd: { count: 1, delay: 7 }, fmul: { count: 1, delay: 11 }, fdiv: { count: 1, delay: 30 } }],
];

describe("Classic DLX examples in the pipeline", () => {
  for (const [label, config] of CONFIGS) {
    it.each(NAMES)(`%s ends as the reference ${label}`, (name) => {
      const run = simulate(name, config);
      const reference = runReference(run.program, testIO(INPUT[name]));
      const registers = run.pipeline.registers;
      expect(Array.from(registers.R)).toEqual(Array.from(reference.registers.R));
      expect(Array.from(registers.F)).toEqual(Array.from(reference.registers.F));
      expect(registers.FPSR).toBe(reference.registers.FPSR);
      expect(Buffer.from(run.pipeline.memory.bytes).equals(Buffer.from(reference.memory.bytes))).toBe(true);
      expect(run.pipeline.stats.instructions).toBe(reference.instructions);
    });
  }
});

describe("What the comments of the examples say", () => {
  it("02: scheduling the loop removes its two stalls per element, 16 cycles", () => {
    const body = /Bucle: {2}lw {6}r4,0\(r1\).*\n.*add {5}r3,r3,r4.*\n.*addi {4}r1,r1,4.*\n.*subi {4}r2,r2,1.*\n/;
    const original = CLASSICS["02-suma-vector.s"];
    expect(original).toMatch(body);
    const scheduled = original.replace(body, "Bucle:  lw r4,0(r1)\n subi r2,r2,1\n addi r1,r1,4\n add r3,r3,r4\n");
    const before = simulate("02-suma-vector.s");
    const after = simulate("02-suma-vector.s", {}, scheduled);
    expect(after.output).toBe(before.output);
    expect(before.pipeline.stats.cycles - after.pipeline.stats.cycles).toBe(16);
  });

  it("03: with sltu the negative numbers are the largest", () => {
    const unsigned = CLASSICS["03-maximo.s"].replace("slt     r5,r3,r4", "sltu    r5,r3,r4");
    const io = testIO();
    expect(runReference(build("03-maximo.s", unsigned), io).halted).toBe(true);
    expect(io.output).toBe("El maximo es -5\n");
  });

  it("10: leaves the vector sorted in memory", () => {
    const run = simulate("10-burbuja.s");
    const vector = run.program.symbols.get("Vector") as number;
    expect(Array.from({ length: 10 }, (_, i) => word(run.pipeline.memory.bytes, vector + 4 * i))).toEqual([-7, -1, 0, 3, 8, 11, 15, 23, 29, 42]);
  });

  it("12: marks the composite numbers below 100", () => {
    const run = simulate("12-criba.s");
    const table = run.program.symbols.get("Compuesto") as number;
    const isPrime = (n: number) => n >= 2 && Array.from({ length: n - 2 }, (_, i) => i + 2).every((d) => n % d !== 0);
    for (let n = 2; n < 100; n++) expect(run.pipeline.memory.bytes[table + n]).toBe(isPrime(n) ? 0 : 1);
  });

  it("13: writes the product of the matrices in C, with 27 multiplications", () => {
    const run = simulate("13-matrices.s");
    expect(run.pipeline.stats.fmul).toBe(27);
    const c = run.program.symbols.get("C") as number;
    expect(Array.from({ length: 9 }, (_, i) => word(run.pipeline.memory.bytes, c + 4 * i))).toEqual([30, 24, 18, 84, 69, 54, 138, 114, 90]);
  });

  it("14 and 15: leave the stack pointer where it started", () => {
    for (const name of ["14-factorial-recursivo.s", "15-hanoi.s"]) {
      const run = simulate(name);
      expect(run.pipeline.registers.R[29]).toBe(run.program.symbols.get("FinPila"));
    }
  });

  it("16: leaves the dot product in F8", () => {
    const { registers } = simulate("16-producto-escalar.s").pipeline;
    expect(doubleFromBits(registers.F[8], registers.F[9])).toBe(16.5);
  });

  it("17: each instruction of the chain ld, multd, addd, sd waits for the one before", () => {
    const run = simulate("17-daxpy.s");
    // Bucle: ld (+0), multd (+4), ld (+8), addd (+12), sd (+16)
    for (const offset of [4, 12, 16]) expect(run.stalls("Bucle", offset)).toContain("R-Stall");
  });

  it("17 and 18: unrolling gives the same result in fewer cycles, and only the unrolled loop gains from more multipliers", () => {
    const rolled = simulate("17-daxpy.s");
    const unrolled = simulate("18-daxpy-desenrollado.s");
    expect(unrolled.output).toBe(rolled.output);
    expect(unrolled.pipeline.stats.cycles).toBeLessThan(rolled.pipeline.stats.cycles);
    expect(unrolled.pipeline.stats.structuralStalls).toBeGreaterThan(0);
    const four = { fmul: { count: 4, delay: DEFAULT_MACHINE_CONFIG.fmul.delay } };
    expect(simulate("17-daxpy.s", four).pipeline.stats.cycles).toBe(rolled.pipeline.stats.cycles);
    expect(simulate("18-daxpy-desenrollado.s", four).pipeline.stats.cycles).toBeLessThan(unrolled.pipeline.stats.cycles);
  });

  it("19: shows each hazard at its label", () => {
    const run = simulate("19-riesgos.s");
    expect(run.stalls("Adelanta")).toEqual([]);
    expect(run.stalls("UsaCarga")).toEqual(["R-Stall"]);
    expect(run.stalls("Decide")).toContain("R-Stall");
    expect(run.stalls("NoSeEjecuta").at(-1)).toBe("Aborted");
    expect(run.stalls("EnteraMEM")).toContain("Stall");
    expect(run.stalls("Divide2")).toContain("S-Stall");
    expect(run.stalls("Escribe2")).toContain("W-Stall");
    expect(run.stalls("Fin")).toContain("T-Stall");
    const { registers } = run.pipeline;
    expect(doubleFromBits(registers.F[8], registers.F[9])).toBe(3);
    expect(registers.R[6]).toBe(0);
  });

  it("19: without forwarding, the ALU and the load results take two cycles", () => {
    const run = simulate("19-riesgos.s", { forwarding: false });
    expect(run.stalls("Adelanta")).toEqual(["R-Stall", "R-Stall"]);
    expect(run.stalls("UsaCarga")).toEqual(["R-Stall", "R-Stall"]);
  });

  it("20: with no numbers, says so", () => {
    const io = testIO(["0"]);
    runReference(build("20-media-entrada.s"), io);
    expect(io.output).toBe("Numero (0 para terminar): No hay numeros\n");
  });

  it("20: prints the mean of the numbers typed", () => {
    const io = testIO(INPUT["20-media-entrada.s"]);
    runReference(build("20-media-entrada.s"), io);
    expect(io.output).toBe(`${"Numero (0 para terminar): ".repeat(7)}6 numeros, suma 108, media 18\n`);
  });
});
