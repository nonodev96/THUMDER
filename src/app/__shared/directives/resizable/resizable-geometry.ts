import type { Edge } from "../window/window-geometry";

// The size of a panel fixed over the views as the user resizes it from an edge or a corner, in px

export type PanelSize = { width: number; height: number };

/** The smallest panel: its title bar and a few lines */
export const MIN_PANEL = { width: 280, height: 140 } as const;

/** What a panel leaves free around it, at most as big as the screen */
const MARGIN = 16;

/**
 * The panel resized from an edge or a corner by (dx, dy): from the east or the south edges it grows to the right or
 * down, and from the west or the north ones to the left or up (the opposite edges stay where the panel is anchored)
 */
export function resizePanel(start: PanelSize, edge: Edge, dx: number, dy: number, viewport: PanelSize): PanelSize {
  let { width, height } = start;
  if (edge.includes("e")) width = start.width + dx;
  if (edge.includes("w")) width = start.width - dx;
  if (edge.includes("s")) height = start.height + dy;
  if (edge.includes("n")) height = start.height - dy;
  const limit = (value: number, min: number, max: number) => Math.round(Math.min(Math.max(value, min), Math.max(min, max)));
  return {
    width: limit(width, MIN_PANEL.width, viewport.width - MARGIN),
    height: limit(height, MIN_PANEL.height, viewport.height - MARGIN),
  };
}
