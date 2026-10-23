import { describe, expect, it } from "vitest";
import { initialBounds, nextZoomLevel, overlayHeight } from "./geometry";

const screen = { x: 0, y: 0, width: 1920, height: 1040 };
const sameScreen = () => screen;

describe("The sizes of the window", () => {
  it("opens where it was if that place is on a screen", () => {
    const saved = { x: 100, y: 50, width: 1200, height: 800 };
    expect(initialBounds(saved, sameScreen, screen)).toEqual(saved);
  });

  it("opens centred with 85 % of the screen the first time, off the screens or too small", () => {
    const centred = { x: 144, y: 78, width: 1632, height: 884 };
    expect(initialBounds(undefined, sameScreen, screen)).toEqual(centred);
    // A screen that is no longer there
    expect(initialBounds({ x: 3000, y: 50, width: 1200, height: 800 }, sameScreen, screen)).toEqual(centred);
    expect(initialBounds({ x: 100, y: 50, width: 300, height: 800 }, sameScreen, screen)).toEqual(centred);
  });

  it("makes the buttons of the window as high as the navbar, with the zoom of the page", () => {
    expect(overlayHeight(52, 1)).toBe(52);
    expect(overlayHeight(52, 1.2)).toBe(62);
    expect(overlayHeight(52, 0.3)).toBe(24);
  });

  it("zooms by steps between its limits, and back to the real size", () => {
    expect(nextZoomLevel(0, 1)).toBe(0.5);
    expect(nextZoomLevel(0, -1)).toBe(-0.5);
    expect(nextZoomLevel(5, 1)).toBe(5);
    expect(nextZoomLevel(-4, -1)).toBe(-4);
    expect(nextZoomLevel(3, 0)).toBe(0);
  });
});
