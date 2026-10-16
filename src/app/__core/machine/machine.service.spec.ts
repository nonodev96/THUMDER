import { TestBed } from "@angular/core/testing";
import { DEFAULT_STEP_SIMULATION } from "@app/CONSTANTS";
import type { TypeSimulationStep } from "@app/Types";
import { EXAMPLES } from "@core/engine/examples.spec-helper";
import type { LocalSimulationStep } from "@core/engine/simulator";
import { MachineService } from "@core/machine/machine.service";
import { FileSystemService } from "@core/services/file-system/file-system.service";
import { FileSystemStorageService } from "@core/services/file-system/file-system-storage.service";
import { LocalSimulatorService } from "@core/services/simulator/local-simulator.service";
import { defaultConfig, saveConfig } from "@core/config/config";
import { StorageService } from "@core/storage/storage.service";
import { TranslateService } from "@ngx-translate/core";
import { ToastrService } from "ngx-toastr";
import { of } from "rxjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** A simulator that answers each request when the test says so, and runs only when the test sends it cycles */
class FakeSimulator {
  public requests: { event: string; payload: unknown; resolve: (value: unknown) => void; reject: (error: Error) => void }[] = [];
  public runs: { breakpoints: number[]; onStep: (step: LocalSimulationStep) => Promise<void>; finish: (error?: Error) => void }[] = [];
  public paused = 0;

  public request<T>(event: string, payload: unknown): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.requests.push({ event, payload, resolve: resolve as (value: unknown) => void, reject });
    });
  }

  public run(options: { delay: number; breakpoints: number[] }, onStep: (step: LocalSimulationStep) => Promise<void>): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.runs.push({ breakpoints: options.breakpoints, onStep, finish: (error) => (error ? reject(error) : resolve("paused")) });
    });
  }

  public pause(): void {
    this.paused++;
  }

  public pending(event: string) {
    return this.requests.filter((request) => request.event === event);
  }
}

const step = (n: number, extra: Partial<TypeSimulationStep> = {}) =>
  ({
    ...structuredClone(DEFAULT_STEP_SIMULATION),
    step: n,
    line: n,
    registers: [],
    memory: [],
    statistics: {},
    ...extra,
  }) as LocalSimulationStep;

// Lets the promises waiting on an answer go on
const flush = async () => {
  for (let i = 0; i < 10; i++) await Promise.resolve();
};

const providers = (simulator: unknown, programFiles: { name: string; content: string }[] = []) => [
  ...(simulator ? [{ provide: LocalSimulatorService, useValue: simulator }] : []),
  { provide: FileSystemService, useValue: { programFiles: async () => programFiles } },
  // The exercises (their locks) only read the storage; the files of the file manager are not needed here
  { provide: FileSystemStorageService, useValue: {} },
  { provide: TranslateService, useValue: { get: (key: string) => of(key) } },
  { provide: ToastrService, useValue: { info: vi.fn(), warning: vi.fn(), error: vi.fn() } },
];

