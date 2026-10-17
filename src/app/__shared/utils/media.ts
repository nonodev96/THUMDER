import { DestroyRef, inject, type Signal, signal } from "@angular/core";

/** Phones and small tablets upright: the tables put first the columns that explain, and the bits last */
export const NARROW = "(max-width: 767.98px)";

/**
 * Whether a media query matches, as a signal that follows it (the window turned, resized...). In an injection context:
 * it stops listening when the component goes
 */
export function mediaSignal(query: string): Signal<boolean> {
  const media = typeof window.matchMedia === "function" ? window.matchMedia(query) : null;
  const matches = signal(media?.matches ?? false);
  if (media) {
    const onChange = (event: MediaQueryListEvent) => matches.set(event.matches);
    media.addEventListener("change", onChange);
    inject(DestroyRef).onDestroy(() => media.removeEventListener("change", onChange));
  }
  return matches.asReadonly();
}
