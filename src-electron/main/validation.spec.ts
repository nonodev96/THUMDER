import { describe, expect, it } from "vitest";
import { isLanguageCode, isRectangle, isTitleBarHeight, parsePreferences } from "./validation";

describe("What comes from the page", () => {
  it("keeps only the valid preferences", () => {
    expect(parsePreferences({ theme: "dark", lang: "es", titleBar: 52 })).toEqual({ theme: "dark", lang: "es", titleBar: 52 });
    expect(parsePreferences({ theme: "blue", lang: "../../etc/passwd", titleBar: 5000 })).toEqual({});
    expect(parsePreferences({ titleBar: Number.NaN, extra: true })).toEqual({});
    expect(parsePreferences(null)).toEqual({});
    expect(parsePreferences("dark")).toEqual({});
  });

  it("accepts codes of languages, never paths", () => {
    expect(["es", "en", "pt-BR", "ast"].every(isLanguageCode)).toBe(true);
    expect(["", "ES", "../es", "es/../../x", "es.json", 1, null].some(isLanguageCode)).toBe(false);
  });

  it("accepts a navbar between 16 and 200 pixels high", () => {
    expect([16, 52.5, 200].every(isTitleBarHeight)).toBe(true);
    expect([15, 201, Number.POSITIVE_INFINITY, "52"].some(isTitleBarHeight)).toBe(false);
  });

  it("recognises a rectangle", () => {
    expect(isRectangle({ x: 0, y: -10, width: 800, height: 600 })).toBe(true);
    expect(isRectangle({ x: 0, y: 0, width: "800", height: 600 })).toBe(false);
    expect(isRectangle({ x: 0, y: 0, width: 800 })).toBe(false);
    expect(isRectangle(undefined)).toBe(false);
  });
});
