import { type AssemblyResult, assemble } from "@core/engine/assembler";
import { DEFAULT_MACHINE_CONFIG } from "@core/engine/cpu";
import { SUPERDLX_EXAMPLES, testIO } from "@core/engine/examples.spec-helper";
import { Pipeline } from "@core/engine/pipeline";
import { runReference } from "@core/engine/reference";
import { Superscalar, type SuperscalarReport } from "@core/engine/superscalar";
import { defaultSuperscalar, type SuperscalarParameters } from "@core/engine/superscalar-config";
import { describe, expect, it } from "vitest";

// The examples of SuperDLX (src/assets/examples-dlx/ejemplos/superdlx): each one does what its comments say

const NAMES = Object.keys(SUPERDLX_EXAMPLES);
const MEMORY = 0x8000;

function build(name: string, content = SUPERDLX_EXAMPLES[name]): AssemblyResult {
  const program = assemble([{ name, content }], { memorySize: MEMORY });
  expect(program.messages).toEqual([]);
  return program;
}

/** What the header of an example says it prints: the line of "; Resultado:" or the indented lines after it */
function documentedResult(content: string): string[] {
  const lines = content.split("\n");
  const start = lines.findIndex((line) => line.startsWith("; Resultado:"));
  const inline = lines[start].slice("; Resultado:".length).trim();
  if (inline) return [inline];
  const result: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (!line.startsWith(";   ")) break;
    result.push(line.slice(4).trimEnd());
  }
  return result;
}

type Run = { machine: Superscalar; reports: SuperscalarReport[]; output: string; program: AssemblyResult };

function superscalar(name: string, parameters: Partial<SuperscalarParameters> = {}, content?: string): Run {
  const program = build(name, content);
  const io = testIO();
  const machine = new Superscalar({ ...defaultSuperscalar(), ...parameters, memorySize: MEMORY }, program.memory, program.entry, io);
  const reports: SuperscalarReport[] = [];
  while (!machine.complete) {
    const report = machine.tick();
    expect(report.error).toBeUndefined();
    reports.push(report);
  }
  return { machine, reports, output: io.output, program };
}

/** The first cycle an instruction at a label (plus `offset` bytes) commits */
function committedAt(run: Run, label: string, offset = 0): number {
  const pc = (run.program.symbols.get(label) as number) + offset;
  return run.reports.findIndex((report) => report.events.some((event) => event.kind === "C" && event.op.pc === pc));
}

/** The first cycle an instruction at a label is in WB, in DLX */
function dlxWriteBack(name: string): (label: string) => number {
  const program = build(name);
  const pipeline = new Pipeline({ ...DEFAULT_MACHINE_CONFIG }, program.memory, program.entry, testIO());
  const first = new Map<number, number>();
  while (!pipeline.complete) {
    const report = pipeline.tick();
    if (report.WB && !first.has(report.WB.instance.pc)) first.set(report.WB.instance.pc, report.cycle);
  }
  return (label) => first.get(program.symbols.get(label) as number) as number;
}

describe("The examples of SuperDLX", () => {
  it("are numbered and have a header that explains them", () => {
    expect(NAMES.length).toBe(5);
    NAMES.forEach((name, i) => {
      const number = String(i + 1).padStart(2, "0");
      expect(name.startsWith(`${number}-`)).toBe(true);
      expect(SUPERDLX_EXAMPLES[name]).toContain(`; THUMDER - Ejemplo SuperDLX ${number}:`);
      expect(SUPERDLX_EXAMPLES[name]).toContain("; Conceptos:");
      expect(SUPERDLX_EXAMPLES[name]).toContain("; Qué mirar en THUMDER (elige SuperDLX en la cabecera):");
    });
  });

  it.each(NAMES)("%s prints what its header says, in DLX and in SuperDLX, and ends as the reference", (name) => {
    const program = build(name);
    const reference = runReference(program, testIO());
    expect(reference.halted).toBe(true);
    const io = testIO();
    const pipeline = new Pipeline({ ...DEFAULT_MACHINE_CONFIG }, program.memory, program.entry, io);
    while (!pipeline.complete) pipeline.tick();
    expect(io.output.replace(/\n+$/, "").split("\n")).toEqual(documentedResult(SUPERDLX_EXAMPLES[name]));
    expect(Array.from(pipeline.registers.R)).toEqual(Array.from(reference.registers.R));
    expect(Array.from(pipeline.registers.F)).toEqual(Array.from(reference.registers.F));
    const run = superscalar(name);
    expect(run.output).toBe(io.output);
  });
});

