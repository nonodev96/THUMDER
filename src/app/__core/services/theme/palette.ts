import type { DiagramLabel } from "@core/machine/cycle-diagram.model";

// The colours of theme.scss for what is not drawn with CSS: the canvases (PixiJS) and the exports. They are read from
// the variables of :root, so the palette is in one place.

/** The variable of theme.scss of each label of the cycle diagram: the stages and the stalls */
export const LABEL_COLOURS: Record<DiagramLabel, string> = {
  IF: "stage-if",
  ID: "stage-id",
  intEX: "stage-ex",
  MEM: "stage-mem",
  WB: "stage-wb",
  faddEX: "stage-fadd",
  fmultEX: "stage-fmult",
  fdivEX: "stage-fdiv",
  Aborted: "stage-aborted",
  "R-Stall": "stall-r",
  "T-Stall": "stall-t",
  "W-Stall": "stall-w",
  Stall: "stall",
  "S-Stall": "stall-s",
};

/** A colour of theme.scss (the variable `--thumder-<name>`) as "#rrggbb"; `fallback` where there are no styles (tests) */
export function cssColour(name: string, fallback = "#cccccc"): string {
  const root = typeof document === "undefined" ? null : document.documentElement;
  const value = root && typeof getComputedStyle === "function" ? getComputedStyle(root).getPropertyValue(`--thumder-${name}`).trim() : "";
  return /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : fallback;
}

/** The same colour as a number, for PixiJS */
export function cssColourNumber(name: string, fallback = "#cccccc"): number {
  return Number.parseInt(cssColour(name, fallback).slice(1), 16);
}
