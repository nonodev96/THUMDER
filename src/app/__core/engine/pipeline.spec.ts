import { assemble, type SourceFile } from "@core/engine/assembler";
import { DEFAULT_MACHINE_CONFIG, type MachineConfig } from "@core/engine/cpu";
import { EXAMPLES, testIO } from "@core/engine/examples.spec-helper";
import { type CycleReport, FLOATING_UNITS, Pipeline } from "@core/engine/pipeline";
import { runReference } from "@core/engine/reference";
import { describe, expect, it } from "vitest";

type Run = { pipeline: Pipeline; reports: CycleReport[]; timeline: (row: number) => string; output: string };

function simulate(files: SourceFile[], config: Partial<MachineConfig> = {}, lines: string[] = [], maxCycles = 200_000): Run {
  const machine = { ...DEFAULT_MACHINE_CONFIG, ...config };
  const program = assemble(files, { memorySize: machine.memorySize });
  expect(program.messages.filter((m) => m.severity === "error")).toEqual([]);
  const io = testIO(lines);
  const pipeline = new Pipeline(machine, program.memory, program.textStart, io);
  const reports: CycleReport[] = [];
  while (!pipeline.complete && reports.length < maxCycles) {
    const report = pipeline.tick();
    reports.push(report);
    if (report.waitingForInput) break;
  }
  // The stages of instruction `row`, cycle by cycle ("IF ID EX MEM WB", with the stalls by their name)
  const timeline = (row: number) => {
    const cells: string[] = [];
    for (const report of reports) {
      const stages: [string, CycleReport["IF"]][] = [
        ["IF", report.IF],
        ["ID", report.ID],
        ["EX", report.intEX],
        ["MEM", report.MEM],
        ["WB", report.WB],
        ...FLOATING_UNITS.flatMap((unit) => report.units[unit].map((cell) => [unit, cell] as [string, CycleReport["IF"]])),
      ];
      for (const [stage, cell] of stages) {
        if (cell?.instance.id === row) cells.push(cell.label === true ? stage : cell.label);
      }
    }
    return cells.join(" ");
  };
  return { pipeline, reports, timeline, output: io.output };
}

const source = (content: string): SourceFile[] => [{ name: "test.s", content }];