describe("What the comments of the examples of SuperDLX say", () => {
  it("01: in DLX both loops take the same; in SuperDLX the one with four accumulators is faster", () => {
    const wb = dlxWriteBack("01-paralelismo.s");
    const dlxOne = wb("Prepara") - wb("Uno");
    const dlxFour = wb("Junta") - wb("Cuatro");
    expect(Math.abs(dlxOne - dlxFour)).toBeLessThanOrEqual(1);
    const run = superscalar("01-paralelismo.s");
    expect(committedAt(run, "Junta") - committedAt(run, "Cuatro")).toBeLessThan(committedAt(run, "Prepara") - committedAt(run, "Uno"));
  });

  it("01: the additions of «Uno» start one by one; several of «Cuatro» start in the same cycle", () => {
    const run = superscalar("01-paralelismo.s");
    const loop = (label: string) => {
      const from = run.program.symbols.get(label) as number;
      return (pc: number) => pc >= from + 32 && pc < from + 64;
    };
    const most = (inLoop: (pc: number) => boolean) =>
      Math.max(...run.reports.map((report) => report.events.filter((event) => event.kind === "I" && inLoop(event.op.pc)).length));
    expect(most(loop("Uno"))).toBe(1);
    expect(most(loop("Cuatro"))).toBeGreaterThanOrEqual(3);
  });

  it("02: R4 has several versions at the same time, and other registers would not save a cycle", () => {
    const program = build("02-renombrado.s");
    const machine = new Superscalar({ ...defaultSuperscalar(), memorySize: MEMORY }, program.memory, program.entry, testIO());
    let versions = 0;
    while (!machine.complete) {
      machine.tick();
      const producers = new Set(
        machine
          .snapshot()
          .windows.int.flatMap((entry) => entry.sources)
          .filter((source) => source.name === "R4" && !source.ready)
          .map((source) => source.row),
      );
      versions = Math.max(versions, producers.size);
    }
    expect(versions).toBeGreaterThanOrEqual(2);
    // No load of R4 waits for the additions before it: each one starts in the cycle after it is decoded
    const run = superscalar("02-renombrado.s");
    const loop = run.program.symbols.get("Bucle") as number;
    const loads = new Set([loop, loop + 8, loop + 16]);
    const cycles = new Map<number, { dispatch?: number; issue?: number }>();
    run.reports.forEach((report, cycle) => {
      for (const event of report.events) {
        if (!loads.has(event.op.pc) || event.op.state === "squashed" || (event.kind !== "D" && event.kind !== "I")) continue;
        const entry = cycles.get(event.op.row) ?? {};
        if (event.kind === "D") entry.dispatch = cycle;
        else entry.issue = cycle;
        cycles.set(event.op.row, entry);
      }
    });
    const committed = [...cycles.values()].filter((entry) => entry.issue !== undefined);
    expect(committed.length).toBe(24);
    for (const entry of committed) expect((entry.issue as number) - (entry.dispatch as number)).toBe(1);
    const content = SUPERDLX_EXAMPLES["02-renombrado.s"]
      .replace("lw      r4,0(r2)        ; R4 = B[i]  (WAR y WAW con lo de arriba)\n        add     r6,r6,r4", "lw r8,0(r2)\n add r6,r6,r8")
      .replace("lw      r4,0(r3)        ; R4 = C[i]  (WAR y WAW otra vez)\n        add     r7,r7,r4", "lw r9,0(r3)\n add r7,r7,r9");
    expect(content).toContain("lw r9,0(r3)");
    const renamed = superscalar("02-renombrado.s", {}, content);
    expect(renamed.machine.stats.cycles).toBe(superscalar("02-renombrado.s").machine.stats.cycles);
  });

  it("03: the alternate numbers are mispredicted more than the grouped ones, and without prediction nothing is squashed", () => {
    const run = superscalar("03-prediccion-de-saltos.s");
    const second = committedAt(run, "Segunda");
    const mispredicted = (from: number, to: number) =>
      run.reports.slice(from, to).flatMap((report) => report.events.filter((event) => event.kind === "C" && event.op.mispredicted)).length;
    const alternate = mispredicted(0, second);
    const grouped = mispredicted(second, run.reports.length);
    expect(alternate).toBeGreaterThan(2 * grouped);
    expect(run.machine.stats.btbMisses).toBeGreaterThan(0);
    const waiting = superscalar("03-prediccion-de-saltos.s", { prediction: false });
    expect(waiting.machine.stats.squashed).toBe(0);
    expect(waiting.machine.stats.cycles).toBeGreaterThan(run.machine.stats.cycles);
  });

  it("04: each load of Total waits for the store before it, and the loop in memory is much slower", () => {
    const run = superscalar("04-dependencias-en-memoria.s");
    expect(run.machine.stats.blockedLoads).toBe(14);
    const inMemory = committedAt(run, "EnRegistro") - committedAt(run, "EnMemoria");
    const inRegister = committedAt(run, "Imprime") - committedAt(run, "EnRegistro");
    expect(inMemory).toBeGreaterThan(2 * inRegister);
  });

  it("05: a small floating point ROB stops decode and takes much longer; a larger one than WinSuperDLX does not help", () => {
    const machine = superscalar("05-rob-y-coma-flotante.s").machine.stats;
    const small = superscalar("05-rob-y-coma-flotante.s", { rob: { int: 20, fp: 4 } }).machine.stats;
    const large = superscalar("05-rob-y-coma-flotante.s", { rob: { int: 20, fp: 40 } }).machine.stats;
    expect(small.dispatchStalls.robFp).toBeGreaterThan(machine.dispatchStalls.robFp);
    expect(small.cycles).toBeGreaterThan(1.5 * machine.cycles);
    expect(large.cycles).toBeGreaterThanOrEqual(machine.cycles - 2);
  });
});
