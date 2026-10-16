import { EXAMPLES } from "@core/engine/examples.spec-helper";
import { type FromSimulator, type RunOptions, SimulationRunner } from "@core/engine/runner";
import type { LocalSimulationStep } from "@core/engine/simulator";
import { describe, expect, it } from "vitest";

/** A runner and what it sends, with a way to wait for the end of a run */
function start(filename: string, content: string, files: { name: string; content: string }[] = []) {
  const steps: LocalSimulationStep[] = [];
  const stops: string[] = [];
  let resolveStop: (() => void) | null = null;
  const runner = new SimulationRunner((message: FromSimulator) => {
    if (message.kind === "steps") steps.push(...message.steps);
    if (message.kind === "stopped") {
      stops.push(message.reason);
      resolveStop?.();
    }
  });
  runner.handle({ kind: "request", id: 1, event: "SimulationInitRequest", payload: JSON.stringify({ id: "t", filename, date: "", content, files }) });
  const run = (delay = 0, breakpoints: number[] = [], options: Partial<RunOptions> = {}) =>
    new Promise<void>((resolve) => {
      resolveStop = resolve;
      runner.handle({ kind: "run", delay, breakpoints, ...options });
    });
  return { runner, steps, stops, run };
}

describe("SimulationRunner", () => {
  it("runs to the end by itself, several cycles per message when there is no delay", async () => {
    const { steps, stops, run } = start("prim.s", EXAMPLES["prim.s"]);
    await run();
    expect(stops).toEqual(["complete"]);
    expect(steps.at(-1)?.isComplete).toBe(true);
    expect(steps.map((step) => step.step)).toEqual(steps.map((_, i) => i).slice(0, steps.length - 1).concat(steps.at(-1)?.step as number));
  });

  it("stops when the instruction of a breakpoint line is fetched, and goes on from there", async () => {
    const { steps, stops, run } = start("prim.s", EXAMPLES["prim.s"]);
    const loop = EXAMPLES["prim.s"].split("\n").findIndex((line) => line.startsWith("Loop:")) + 1;
    await run(0, [loop]);
    expect(stops).toEqual(["breakpoint"]);
    expect(steps.at(-1)).toMatchObject({ line: loop, isNewInstruction: true, isBreakpoint: true });
    const before = steps.length;
    await run(0, [loop]);
    expect(stops).toEqual(["breakpoint", "breakpoint"]);
    expect(steps.length).toBeGreaterThan(before + 1);
  });

  it("stops when the program waits for input and goes on with it", async () => {
    const { runner, steps, stops, run } = start("gcm.s", EXAMPLES["gcm.s"], [{ name: "input.s", content: EXAMPLES["input.s"] }]);
    await run();
    expect(stops).toEqual(["input"]);
    runner.handle({ kind: "request", id: 2, event: "SimulationInputRequest", payload: JSON.stringify({ text: "84" }) });
    await run();
    runner.handle({ kind: "request", id: 3, event: "SimulationInputRequest", payload: JSON.stringify({ text: "36" }) });
    await run();
    expect(stops).toEqual(["input", "input", "complete"]);
    expect(steps.map((step) => step.output ?? "").join("")).toBe("First Number:Second Number: gcM=12\n\n");
  });

  it("goes at the pace it is given and stops when it is paused", async () => {
    const { runner, steps, stops, run } = start("prim.s", EXAMPLES["prim.s"]);
    const running = run(20);
    await new Promise((resolve) => setTimeout(resolve, 110));
    runner.handle({ kind: "pause" });
    await running;
    expect(stops).toEqual(["paused"]);
    // One cycle every 20 ms: about 6 in 110 ms, never hundreds
    expect(steps.length).toBeGreaterThanOrEqual(3);
    expect(steps.length).toBeLessThanOrEqual(8);
  });

  it("stops when the instruction of a line arrives at the stage of its breakpoint (NUC-11)", async () => {
    const { steps, stops, run } = start("prim.s", EXAMPLES["prim.s"]);
    const store = EXAMPLES["prim.s"].split("\n").findIndex((line) => line.includes("sw      Table(r1),r2")) + 1;
    await run(0, [store], { stages: [{ line: store, stage: "MEM" }] });
    expect(stops).toEqual(["breakpoint"]);
    const last = steps.at(-1) as LocalSimulationStep;
    expect(last.hit).toEqual({ kind: "line", line: store, stage: "MEM" });
    // The store is in MEM in that cycle, and was not in the cycle before
    expect(last.pipeline.MEM.draw).toBe(true);
    expect(steps.at(-2)?.pipeline.MEM.addressRow).not.toBe(last.pipeline.MEM.addressRow);
  });

  it("stops when a watched address is written or read", async () => {
    const table = 0x1004;
    const writes = start("prim.s", EXAMPLES["prim.s"]);
    await writes.run(0, [], { watchpoints: [{ address: table + 4, bytes: 4, read: false, write: true }] });
    expect(writes.stops).toEqual(["breakpoint"]);
    expect(writes.steps.at(-1)?.hit).toEqual({ kind: "write", address: table + 4 });
    const reads = start("prim.s", EXAMPLES["prim.s"]);
    await reads.run(0, [], { watchpoints: [{ address: table, bytes: 4, read: true, write: false }] });
    expect(reads.steps.at(-1)?.hit).toEqual({ kind: "read", address: table });
  });

  it("runs up to a cycle and makes again the changes of the journal at their cycle (EDU-03)", async () => {
    const first = start("gcm.s", EXAMPLES["gcm.s"], [{ name: "input.s", content: EXAMPLES["input.s"] }]);
    await first.run();
    const waitAt = first.steps.length;
    first.runner.handle({ kind: "request", id: 2, event: "SimulationInputRequest", payload: JSON.stringify({ text: "84" }) });
    await first.run();
    const second = start("gcm.s", EXAMPLES["gcm.s"], [{ name: "input.s", content: EXAMPLES["input.s"] }]);
    const until = first.steps.length - 1;
    await second.run(0, [], { until, journal: [{ at: waitAt, event: "SimulationInputRequest", payload: JSON.stringify({ text: "84" }) }] });
    expect(second.stops).toEqual(["paused"]);
    expect(second.steps).toHaveLength(until);
    expect(second.steps.map((step) => step.output ?? "").join("")).toBe(
      first.steps.slice(0, until).map((step) => step.output ?? "").join(""),
    );
  });

  it("changes its pace while it runs", async () => {
    const { runner, steps, stops, run } = start("prim.s", EXAMPLES["prim.s"]);
    const running = run(1000);
    await new Promise((resolve) => setTimeout(resolve, 30));
    runner.handle({ kind: "speed", delay: 0 });
    await running;
    expect(stops).toEqual(["complete"]);
    expect(steps.length).toBeGreaterThan(100);
  });

  it("answers the requests and reports their errors", () => {
    const answers: FromSimulator[] = [];
    const runner = new SimulationRunner((message) => answers.push(message));
    runner.handle({ kind: "request", id: 7, event: "Nonsense", payload: "{}" });
    expect(answers).toEqual([{ kind: "response", id: 7, error: "Unknown request Nonsense" }]);
  });
});