describe("Pipeline timing", () => {
  it("runs independent instructions one cycle apart; the trap waits in IF for an empty pipeline", () => {
    const run = simulate(source(" addi r1,r0,1\n addi r2,r0,2\n trap 0"));
    expect(run.timeline(0)).toBe("IF ID EX MEM WB");
    expect(run.timeline(1)).toBe("IF ID EX MEM WB");
    expect(run.timeline(2)).toBe("IF T-Stall T-Stall T-Stall ID EX MEM WB");
    expect(run.pipeline.stats.trapStalls).toBe(3);
    expect(run.pipeline.registers.R[2]).toBe(2);
  });

  it("forwards an ALU result to the next instruction with no stall", () => {
    const run = simulate(source(" addi r1,r0,5\n add r2,r1,r1\n trap 0"));
    expect(run.timeline(1)).toBe("IF ID EX MEM WB");
    expect(run.pipeline.registers.R[2]).toBe(10);
    expect(run.reports.flatMap((r) => r.arrows).filter((a) => a.kind === "forwarding")).toHaveLength(1);
  });

  it("stalls one cycle after a load, even with forwarding", () => {
    const run = simulate(source(" lw r1,data(r0)\n add r2,r1,r1\n trap 0\n .data\ndata: .word 21"));
    expect(run.timeline(1)).toBe("IF ID R-Stall EX MEM WB");
    expect(run.pipeline.stats.loadStalls).toBe(1);
    expect(run.pipeline.registers.R[2]).toBe(42);
  });

  it("without forwarding waits until the result is written (WB first half, ID second half)", () => {
    const run = simulate(source(" addi r1,r0,1\n add r2,r1,r1\n trap 0"), { forwarding: false });
    expect(run.timeline(1)).toBe("IF ID R-Stall R-Stall EX MEM WB");
    expect(run.pipeline.stats.rawStalls).toBe(2);
    expect(run.pipeline.registers.R[2]).toBe(2);
  });

  it("aborts the instruction after a taken branch (predict not taken)", () => {
    const run = simulate(source(" beqz r0,go\n addi r1,r0,1\ngo: addi r2,r0,2\n trap 0"));
    expect(run.timeline(1)).toBe("IF Aborted");
    expect(run.timeline(2)).toBe("IF ID EX MEM WB");
    expect(run.pipeline.registers.R[1]).toBe(0);
    expect(run.pipeline.stats.controlStalls).toBe(1);
    expect(run.pipeline.stats.taken).toBe(1);
  });

  it("does not stall on a branch not taken", () => {
    const run = simulate(source(" bnez r0,go\n addi r1,r0,1\ngo: trap 0"));
    expect(run.timeline(1)).toBe("IF ID EX MEM WB");
    expect(run.pipeline.registers.R[1]).toBe(1);
    expect(run.pipeline.stats.controlStalls).toBe(0);
  });

  it("stalls a branch that needs the result of the instruction just before (it is resolved in ID)", () => {
    const run = simulate(source(" addi r1,r0,1\n bnez r1,go\n nop\ngo: trap 0"));
    expect(run.timeline(1)).toBe("IF ID R-Stall EX MEM WB");
    expect(run.pipeline.stats.branchStalls).toBe(1);
  });

  it("waits for a WAW hazard of the floating point units (the example of the manual, section 6.1)", () => {
    const run = simulate(source(" addd f0,f2,f4\n movf f1,f4\n trap 0"));
    expect(run.timeline(0)).toBe("IF ID fadd fadd MEM WB");
    expect(run.timeline(1)).toBe("IF ID W-Stall EX MEM WB");
    expect(run.pipeline.stats.wawStalls).toBe(1);
  });

  it("stalls when there is no free floating point unit, and uses a second one when there is", () => {
    const program = " multd f0,f2,f4\n multd f6,f8,f10\n trap 0";
    const one = simulate(source(program));
    expect(one.timeline(1)).toBe("IF ID S-Stall S-Stall S-Stall S-Stall fmul fmul fmul fmul fmul MEM WB");
    expect(one.pipeline.stats.structuralStalls).toBe(4);
    const two = simulate(source(program), { fmul: { count: 2, delay: 5 } });
    expect(two.timeline(1)).toBe("IF ID fmul fmul fmul fmul fmul MEM WB");
  });

  it("gives MEM to the floating point unit first: the integer instruction waits in EX", () => {
    const run = simulate(source(" addf f0,f2,f4\n add r1,r2,r3\n trap 0"));
    expect(run.timeline(0)).toBe("IF ID fadd fadd MEM WB");
    expect(run.timeline(1)).toBe("IF ID EX Stall MEM WB");
  });

  it("stalls on the result of a floating point unit", () => {
    const run = simulate(source(" addf f0,f2,f4\n addf f6,f0,f0\n trap 0"));
    expect(run.timeline(1)).toBe("IF ID R-Stall fadd fadd MEM WB");
    expect(run.pipeline.stats.floatingStalls).toBe(1);
  });

  it("uses the configured delays", () => {
    const run = simulate(source(" divf f0,f2,f4\n trap 0"), { fdiv: { count: 1, delay: 3 } });
    expect(run.timeline(0)).toBe("IF ID fdiv fdiv fdiv MEM WB");
  });

  it("stops with an error at an invalid memory access", () => {
    const run = simulate(source(" addi r1,r0,2\n lw r2,0(r1)\n trap 0"));
    expect(run.reports.at(-1)?.error).toMatch(/not aligned/);
    expect(run.pipeline.complete).toBe(true);
  });

  it("reports the new PC of each cycle, also after a taken branch", () => {
    const run = simulate(source(" addi r1,r0,1\n j skip\n addi r2,r0,2\nskip: addi r3,r0,3\n trap 0"));
    const pcs = run.reports.map((report) => report.registers.find((change) => change.name === "PC")?.value);
    // Fetching 0x100, 0x104 (j), 0x108 (aborted when j jumps in ID) and then the target, 0x10C
    expect(pcs.slice(0, 4)).toEqual([0x104, 0x108, 0x10c, 0x110]);
  });

    it("waits for input in trap 3 and goes on when there is a line", () => {
    const run = simulate([{ name: "gcm.s", content: EXAMPLES["gcm.s"] }, { name: "input.s", content: EXAMPLES["input.s"] }]);
    expect(run.reports.at(-1)?.waitingForInput).toBe(true);
    expect(run.output).toBe("First Number:");
    expect(run.reports.flatMap((report) => report.io)).toEqual([{ trap: 5, descriptor: 1, text: "First Number:" }]);
  });

  it("says what each trap writes and on which descriptor: write on the errors (fd 2), and open warns there too", () => {
    const program = [
      " .data",
      "args: .word 2, text, 5",
      'text: .ascii "oops\\n"',
      " .text",
      " addi r14,r0,args",
      " trap 4",
      " trap 1",
      " trap 0",
    ].join("\n");
    const run = simulate(source(program));
    const io = run.reports.flatMap((report) => report.io);
    expect(io).toEqual([
      { trap: 4, descriptor: 2, text: "oops\n" },
      { trap: 1, descriptor: 2, text: "Trap #1: files cannot be opened in THUMDER\n" },
    ]);
    // Each one in the cycle its trap went on to EX
    expect(run.reports.filter((report) => report.io.length > 0)).toHaveLength(2);
  });
});

