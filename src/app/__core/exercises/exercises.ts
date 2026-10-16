import type { ThumderConfig } from "@core/config/config";

// The guided exercises (EDU-04): a program of the examples, a statement and questions whose answers come from the
// simulation itself, so they are always right for the simulator. The catalogue: src/assets/exercises/exercises.json

export type Texts = { es: string; en: string };

export type Answer = { kind: "statistic"; path: string } | { kind: "register"; name: string };

export type Question = { id: string; text: Texts; answer: Answer };

export type Topic = "data" | "control" | "structural" | "floating" | "loops" | "memory";

export type Exercise = {
  id: string;
  topic: Topic;
  /** The program, in src/assets/examples-dlx */
  file: string;
  title: Texts;
  statement: Texts;
  /** The configuration it needs: these options are locked while it is done */
  config: Partial<Pick<ThumderConfig, "forwarding" | "floatingPoint" | "memorySize">>;
  questions: Question[];
};

/** Where the answers come from: the statistics and the registers of the simulation */
export type AnswerSources = { statistics: unknown; register: (name: string) => number | undefined };

/** The right answer of a question, from the simulation (undefined if it does not have it) */
export function answerOf(answer: Answer, sources: AnswerSources): number | undefined {
  if (answer.kind === "register") return sources.register(answer.name);
  let value: unknown = sources.statistics;
  for (const part of answer.path.split(".")) value = (value as Record<string, unknown> | undefined)?.[part];
  return typeof value === "number" ? value : undefined;
}

/** Whether an answer written by the person is the right one (a number, with or without spaces) */
export function isRight(written: string, expected: number | undefined): boolean {
  if (expected === undefined) return false;
  const number = Number(written.trim().replace(/\s/g, "").replace(",", "."));
  return written.trim() !== "" && Number.isFinite(number) && number === expected;
}
