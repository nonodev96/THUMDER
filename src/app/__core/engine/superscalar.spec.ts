import { type AssemblyResult, assemble, type SourceFile } from "@core/engine/assembler";
import { doubleFromBits } from "@core/engine/cpu";
import { CLASSICS, EXAMPLES, SUPERDLX_EXAMPLES, testIO } from "@core/engine/examples.spec-helper";
import { runReference } from "@core/engine/reference";
import { Superscalar, type SuperscalarReport } from "@core/engine/superscalar";
import {
  defaultSuperscalar,
  type SuperscalarConfig,
  type SuperscalarParameters,
  superscalarProfile,
  validateSuperscalar,
} from "@core/engine/superscalar-config";
import { describe, expect, it } from "vitest";

const MEMORY = 0x8000;

/** What each program reads from the console */
const INPUT: Record<string, string[]> = {
  "20-media-entrada.s": ["4", "8", "15", "16", "23", "42", "0"],
  "gcm.s": ["12", "18"],
  "fact.s": ["5"],
};

const PROGRAMS: Record<string, string> = { ...CLASSICS, ...EXAMPLES, ...SUPERDLX_EXAMPLES };
const NAMES = Object.keys(PROGRAMS).filter((name) => name !== "input.s");

function files(name: string, content = PROGRAMS[name]): SourceFile[] {
  const list = [{ name, content }];
  if (/InputUnsigned/.test(content) && name !== "input.s") list.push({ name: "input.s", content: EXAMPLES["input.s"] });
  return list;
}

function build(name: string, content?: string): AssemblyResult {
  const program = assemble(files(name, content), { memorySize: MEMORY, mainFile: name });
  expect(program.messages.filter((m) => m.severity === "error")).toEqual([]);
  return program;
}

function source(content: string): AssemblyResult {
  const program = assemble([{ name: "test.s", content }], { memorySize: MEMORY });
  expect(program.messages.filter((m) => m.severity === "error")).toEqual([]);
  return program;
}

type Run = { machine: Superscalar; reports: SuperscalarReport[]; output: string };

function run(program: AssemblyResult, parameters: Partial<SuperscalarParameters> = {}, lines: string[] = [], maxCycles = 300_000): Run {
  const config: SuperscalarConfig = { ...defaultSuperscalar(), ...parameters, memorySize: MEMORY };
  const io = testIO(lines);
  const machine = new Superscalar(config, program.memory, program.entry, io);
  const reports: SuperscalarReport[] = [];
  while (!machine.complete && reports.length < maxCycles) {
    const report = machine.tick();
    reports.push(report);
    expect(report.error).toBeUndefined();
    checkInvariants(machine, report, config);
  }
  expect(machine.complete).toBe(true);
  return { machine, reports, output: io.output };
}

/** What must hold in every cycle */
function checkInvariants(machine: Superscalar, report: SuperscalarReport, config: SuperscalarConfig): void {
  const snapshot = machine.snapshot();
  expect(snapshot.queue.length).toBeLessThanOrEqual(config.queue);
  expect(snapshot.rob.int.entries.length).toBeLessThanOrEqual(config.rob.int);
  expect(snapshot.rob.fp.entries.length).toBeLessThanOrEqual(config.rob.fp);
  expect(snapshot.windows.int.length).toBeLessThanOrEqual(config.window.int);
  expect(snapshot.windows.fp.length).toBeLessThanOrEqual(config.window.fp);
  expect(snapshot.storeBuffer.length).toBeLessThanOrEqual(config.storeBuffer);
  const fetched = report.events.filter((event) => event.kind === "F").length;
  const decoded = report.events.filter((event) => event.kind === "D").length;
  expect(fetched).toBeLessThanOrEqual(config.fetch);
  expect(decoded).toBeLessThanOrEqual(config.decode);
  // In order in each ROB, and never more than `commit` from each one (NOP and J commit apart)
  for (const side of ["int", "fp"] as const) {
    const committed = report.events.filter(
      (event) => event.kind === "C" && event.op.info.side === side && event.op.info.kind !== "nop" && event.op.decoded?.def.mnemonic !== "J",
    );
    expect(committed.length).toBeLessThanOrEqual(config.commit);
    const rows = committed.map((event) => event.op.row);
    expect(rows).toEqual([...rows].sort((a, b) => a - b));
  }
  // What has committed is never squashed
  for (const event of report.events.filter((event) => event.kind === "X")) expect(event.op.cycles.commit).toBeUndefined();
  // The units are never busier than they are
  for (const unit of snapshot.units) expect(unit.slots.length).toBeGreaterThan(0);
}

const CONFIGS: [string, Partial<SuperscalarParameters>][] = [
  ["the MACHINE of WinSuperDLX", {}],
  ["a scalar machine", superscalarProfile("scalar")],
  ["a very wide machine", superscalarProfile("wide")],
  ["without branch prediction", { prediction: false }],
  [
    "tiny buffers and a slow memory",
    {
      fetch: 2,
      decode: 2,
      commit: 1,
      queue: 2,
      rob: { int: 2, fp: 2 },
      window: { int: 1, fp: 1 },
      loadBuffer: 1,
      storeBuffer: 1,
      btb: 1,
      memory: { latency: 7, accesses: 1 },
    },
  ],
];

