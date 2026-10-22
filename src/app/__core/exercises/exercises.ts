import type { ThumderConfig } from "@core/config/config";

// The guided exercises (EDU-04): a program of the examples, a statement and questions whose answers come from the
// simulation itself, so they are always right for the simulator. The catalogue: src/assets/exercises/exercises.json

export type Texts = { es: string; en: string };

/**
 * Where the answer of a question is: a statistic (TypeDataStatistics, the ones of DLX, which SuperDLX also fills), a
 * register, or a statistic of SuperDLX (SuperscalarStats: "mispredicted", "commitHistogram.0"...)
 */
export type Answer = { kind: "statistic"; path: string } | { kind: "register"; name: string } | { kind: "superscalar"; path: string };

export type Question = { id: string; text: Texts; answer: Answer };

export type Topic = "data" | "control" | "structural" | "floating" | "loops" | "memory" | "superscalar";

export type Exercise = {
  id: string;
  topic: Topic;
  /** The program, in src/assets/examples-dlx */
  file: string;
  title: Texts;
  statement: Texts;
  /**
   * The configuration it needs: these options are locked while it is done (and always the architecture: DLX if it does
   * not say). The machine of SuperDLX can be given in part: what it does not say is the one of WinSuperDLX
   */
  config: Partial<Pick<ThumderConfig, "architecture" | "forwarding" | "floatingPoint" | "memorySize">> & {
    superdlx?: Record<string, unknown>;
  };
  questions: Question[];
};

/** Where the answers come from: the statistics and the registers of the simulation (and the statistics of SuperDLX) */
export type AnswerSources = { statistics: unknown; register: (name: string) => number | undefined; superscalar?: unknown };

/** The right answer of a question, from the simulation (undefined if it does not have it) */
export function answerOf(answer: Answer, sources: AnswerSources): number | undefined {
  if (answer.kind === "register") return sources.register(answer.name);
  let value: unknown = answer.kind === "superscalar" ? sources.superscalar : sources.statistics;
  for (const part of answer.path.split(".")) value = (value as Record<string, unknown> | undefined)?.[part];
  return typeof value === "number" ? value : undefined;
}

/** Whether an answer written by the person is the right one (a number, with or without spaces) */
export function isRight(written: string, expected: number | undefined): boolean {
  if (expected === undefined) return false;
  const number = Number(written.trim().replace(/\s/g, "").replace(",", "."));
  return written.trim() !== "" && Number.isFinite(number) && number === expected;
}
