import type { TypeWindowGeometry } from "@app/Types";

// Where a floating window is and how big, as the user moves and resizes it: in px, from the top left corner of its desk

/** The smallest window: its title bar and something of its content */
export const MIN_WINDOW = { width: 280, height: 120 } as const;

/** What of a window stays inside the desk, so its title bar can always be caught */
const KEEP = { x: 80, y: 40 } as const;

/** The edges and the corners a window is resized from */
export const EDGES = ["n", "s", "e", "w", "ne", "nw", "se", "sw"] as const;
export type Edge = (typeof EDGES)[number];

export type Desk = { width: number; height: number };

/** The window inside the desk: its title bar in it and, at least, its minimum size */
export function keepInside(window: TypeWindowGeometry, desk: Desk): TypeWindowGeometry {
  const width = Math.max(MIN_WINDOW.width, Math.round(window.width));
  const height = Math.max(MIN_WINDOW.height, Math.round(window.height));
  return {
    width,
    height,
    x: Math.round(Math.min(Math.max(window.x, KEEP.x - width), Math.max(0, desk.width - KEEP.x))),
    y: Math.round(Math.min(Math.max(window.y, 0), Math.max(0, desk.height - KEEP.y))),
  };
}

/** The window moved by (dx, dy) */
export function moveWindow(start: TypeWindowGeometry, dx: number, dy: number, desk: Desk): TypeWindowGeometry {
  return keepInside({ ...start, x: start.x + dx, y: start.y + dy }, desk);
}

/** The window resized from an edge or a corner by (dx, dy): the opposite edges stay where they were */
export function resizeWindow(start: TypeWindowGeometry, edge: Edge, dx: number, dy: number, desk: Desk): TypeWindowGeometry {
  let { x, y, width, height } = start;
  if (edge.includes("e")) width = Math.max(MIN_WINDOW.width, start.width + dx);
  if (edge.includes("s")) height = Math.max(MIN_WINDOW.height, start.height + dy);
  if (edge.includes("w")) {
    width = Math.max(MIN_WINDOW.width, start.width - dx);
    x = start.x + start.width - width;
  }
  if (edge.includes("n")) {
    // The title bar does not go above the desk
    height = Math.max(MIN_WINDOW.height, Math.min(start.height - dy, start.y + start.height));
    y = start.y + start.height - height;
  }
  return keepInside({ x, y, width, height }, desk);
}
