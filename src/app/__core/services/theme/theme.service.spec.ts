import { TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cssColour, cssColourNumber } from "./palette";
import { ThemeService } from "./theme.service";

describe("ThemeService", () => {
  beforeEach(() => localStorage.removeItem("theme"));

  afterEach(() => {
    TestBed.resetTestingModule();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("style");
    document.body.classList.remove("dark-mode");
  });

  it("puts the theme on the page as soon as it is chosen: the variables, AdminLTE and the browser", () => {
    const theme = TestBed.inject(ThemeService);
    theme.set("dark");
    expect(document.documentElement.dataset["theme"]).toBe("dark");
    expect(document.body.classList).toContain("dark-mode");
    expect(document.documentElement.style.colorScheme).toBe("dark");
    theme.set("light");
    expect(document.documentElement.dataset["theme"]).toBe("light");
    expect(document.body.classList).not.toContain("dark-mode");
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("reads the colours of the canvases from the variables of the theme shown", () => {
    const theme = TestBed.inject(ThemeService);
    document.documentElement.style.setProperty("--thumder-canvas-bg-light", "#F8FAFC");
    document.documentElement.style.setProperty("--thumder-canvas-bg-dark", "#0f172a");
    theme.set("light");
    expect(theme.colour("canvas-bg", "#ffffff", "#000000")).toBe(0xf8fafc);
    theme.set("dark");
    expect(theme.colour("canvas-bg", "#ffffff", "#000000")).toBe(0x0f172a);
  });
});

describe("palette", () => {
  afterEach(() => document.documentElement.removeAttribute("style"));

  it("gives the value of a variable of theme.scss, or the fallback when there is none or it is not a colour", () => {
    document.documentElement.style.setProperty("--thumder-stage-if", " #FACC15 ");
    expect(cssColour("stage-if")).toBe("#facc15");
    expect(cssColourNumber("stage-if")).toBe(0xfacc15);
    expect(cssColour("missing", "#123456")).toBe("#123456");
    document.documentElement.style.setProperty("--thumder-stage-id", "var(--thumder-stage-if)");
    expect(cssColour("stage-id", "#654321")).toBe("#654321");
  });
});
