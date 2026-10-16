import { DEFAULT_FLOATING_POINT_STAGE_CONFIGURATION } from "@app/CONSTANTS";
import { describe, expect, it } from "vitest";
import { decodeExercise, encodeExercise, type SharedExercise } from "./share";

const exercise: SharedExercise = {
  version: 1,
  name: "riesgos.s",
  content: "        .text\nmain:   addi r1,r0,5\n        add  r2,r1,r1\n        trap 0\n",
  statement: "¿Cuántos atascos hay sin adelantamiento?",
  forwarding: false,
  floatingPoint: structuredClone(DEFAULT_FLOATING_POINT_STAGE_CONFIGURATION),
  memorySize: 4096,
  locked: ["forwarding"],
};

describe("shared exercises (EDU-07)", () => {
  it("go and come back through the text of a link", async () => {
    const text = await encodeExercise(exercise);
    expect(text).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(await decodeExercise(text)).toEqual(exercise);
  });

  it("are validated: values out of range, unknown locks and names without .s", async () => {
    const text = await encodeExercise({ ...exercise, name: "ej1", memorySize: 3, locked: ["forwarding", "nonsense" as never] });
    expect(await decodeExercise(text)).toMatchObject({ name: "ej1.s", memorySize: 512, locked: ["forwarding"] });
  });

  it("reject a link that was cut or changed", async () => {
    const text = await encodeExercise(exercise);
    await expect(decodeExercise(text.slice(0, text.length / 2))).rejects.toThrow();
    await expect(decodeExercise("not-an-exercise")).rejects.toThrow();
  });
});

describe("the name of a shared exercise", () => {
  it("fits in 100 characters with its .s", async () => {
    const text = await encodeExercise({ ...exercise, name: "x".repeat(150) });
    const decoded = await decodeExercise(text);
    expect(decoded.name.length).toBeLessThanOrEqual(100);
    expect(decoded.name.endsWith(".s")).toBe(true);
  });
});
