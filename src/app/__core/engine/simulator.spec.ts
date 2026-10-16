import type { TypeConfigurationMachine, TypeSimulationInitResponse } from "@app/Types";
import { EXAMPLES } from "@core/engine/examples.spec-helper";
import { DLXSimulator, type LocalSimulationStep } from "@core/engine/simulator";
import { describe, expect, it } from "vitest";

const request = (filename: string, content: string, files: { name: string; content: string }[] = []) => ({
  id: "local",
  filename,
  date: "",
  content,
  registers: [],
  memory: [],
  breakpoints: [],
  files,
});

const CONFIG: TypeConfigurationMachine = {
  enabledForwarding: true,
  memorySize: 0x8000,
  addition: { count: 1, delay: 2 },
  multiplication: { count: 1, delay: 5 },
  division: { count: 1, delay: 19 },
};

function runToEnd(simulator: DLXSimulator, max = 100_000): LocalSimulationStep[] {
  const steps: LocalSimulationStep[] = [];
  for (let i = 0; i < max; i++) {
    const step = simulator.step();
    steps.push(step);
    if (step.isComplete || step.waitingForInput) break;
  }
  return steps;
}

describe("DLXSimulator", () => {
  it("assembles the program and sends the code and the data", () => {
    const simulator = new DLXSimulator();
    const init = JSON.parse(simulator.handle("SimulationInitRequest", JSON.stringify(request("prim.s", EXAMPLES["prim.s"])))) as TypeSimulationInitResponse;
    expect(init.canSimulate).toBe(true);
    expect(init.errors).toEqual([]);
    expect(init.machineInstructions[0]).toEqual({ address: "0x00000100", code: "0x20010000", text: "main", instruction: "addi    r1,r0,0         ;Index in Table".replace(/\s+;.*/, "") });
    expect(init.runner[0].memory).toContainEqual({ typeData: "Word", address: "0x00001000", value: "0x0000000A" });
  });

  it("reports the errors of the program with their line and severity", () => {
    const simulator = new DLXSimulator();
    const init = simulator.init(request("bad.s", " addi r1,r0,1\n frob r2"));
    expect(init.canSimulate).toBe(false);
    expect(init.errors).toEqual([{ line: 2, message: "Unknown instruction frob", severity: 8 }]);
    expect(simulator.step().isComplete).toBe(true);
  });

  it("runs prim.s to the end and leaves the primes in memory", () => {
    const simulator = new DLXSimulator();
    simulator.init(request("prim.s", EXAMPLES["prim.s"]));
    simulator.configure(CONFIG);
    const steps = runToEnd(simulator);
    const last = steps.at(-1) as LocalSimulationStep;
    expect(last.isComplete).toBe(true);
    expect(last.error).toBeUndefined();
    const stores = steps.flatMap((step) => step.memory).filter((change) => change.typeData === "Word");
    expect(stores.map((change) => Number.parseInt(change.value, 16))).toEqual([2, 3, 5, 7, 11, 13, 17, 19, 23, 29]);
    expect(last.statistics.TOTAL?.CYCLES_EXECUTED.cycles).toBe(steps.length);
    // Every step after the first one fetches an instruction and knows its line
    expect(steps[0]).toMatchObject({ step: 0, isNewInstruction: true, line: 24 });
    expect(steps[0].pipeline.IF).toEqual({ address: "0x00000100", addressRow: 0, draw: true });
  });

  it("adds the modules that define the missing global symbols, and only those", () => {
    const simulator = new DLXSimulator();
    const init = simulator.init(
      request("gcm.s", EXAMPLES["gcm.s"], [
        { name: "input.s", content: EXAMPLES["input.s"] },
        { name: "prim.s", content: EXAMPLES["prim.s"] },
      ]),
    );
    expect(init.errors).toEqual([]);
    expect(init.canSimulate).toBe(true);
  });

  it("starts at main even if a module comes first", () => {
    const simulator = new DLXSimulator();
    simulator.init(request("z.s", " .text\n .global main\nmain: jal helper\n trap 0", [{ name: "a.s", content: " .text\n .global helper\nhelper: addi r5,r0,7\n jr r31" }]));
    const steps = runToEnd(simulator);
    expect(steps.at(-1)?.isComplete).toBe(true);
    expect(steps.flatMap((step) => step.registers)).toContainEqual({ typeRegister: "Integer", register: "R5", hexadecimalValue: "0x00000007" });
  });

  it("asks for input and goes on with it", () => {
    const simulator = new DLXSimulator();
    simulator.init(request("gcm.s", EXAMPLES["gcm.s"], [{ name: "input.s", content: EXAMPLES["input.s"] }]));
    let steps = runToEnd(simulator);
    expect(steps.at(-1)?.waitingForInput).toBe(true);
    expect(steps.map((step) => step.output ?? "").join("")).toBe("First Number:");
    simulator.handle("SimulationInputRequest", JSON.stringify({ text: "84" }));
    steps = runToEnd(simulator);
    simulator.provideInput("36");
    steps = [...steps, ...runToEnd(simulator)];
    expect(steps.at(-1)?.isComplete).toBe(true);
    expect(steps.map((step) => step.output ?? "").join("")).toBe("Second Number: gcM=12\n\n");
  });

  it("applies the configuration: without forwarding there are more stalls", () => {
    const cycles = (forwarding: boolean) => {
      const simulator = new DLXSimulator();
      simulator.init(request("prim.s", EXAMPLES["prim.s"]));
      simulator.configure({ ...CONFIG, enabledForwarding: forwarding });
      return (runToEnd(simulator).at(-1) as LocalSimulationStep).statistics.TOTAL?.CYCLES_EXECUTED.cycles ?? 0;
    };
    expect(cycles(false)).toBeGreaterThan(cycles(true));
  });

  it("changes registers and memory", () => {
    const simulator = new DLXSimulator();
    simulator.init(request("a.s", " add r2,r1,r1\n trap 0"));
    expect(simulator.updateRegisters([{ typeRegister: "Integer", register: "R1", hexadecimalValue: "0x00000015" }])).toEqual({
      allOK: true,
      registerToUpdates: [{ typeRegister: "Integer", register: "R1", hexadecimalValue: "0x00000015" }],
    });
    expect(simulator.updateRegisters([{ typeRegister: "Double", register: "F2", hexadecimalValue: "400921FB54442D18" }]).registerToUpdates[0].hexadecimalValue).toBe(
      "0x400921FB54442D18",
    );
    expect(simulator.updateMemory([{ typeData: "Word", address: "0x00002000", value: "0xCAFE" }]).allOK).toBe(true);
    expect(simulator.updateMemory([{ typeData: "Word", address: "0x00002001", value: "1" }]).allOK).toBe(false);
    const steps = runToEnd(simulator);
    expect(steps.flatMap((step) => step.registers)).toContainEqual({ typeRegister: "Integer", register: "R2", hexadecimalValue: "0x0000002A" });
  });

  it("stops with the error of the program", () => {
    const simulator = new DLXSimulator();
    simulator.init(request("a.s", " addi r1,r0,1\n lw r2,0(r1)\n trap 0"));
    const last = runToEnd(simulator).at(-1) as LocalSimulationStep;
    expect(last.isComplete).toBe(true);
    expect(last.error).toMatch(/not aligned/);
  });
});