describe("SuperDLX ends every program as the reference executor", () => {
  for (const [label, parameters] of CONFIGS) {
    it.each(NAMES)(`%s with ${label}`, (name) => {
      const program = build(name);
      const result = run(program, parameters, INPUT[name]);
      const reference = runReference(program, testIO(INPUT[name]));
      expect(reference.halted).toBe(true);
      const registers = result.machine.registers;
      expect(Array.from(registers.R)).toEqual(Array.from(reference.registers.R));
      expect(Array.from(registers.F)).toEqual(Array.from(reference.registers.F));
      expect(registers.FPSR).toBe(reference.registers.FPSR);
      expect(Buffer.from(result.machine.memory.bytes).equals(Buffer.from(reference.memory.bytes))).toBe(true);
      expect(result.machine.stats.instructions).toBe(reference.instructions);
      expect(result.output).toBe(testIOOutput(program, INPUT[name]));
    });
  }
});

function testIOOutput(program: AssemblyResult, lines: string[] = []): string {
  const io = testIO(lines);
  runReference(program, io);
  return io.output;
}

describe("SuperDLX timing", () => {
  it("runs independent instructions in parallel: more than one instruction per cycle", () => {
    const body = Array.from({ length: 40 }, (_, i) => ` addi r${(i % 8) + 1},r0,${i}`).join("\n");
    const { machine } = run(source(`${body}\n trap 0`));
    expect(machine.stats.instructions).toBe(41);
    expect(machine.stats.instructions / machine.stats.cycles).toBeGreaterThan(2);
  });

  it("a chain of dependent instructions goes one per cycle, whatever the width", () => {
    const body = Array.from({ length: 30 }, () => " addi r1,r1,1").join("\n");
    const wide = run(source(`${body}\n trap 0`), superscalarProfile("wide"));
    const narrow = run(source(`${body}\n trap 0`));
    expect(wide.machine.registers.R[1]).toBe(30);
    expect(wide.machine.stats.cycles).toBeGreaterThanOrEqual(30);
    expect(Math.abs(wide.machine.stats.cycles - narrow.machine.stats.cycles)).toBeLessThanOrEqual(2);
  });

  it("a scalar machine needs more cycles than the default one", () => {
    const program = build("16-producto-escalar.s");
    const scalar = run(program, superscalarProfile("scalar"));
    const machine = run(program);
    expect(machine.machine.stats.cycles).toBeLessThan(scalar.machine.stats.cycles);
  });

  it("the result of a unit can be used in the next cycle: back to back", () => {
    const { reports } = run(source(" addi r1,r0,1\n addi r2,r1,1\n trap 0"));
    const issue = (row: number) => reports.findIndex((report) => report.events.some((event) => event.kind === "I" && event.op.row === row));
    expect(issue(1) - issue(0)).toBe(1);
  });

  it("a load gives its value two cycles after it starts (address and memory)", () => {
    const { reports } = run(source(" .data\nA: .word 7\n .text\n lw r1,A(r0)\n addi r2,r1,1\n trap 0"));
    const issue = (row: number) => reports.findIndex((report) => report.events.some((event) => event.kind === "I" && event.op.row === row));
    expect(issue(1) - issue(0)).toBe(2);
  });

  it("a load waits for an older store to the same address, and reads what it writes", () => {
    const program = source(" .data\nA: .word 7\n .text\n addi r1,r0,42\n sw A(r0),r1\n lw r2,A(r0)\n trap 0");
    const { machine } = run(program);
    expect(machine.registers.R[2]).toBe(42);
    expect(machine.stats.blockedLoads).toBe(1);
  });

  it("a load to another address does not wait for the store", () => {
    const program = source(" .data\nA: .word 7\nB: .word 9\n .text\n addi r1,r0,42\n sw A(r0),r1\n lw r2,B(r0)\n trap 0");
    const { machine } = run(program);
    expect(machine.registers.R[2]).toBe(9);
    expect(machine.stats.blockedLoads).toBe(0);
  });

  it("predicts the branches of a loop with the 2-bit counters and squashes what comes after a wrong one", () => {
    const program = source(" addi r1,r0,10\nLoop: subi r1,r1,1\n bnez r1,Loop\n addi r2,r0,5\n trap 0");
    const { machine } = run(program);
    expect(machine.registers.R[2]).toBe(5);
    expect(machine.stats.branches).toBe(10);
    expect(machine.stats.taken).toBe(9);
    // The first time it is not in the BTB (predicted taken, right) and it fails only when the loop ends
    expect(machine.stats.mispredicted).toBe(1);
    expect(machine.stats.btbMisses).toBe(1);
    expect(machine.stats.squashed).toBeGreaterThan(0);
  });

  it("without prediction, fetch waits at each branch: more cycles, nothing squashed", () => {
    const program = source(" addi r1,r0,10\nLoop: subi r1,r1,1\n bnez r1,Loop\n trap 0");
    const predicted = run(program);
    const waiting = run(program, { prediction: false });
    expect(waiting.machine.stats.squashed).toBe(0);
    expect(waiting.machine.stats.cycles).toBeGreaterThan(predicted.machine.stats.cycles);
    expect(waiting.machine.stats.fetchStalls.branch).toBeGreaterThan(0);
  });

  it("a full ROB stops decode", () => {
    const body = Array.from({ length: 20 }, () => " divd f2,f4,f6").join("\n");
    const { machine } = run(source(`${body}\n trap 0`), { rob: { int: 20, fp: 4 } });
    expect(machine.stats.dispatchStalls.robFp).toBeGreaterThan(0);
  });

  it("the units are not pipelined: two divisions in one divider take twice its latency", () => {
    const parameters = defaultSuperscalar();
    parameters.units.fp.div = { count: 1, latency: 10 };
    const { reports } = run(source(" divd f2,f4,f6\n divd f8,f10,f12\n trap 0"), parameters);
    const issue = (row: number) => reports.findIndex((report) => report.events.some((event) => event.kind === "I" && event.op.row === row));
    expect(issue(1) - issue(0)).toBe(10);
  });

  it("the integer and the floating point halves commit apart: an addition does not wait for a division", () => {
    const { reports } = run(source(" divd f2,f4,f6\n addi r1,r0,1\n trap 0"));
    const commit = (row: number) => reports.findIndex((report) => report.events.some((event) => event.kind === "C" && event.op.row === row));
    expect(commit(1)).toBeLessThan(commit(0));
  });

  it("an instruction after an unresolved branch of the other half does not commit before it", () => {
    const program = source(" .data\nX: .double 1\n .text\n ld f2,X(r0)\n eqd f2,f2\n bfpt Skip\n addi r1,r0,1\nSkip: addi r2,r0,2\n trap 0");
    const { machine } = run(program, { prediction: false });
    expect(machine.registers.R[1]).toBe(0);
    expect(machine.registers.R[2]).toBe(2);
  });

  it("an error of an instruction squashed after a wrong prediction does not stop the program", () => {
    // The first time, the branch is predicted taken: the division by zero runs only on the wrong path
    const program = source(" addi r1,r0,1\n beqz r1,Bad\n addi r3,r0,3\n trap 0\nBad: div r2,r1,r0\n trap 0");
    const { machine } = run(program);
    expect(machine.registers.R[3]).toBe(3);
    expect(machine.stats.mispredicted).toBe(1);
  });

  it("stops at the errors of the program when they commit", () => {
    const program = source(" addi r1,r0,1\n lw r2,2(r1)\n trap 0");
    const config = { ...defaultSuperscalar(), memorySize: MEMORY };
    const machine = new Superscalar(config, program.memory, program.entry, testIO());
    let report: SuperscalarReport | undefined;
    while (!machine.complete) report = machine.tick();
    expect(report?.error).toMatch(/not aligned/);
  });

  it("waits for input in the trap 3, and goes on when there is a line", () => {
    const program = build("gcm.s");
    const lines: string[] = [];
    const io = testIO(lines);
    const config = { ...defaultSuperscalar(), memorySize: MEMORY };
    const machine = new Superscalar(config, program.memory, program.entry, {
      write: io.write,
      readLine: () => (lines.length > 0 ? `${lines.shift()}\n` : null),
    });
    let waited = 0;
    for (let i = 0; i < 100_000 && !machine.complete; i++) {
      const report = machine.tick();
      if (report.waitingForInput) {
        waited++;
        if (waited === 1) lines.push("12");
        if (waited === 2) lines.push("18");
      }
    }
    expect(machine.complete).toBe(true);
    expect(waited).toBeGreaterThanOrEqual(2);
  });

  it("leaves 16 dot product in F8, like DLX", () => {
    const { machine } = run(build("16-producto-escalar.s"));
    expect(doubleFromBits(machine.registers.F[8], machine.registers.F[9])).toBe(16.5);
  });
});

describe("SuperDLX parameters", () => {
  it("are the MACHINE of WinSuperDLX by default", () => {
    const machine = defaultSuperscalar();
    expect([machine.fetch, machine.decode, machine.commit]).toEqual([6, 4, 4]);
    expect(machine.rob).toEqual({ int: 20, fp: 20 });
    expect(machine.units.fp.div).toEqual({ count: 2, latency: 10 });
  });

  it("are validated: wrong values take the default and the others go to their limits", () => {
    const valid = validateSuperscalar({ fetch: 100, decode: "3", commit: -4, rob: { int: "x" }, units: { fp: { div: { count: 99 } } } });
    expect(valid.fetch).toBe(16);
    expect(valid.decode).toBe(3);
    expect(valid.commit).toBe(1);
    expect(valid.rob.int).toBe(20);
    expect(valid.units.fp.div).toEqual({ count: 20, latency: 10 });
    expect(validateSuperscalar(null)).toEqual(defaultSuperscalar());
  });
});
