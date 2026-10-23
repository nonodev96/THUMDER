// The sizes of the window: where it opens, how high the buttons of the window are and the zoom of the page
import type { Rectangle } from "electron";

export const MIN_WINDOW_SIZE = 400;

/** The height of the navbar without its bottom border on a desktop, in pixels of the page, until it measures itself */
export const DEFAULT_TITLE_BAR_HEIGHT = 52;

/** The zoom levels of the page (Ctrl + and Ctrl -): each one is 20 % */
export const ZOOM_LEVELS = { min: -4, max: 5, step: 0.5 } as const;

/**
 * Where the window opens: where it was, if that place is still on a screen (`workAreaOf` gives the work area of the
 * screen of a rectangle); if not, centred on the primary screen with 85 % of its size
 */
export function initialBounds(saved: Rectangle | undefined, workAreaOf: (bounds: Rectangle) => Rectangle, primary: Rectangle): Rectangle {
  if (saved && saved.width >= MIN_WINDOW_SIZE && saved.height >= MIN_WINDOW_SIZE) {
    const area = workAreaOf(saved);
    const visible =
      saved.x < area.x + area.width - 100 &&
      saved.x + saved.width > area.x + 100 &&
      saved.y >= area.y - 10 &&
      saved.y < area.y + area.height - 100;
    if (visible) return saved;
  }
  const width = Math.round(primary.width * 0.85);
  const height = Math.round(primary.height * 0.85);
  return {
    x: primary.x + Math.round((primary.width - width) / 2),
    y: primary.y + Math.round((primary.height - height) / 2),
    width,
    height,
  };
}

/** The height of the buttons of the window, in pixels of the window: the one of the navbar, with the zoom of the page */
export function overlayHeight(navbarHeight: number, zoomFactor: number): number {
  return Math.max(24, Math.round(navbarHeight * zoomFactor));
}

/** The next zoom level: one step more (+1) or less (-1), or the real size (0) */
export function nextZoomLevel(current: number, direction: -1 | 0 | 1): number {
  if (direction === 0) return 0;
  return Math.min(ZOOM_LEVELS.max, Math.max(ZOOM_LEVELS.min, current + direction * ZOOM_LEVELS.step));
}
