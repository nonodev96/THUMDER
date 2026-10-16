import { defaultConfig, validateConfig } from "@core/config/config";
import { CLASSICS as EXAMPLES } from "@core/engine/examples.spec-helper";
import { DLXSimulator, type LocalSimulationStep } from "@core/engine/simulator";
import { describe, expect, it } from "vitest";
import catalogue from "../../../assets/exercises/exercises.json";
import { answerOf, type Exercise, isRight } from "./exercises";

const exercises = catalogue as Exercise[];

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
  const sources = { statistics: last?.statistics, register: (register: string) => registers.get(register) };
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

  it("check the answers written as numbers", () => {
    expect(isRight(" 42 ", 42)).toBe(true);
    expect(isRight("4 2", 42)).toBe(true);
    expect(isRight("41", 42)).toBe(false);
    expect(isRight("", 0)).toBe(false);
    expect(isRight("12", undefined)).toBe(false);
  });
});