describe("DLXSimulator, for the teaching tools", () => {
  const hazards = "        .text\nmain:   addi r1,r0,5\n        add  r2,r1,r1\n        lw   r3,0(r0)\n        add  r4,r3,r3\n        trap 0\n";
  const stallsOf = (forwarding: boolean) => {
    const simulator = new DLXSimulator();
    simulator.configure({ ...CONFIG, enabledForwarding: forwarding });
    simulator.init(request("hazards.s", hazards));
    return runToEnd(simulator).flatMap((step) => step.stalls ?? []);
  };

  it("explains each stall: the register, the instruction that produces it and whether forwarding helps (EDU-01)", () => {
    const without = stallsOf(false).filter((stall) => stall.kind === "raw");
    expect(without.find((stall) => stall.row === 1)).toMatchObject({ label: "R-Stall", register: "R1", cause: 0, forwardingHelps: true });
    const withForwarding = stallsOf(true).filter((stall) => stall.kind === "raw");
    // With forwarding only the load followed by its use stalls: a real dependency, which forwarding does not avoid
    expect(withForwarding.map((stall) => stall.row)).toEqual([3]);
    expect(withForwarding[0]).toMatchObject({ register: "R3", cause: 2, forwardingHelps: false });
    // The instruction behind a stalled one waits too, because of it
    expect(stallsOf(false).find((stall) => stall.kind === "blocked")?.cause).toBe(1);
  });

  it("lists the symbols of the program, with their address and whether they are global", () => {
    const simulator = new DLXSimulator();
    const init = simulator.init(request("prim.s", EXAMPLES["prim.s"]));
    const byName = new Map(init.symbols.map((symbol) => [symbol.name, symbol]));
    expect(byName.get("main")).toEqual({ name: "main", address: "0x00000100", file: "prim.s", global: true });
    expect(byName.get("Table")).toMatchObject({ address: "0x00001004", global: true });
    expect(byName.get("Loop")).toMatchObject({ global: false });
  });

  it("uses only the modules chosen, when they are chosen (NUC-10)", () => {
    const files = [
      { name: "input.s", content: EXAMPLES["input.s"] },
      { name: "prim.s", content: EXAMPLES["prim.s"] },
    ];
    const automatic = new DLXSimulator().init(request("gcm.s", EXAMPLES["gcm.s"], files));
    expect(automatic.modules).toEqual(["input.s"]);
    const none = new DLXSimulator().init({ ...request("gcm.s", EXAMPLES["gcm.s"], files), modules: [] });
    expect(none.canSimulate).toBe(false);
    expect(none.errors.some((error) => /Undefined symbol: InputUnsigned/.test(error.message))).toBe(true);
    const chosen = new DLXSimulator().init({ ...request("gcm.s", EXAMPLES["gcm.s"], files), modules: ["input.s", "missing.s"] });
    expect(chosen).toMatchObject({ canSimulate: true, modules: ["input.s"] });
  });

  it("compares a program with and without forwarding (EDU-02)", () => {
    const answer = JSON.parse(
      new DLXSimulator().handle("CompareForwardingRequest", JSON.stringify({ init: request("prim.s", EXAMPLES["prim.s"]), configuration: CONFIG })),
    ) as import("@core/engine/simulator").CompareResponse;
    expect(answer.withForwarding.stoppedBy).toBe("complete");
    expect(answer.withoutForwarding.stoppedBy).toBe("complete");
    expect(answer.withForwarding.instructions).toBe(answer.withoutForwarding.instructions);
    expect(answer.withoutForwarding.cycles).toBeGreaterThan(answer.withForwarding.cycles);
    expect(answer.withoutForwarding.rawStalls).toBeGreaterThan(answer.withForwarding.rawStalls);
    expect(answer.withForwarding.cpi).toBeCloseTo(answer.withForwarding.cycles / answer.withForwarding.instructions, 2);
  });
});
