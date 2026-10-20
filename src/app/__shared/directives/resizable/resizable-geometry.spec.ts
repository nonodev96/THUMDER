import { describe, expect, it } from "vitest";
import { MIN_PANEL, resizePanel } from "./resizable-geometry";

describe("resizePanel", () => {
  const viewport = { width: 1440, height: 900 };
  const start = { width: 576, height: 320 };

  it("grows to the right and down from the east and the south edges", () => {
    expect(resizePanel(start, "e", 100, 50, viewport)).toEqual({ width: 676, height: 320 });
    expect(resizePanel(start, "s", 100, 50, viewport)).toEqual({ width: 576, height: 370 });
    expect(resizePanel(start, "se", 100, 50, viewport)).toEqual({ width: 676, height: 370 });
  });

  it("grows to the left and up from the west and the north edges (a panel anchored to the bottom right)", () => {
    expect(resizePanel(start, "w", -100, 0, viewport)).toEqual({ width: 676, height: 320 });
    expect(resizePanel(start, "n", 0, -80, viewport)).toEqual({ width: 576, height: 400 });
    expect(resizePanel(start, "nw", 50, 40, viewport)).toEqual({ width: 526, height: 280 });
  });

  it("is never smaller than its minimum nor bigger than the screen", () => {
    expect(resizePanel(start, "se", -1000, -1000, viewport)).toEqual(MIN_PANEL);
    expect(resizePanel(start, "se", 5000, 5000, viewport)).toEqual({ width: 1424, height: 884 });
    expect(resizePanel(start, "se", 0, 0, { width: 200, height: 100 })).toEqual(MIN_PANEL);
  });
});
