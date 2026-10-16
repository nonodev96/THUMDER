import { describe, expect, it } from "vitest";
import { keepInside, MIN_WINDOW, moveWindow, resizeWindow } from "./window-geometry";

describe("the geometry of the floating windows", () => {
  const desk = { width: 1200, height: 800 };
  const start = { x: 100, y: 100, width: 400, height: 300 };

  it("moves a window, keeping its title bar on the desk", () => {
    expect(moveWindow(start, 50, -20, desk)).toEqual({ x: 150, y: 80, width: 400, height: 300 });
    // Not above the desk, and a part of it always inside on the left, the right and the bottom
    expect(moveWindow(start, 0, -500, desk).y).toBe(0);
    expect(moveWindow(start, -2000, 0, desk).x).toBe(80 - 400);
    expect(moveWindow(start, 5000, 0, desk).x).toBe(1200 - 80);
    expect(moveWindow(start, 0, 5000, desk).y).toBe(800 - 40);
  });

  it("resizes from each edge and corner, and the opposite edges stay", () => {
    expect(resizeWindow(start, "se", 100, 50, desk)).toEqual({ x: 100, y: 100, width: 500, height: 350 });
    expect(resizeWindow(start, "w", -50, 0, desk)).toEqual({ x: 50, y: 100, width: 450, height: 300 });
    expect(resizeWindow(start, "n", 0, 40, desk)).toEqual({ x: 100, y: 140, width: 400, height: 260 });
    expect(resizeWindow(start, "ne", 30, -30, desk)).toEqual({ x: 100, y: 70, width: 430, height: 330 });
  });

  it("does not go under the minimum size, nor above the desk from the top edge", () => {
    const small = resizeWindow(start, "nw", 1000, 1000, desk);
    expect(small).toEqual({ x: 100 + 400 - MIN_WINDOW.width, y: 100 + 300 - MIN_WINDOW.height, ...MIN_WINDOW });
    expect(resizeWindow(start, "n", 0, -500, desk)).toEqual({ x: 100, y: 0, width: 400, height: 400 });
  });

  it("puts a saved window inside a smaller desk, with whole pixels", () => {
    expect(keepInside({ x: 3000.4, y: 2000, width: 10.2, height: 50 }, { width: 800, height: 600 })).toEqual({
      x: 720,
      y: 560,
      width: MIN_WINDOW.width,
      height: MIN_WINDOW.height,
    });
  });
});