describe("MachineService with a fake simulator", () => {
  let simulator: FakeSimulator;
  let machine: MachineService;

  beforeEach(() => {
    for (const level of ["debug", "error", "warn"] as const) vi.spyOn(console, level).mockImplementation(() => undefined);
    localStorage.clear();
    saveConfig(localStorage, { ...defaultConfig(), delay: 0 });
    const storage = new StorageService();
    storage.setItem("breakpoints", { "4": true, "9": false });
    simulator = new FakeSimulator();
    TestBed.configureTestingModule({ providers: providers(simulator) });
    machine = TestBed.inject(MachineService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it("sends the configuration, loads the file and keeps the active breakpoints", async () => {
    const resetting = machine.resetMachineStatus();
    await flush();
    expect(simulator.requests.map((request) => request.event)).toEqual(["UpdateConfigurationMachineRequest"]);
    simulator.requests[0].resolve({});
    await flush();
    expect(simulator.requests.map((request) => request.event)).toEqual(["UpdateConfigurationMachineRequest", "SimulationInitRequest"]);
    simulator.requests[1].resolve({
      filename: "prim.s",
      id: "thumder",
      date: "",
      lines: 1,
      canSimulate: true,
      errors: [],
      machineDirectives: [],
      machineInstructions: [{ address: "0x00000100", code: "0x20010000", instruction: "ADDI R1, R0, 0", text: "" }],
      runner: [],
    });
    expect(await resetting).toBe(true);
    expect(machine.canSimulate).toBe(true);
    expect(machine.memory.getMemoryWordBinaryByIndex(0x100)).toBe("00100000000000010000000000000000");
    expect(machine.breakpointManager.getAllLinesWithBreakpoints()).toEqual([4]);
  });

  it("reports false when the simulator fails to load the file", async () => {
    const resetting = machine.resetMachineStatus();
    await flush();
    simulator.requests[0].resolve({});
    await flush();
    simulator.requests[1].reject(new Error("Broken worker"));
    expect(await resetting).toBe(false);
  });

  it("does not ask for a second cycle while one is on its way", async () => {
    const first = machine.nextStep();
    const second = machine.nextStep();
    await flush();
    expect(simulator.pending("SimulationNextStepRequest")).toHaveLength(1);
    simulator.requests[0].resolve(step(1));
    await Promise.all([first, second]);
    expect(machine.step).toBe(1);
  });

  it("updates the pipeline and the cycle clock diagram on every cycle, with no view open", async () => {
    const diagramVersion = machine.state.diagram();
    const stepping = machine.nextStep();
    await flush();
    const withUnits = step(1);
    withUnits.pipeline.faddEX = [{ address: "" as `0x${string}`, addressRow: 0, draw: true, unit: 0 }];
    simulator.requests[0].resolve(withUnits);
    await stepping;
    expect(machine.state.pipeline()?.faddEX).toEqual([{ unit: 0, text: "", draw: true }]);
    expect(machine.state.diagram()).toBe(diagramVersion + 1);
    expect(machine.diagram.cycles).toBe(2);
    expect(machine.diagram.cell(0, 1)).toBe("faddEX");
  });

  it("runs in the simulator with the active breakpoints, draws each cycle and stops at a breakpoint", async () => {
    // The editor sends the removed ones too, with false
    machine.breakpointManager.updateManager({ 4: true, 9: false });
    const running = machine.resume();
    await flush();
    expect(machine.isRunning).toBe(true);
    expect(simulator.runs).toHaveLength(1);
    expect(simulator.runs[0].breakpoints).toEqual([4]);
    await simulator.runs[0].onStep(step(1));
    await simulator.runs[0].onStep(step(2, { isBreakpoint: true }));
    simulator.runs[0].finish();
    await running;
    expect(machine.isRunning).toBe(false);
    expect(machine.isBreakpoint).toBe(true);
    expect(machine.step).toBe(2);
  });

  it("asks the simulator to pause, and stops running if the simulator fails", async () => {
    const running = machine.resume();
    await flush();
    await machine.pause();
    expect(simulator.paused).toBe(1);
    expect(machine.isRunning).toBe(false);
    simulator.runs[0].finish(new Error("Broken worker"));
    await running;
    expect(machine.isRunning).toBe(false);
  });

  it("sends the registers to the simulator and applies its answer", async () => {
    const updating = machine.updateRegisters([{ typeRegister: "Integer", register: 5 as unknown as string, hexadecimalValue: "0000000A" }]);
    await flush();
    const [request] = simulator.pending("UpdateRegisterRequest");
    expect(JSON.parse(request.payload as string)).toEqual([{ typeRegister: "Integer", register: 5, hexadecimalValue: "0000000A" }]);
    request.resolve({ allOK: true, registerToUpdates: [{ typeRegister: "Integer", register: "R5", hexadecimalValue: "0000000B" }] });
    expect(await updating).toBe(true);
    expect(machine.registers.R[5].hexValue).toBe("0000000b");
  });
});

describe("MachineService with the simulator of THUMDER", () => {
  const file = (name: string) => ({ ...JSON.parse(JSON.stringify({ name, content: EXAMPLES[name], key: name, path: "" })) });

  const start = async (name: string, modules: string[] = []) => {
    for (const level of ["debug", "error", "warn"] as const) vi.spyOn(console, level).mockImplementation(() => undefined);
    localStorage.clear();
    saveConfig(localStorage, { ...defaultConfig(), delay: 0 });
    const storage = new StorageService();
    storage.setItem("interfaceFileItem", file(name));
    TestBed.configureTestingModule({ providers: providers(null, modules.map((module) => ({ name: module, content: EXAMPLES[module] }))) });
    const machine = TestBed.inject(MachineService);
    expect(await machine.resetMachineStatus()).toBe(true);
    return machine;
  };

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it("assembles and runs prim.s: the primes end up in the memory of THUMDER", async () => {
    const machine = await start("prim.s");
    expect(machine.canSimulate).toBe(true);
    await machine.resume();
    expect(machine.isComplete).toBe(true);
    const table = 0x1004;
    const primes = Array.from({ length: 10 }, (_, i) => parseInt(machine.memory.getMemoryWordBinaryByIndex(table + 4 * i), 2));
    expect(primes).toEqual([2, 3, 5, 7, 11, 13, 17, 19, 23, 29]);
    expect(machine.registers.PC.hexValue).not.toBe("00000000");
  });

  it("runs gcm.s with input.s: waits for each number and prints the result in the console", async () => {
    const machine = await start("gcm.s", ["input.s", "prim.s"]);
    await machine.resume();
    expect(machine.state.waitingForInput()).toBe(true);
    expect(machine.state.output()).toBe("First Number:");
    await machine.provideInput("84");
    await machine.resume();
    await machine.provideInput("36");
    await machine.resume();
    expect(machine.isComplete).toBe(true);
    expect(machine.state.output()).toBe("First Number:84\nSecond Number: 36\ngcM=12\n\n");
  });
});

describe("MachineService, stepping back and running without drawing", () => {
  const file = (name: string) => ({ name, content: EXAMPLES[name], key: name, path: "" });
  const start = async (name: string, modules: string[] = []) => {
    for (const level of ["debug", "error", "warn", "info"] as const) vi.spyOn(console, level).mockImplementation(() => undefined);
    localStorage.clear();
    saveConfig(localStorage, { ...defaultConfig(), delay: 0 });
    new StorageService().setItem("interfaceFileItem", file(name));
    TestBed.configureTestingModule({ providers: providers(null, modules.map((module) => ({ name: module, content: EXAMPLES[module] }))) });
    const machine = TestBed.inject(MachineService);
    expect(await machine.resetMachineStatus()).toBe(true);
    return machine;
  };
  const snapshot = (machine: MachineService) => ({
    cycles: machine.state.cycles(),
    step: machine.state.step(),
    pc: machine.registers.PC.hexValue,
    r: [1, 2, 3, 4, 5].map((n) => machine.registers.R[n].hexValue),
    output: machine.state.output(),
    rows: [...machine.diagram.rows],
    pipeline: JSON.stringify(machine.state.pipeline()),
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it("goes back one cycle to exactly the state it had (EDU-03)", async () => {
    const machine = await start("prim.s");
    for (let i = 0; i < 15; i++) await machine.nextStep();
    const before = snapshot(machine);
    await machine.nextStep();
    await machine.nextStep();
    await machine.stepBack();
    await machine.stepBack();
    expect(snapshot(machine)).toEqual(before);
    // To the start: the program loaded and no cycles
    for (let i = 0; i < 15; i++) await machine.stepBack();
    expect(machine.state.cycles()).toBe(0);
    expect(machine.diagram.cycles).toBe(0);
  });

  it("repeats the lines typed in the console and the registers changed by hand", async () => {
    const machine = await start("gcm.s", ["input.s"]);
    await machine.resume();
    expect(machine.state.waitingForInput()).toBe(true);
    await machine.provideInput("84");
    for (let i = 0; i < 5; i++) await machine.nextStep();
    await machine.updateRegisters([{ typeRegister: "Integer", register: 9 as unknown as string, hexadecimalValue: "0000002A" }]);
    await machine.nextStep();
    const before = snapshot(machine);
    await machine.nextStep();
    await machine.stepBack();
    expect(snapshot(machine)).toEqual(before);
    expect(machine.registers.R[9].hexValue).toBe("0000002a");
    expect(machine.state.output()).toBe("First Number:84\n");
    expect(machine.state.waitingForInput()).toBe(false);
  });

  it("runs to the end without drawing each cycle, and draws where it stopped (UI-04)", async () => {
    const machine = await start("prim.s");
    const versions: number[] = [];
    const watch = setInterval(() => versions.push(machine.state.diagram()), 0);
    await machine.runToEnd();
    clearInterval(watch);
    expect(machine.isComplete).toBe(true);
    expect(machine.state.quiet()).toBe(false);
    expect(machine.state.cycles()).toBeGreaterThan(100);
    expect(machine.diagram.cycles).toBe(machine.state.cycles());
    // The diagram was drawn once at the end, not once per cycle
    expect(new Set(versions).size).toBeLessThanOrEqual(2);
    const primes = Array.from({ length: 10 }, (_, i) => parseInt(machine.memory.getMemoryWordBinaryByIndex(0x1004 + 4 * i), 2));
    expect(primes).toEqual([2, 3, 5, 7, 11, 13, 17, 19, 23, 29]);
  });

  it("knows the symbols and the modules of the program", async () => {
    const machine = await start("gcm.s", ["input.s", "prim.s"]);
    expect(machine.state.modules()).toEqual(["input.s"]);
    expect(machine.state.symbols().find((symbol) => symbol.name === "InputUnsigned")).toMatchObject({ file: "input.s", global: true });
  });
});

describe("MachineService.stringFormat", () => {
  it("replaces each {n} with the parameter with index n, objects as JSON, and leaves the missing ones", () => {
    expect(
      MachineService.stringFormat("Step {0}: {1} at {2}, {3}", [
        { index: 0, value: 7 },
        { index: 1, value: { line: 3 } },
        { index: 2, value: "0x00000100" },
      ]),
    ).toBe('Step 7: {"line":3} at 0x00000100, {3}');
  });
});
