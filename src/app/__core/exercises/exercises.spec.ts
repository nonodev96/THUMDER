import { defaultConfig, validateConfig } from "@core/config/config";
import { CLASSICS, SUPERDLX_EXAMPLES } from "@core/engine/examples.spec-helper";
import { DLXSimulator, type LocalSimulationStep } from "@core/engine/simulator";
import { superscalarProfile } from "@core/engine/superscalar-config";
import { describe, expect, it } from "vitest";
import catalogue from "../../../assets/exercises/exercises.json";
import { answerOf, type Exercise, isRight } from "./exercises";

const exercises = catalogue as Exercise[];
const EXAMPLES = { ...CLASSICS, ...SUPERDLX_EXAMPLES };

/** Runs an exercise in the simulator with its configuration, and returns the answers to its questions */
function solve(exercise: Exercise): Record<string, number | undefined> {
  const config = validateConfig({ ...defaultConfig(), ...exercise.config });
  const simulator = new DLXSimulator();
  simulator.configure({
    enabledForwarding: config.forwarding,
    memorySize: config.memorySize,
    addition: config.floatingPoint.addition,
    multiplication: config.floatingPoint.multiplication,
    division: config.floatingPoint.division,
    architecture: config.architecture,
    superscalar: config.superdlx,
  });
  const name = exercise.file.split("/").pop() as string;
  const init = simulator.init({ id: "t", filename: name, date: "", content: EXAMPLES[name], registers: [], memory: [], breakpoints: [] });
  expect(init.canSimulate, exercise.id).toBe(true);
  const registers = new Map<string, number>();
  let last: LocalSimulationStep | null = null;
  for (let i = 0; i < 200_000 && !last?.isComplete; i++) {
    last = simulator.step();
    expect(last.waitingForInput, exercise.id).toBeFalsy();
    for (const change of last.registers) registers.set(String(change.register), Number.parseInt(change.hexadecimalValue, 16) | 0);
  }
  expect(last?.isComplete, exercise.id).toBe(true);
  const sources = {
    statistics: last?.statistics,
    register: (register: string) => registers.get(register),
    superscalar: simulator.superscalarStats ?? undefined,
  };
  return Object.fromEntries(exercise.questions.map((question) => [question.id, answerOf(question.answer, sources)]));
}

describe("the guided exercises (EDU-04)", () => {
  it("have their program, both languages and an answer for each question in the simulation", () => {
    expect(exercises.length).toBeGreaterThanOrEqual(8);
    for (const exercise of exercises) {
      expect(EXAMPLES[exercise.file.split("/").pop() as string], exercise.file).toBeDefined();
      for (const texts of [exercise.title, exercise.statement, ...exercise.questions.map((question) => question.text)]) {
        expect(texts.es && texts.en, exercise.id).toBeTruthy();
      }
      const answers = solve(exercise);
      for (const [id, value] of Object.entries(answers)) expect(Number.isInteger(value), `${exercise.id}: ${id}`).toBe(true);
    }
  });

  it("ask what they say: forwarding saves cycles, the structural hazard and the taken branches are there", () => {
    const byId = (id: string) => solve(exercises.find((exercise) => exercise.id === id) as Exercise);
    const withForwarding = byId("riesgos-de-datos");
    const without = byId("sin-adelantamiento");
    expect(without.cycles).toBeGreaterThan(withForwarding.cycles as number);
    expect(withForwarding.loads).toBeGreaterThan(0);
    expect(byId("riesgo-estructural").structural).toBeGreaterThan(0);
    expect(byId("riesgos-de-control").taken).toBeGreaterThan(0);
    expect(byId("recursividad").result).toBe(5040);
  });

  it("of SuperDLX ask what they say: being superscalar, the prediction and the size of the ROB", () => {
    const byId = (id: string) => solve(exercises.find((exercise) => exercise.id === id) as Exercise);
    const superscalar = exercises.filter((exercise) => exercise.config.architecture === "superdlx");
    expect(superscalar.length).toBeGreaterThanOrEqual(8);
    expect(superscalar.every((exercise) => exercise.topic === "superscalar")).toBe(true);
    // The scalar machine of the exercise is the one of the configuration
    const scalar = exercises.find((exercise) => exercise.id === "superdlx-escalar") as Exercise;
    expect(validateConfig({ superdlx: scalar.config.superdlx }).superdlx).toEqual(superscalarProfile("scalar"));

    const wide = byId("superdlx-paralelismo");
    const narrow = byId("superdlx-escalar");
    expect(narrow.cycles).toBeGreaterThan(2 * (wide.cycles as number));
    const predicted = byId("superdlx-prediccion");
    const waiting = byId("superdlx-sin-prediccion");
    expect(predicted.mispredicted).toBeGreaterThan(0);
    expect(predicted.squashed).toBeGreaterThan(predicted.mispredicted as number);
    expect(waiting.squashed).toBe(0);
    expect(waiting.waits).toBeGreaterThan(0);
    expect(waiting.cycles).toBeGreaterThan(predicted.cycles as number);
    expect(byId("superdlx-renombrado").sumB).toBe(360);
    expect(byId("superdlx-memoria").blocked).toBeGreaterThan(0);
    const small = byId("superdlx-rob-pequeno");
    const large = byId("superdlx-rob-grande");
    expect(small.cycles).toBeGreaterThan(large.cycles as number);
    expect(small.robFull).toBeGreaterThan(large.robFull as number);
    // The same program and instructions as the exercise of DLX, in fewer cycles
    const dlx = byId("coma-flotante");
    const superdlx = byId("superdlx-frente-a-dlx");
    expect(superdlx.cycles).toBeLessThan(dlx.cycles as number);
  });

  it("check the answers written as numbers", () => {
    expect(isRight(" 42 ", 42)).toBe(true);
    expect(isRight("4 2", 42)).toBe(true);
    expect(isRight("41", 42)).toBe(false);
    expect(isRight("", 0)).toBe(false);
    expect(isRight("12", undefined)).toBe(false);
  });
});