// The same final state as the reference executor, whatever the configuration
const CONFIGS: [string, Partial<MachineConfig>][] = [
  ["with forwarding", {}],
  ["without forwarding", { forwarding: false }],
  ["with fast and many floating point units", { fadd: { count: 2, delay: 1 }, fmul: { count: 3, delay: 2 }, fdiv: { count: 2, delay: 4 } }],
  ["with slow floating point units", { forwarding: false, fadd: { count: 1, delay: 7 }, fmul: { count: 1, delay: 11 }, fdiv: { count: 1, delay: 30 } }],
];

const PROGRAMS: [string, string[], string[]][] = [
  ["prim.s", ["prim.s"], []],
  ["base.s", ["base.s"], []],
  ["win-dlx.s", ["win-dlx.s"], []],
  ["gcm.s", ["gcm.s", "input.s"], ["84", "36"]],
  ["fact.s", ["fact.s", "input.s"], ["10"]],
];

describe("Pipeline results", () => {
  for (const [label, config] of CONFIGS) {
    it.each(PROGRAMS)(`%s ends as the reference ${label}`, (_name, names, lines) => {
      const files = names.map((name) => ({ name, content: EXAMPLES[name] }));
      const run = simulate(files, config, lines);
      const machine = { ...DEFAULT_MACHINE_CONFIG, ...config };
      const reference = runReference(assemble(files, { memorySize: machine.memorySize }), testIO(lines));
      expect(run.reports.at(-1)?.error).toBeUndefined();
      expect(run.pipeline.complete).toBe(true);
      expect(Array.from(run.pipeline.registers.R)).toEqual(Array.from(reference.registers.R));
      expect(Array.from(run.pipeline.registers.F)).toEqual(Array.from(reference.registers.F));
      expect(run.pipeline.registers.FPSR).toBe(reference.registers.FPSR);
      expect(Buffer.from(run.pipeline.memory.bytes).equals(Buffer.from(reference.memory.bytes))).toBe(true);
      expect(run.pipeline.stats.instructions).toBe(reference.instructions);
    });
  }

  it("prints the results of gcm.s and fact.s", () => {
    expect(simulate([{ name: "gcm.s", content: EXAMPLES["gcm.s"] }, { name: "input.s", content: EXAMPLES["input.s"] }], {}, ["84", "36"]).output).toContain("gcM=12");
    expect(simulate([{ name: "fact.s", content: EXAMPLES["fact.s"] }, { name: "input.s", content: EXAMPLES["input.s"] }], {}, ["10"]).output).toContain(
      "Factorial = 3.6288e+06",
    );
  });
});
