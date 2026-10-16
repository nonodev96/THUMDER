import { DOCUMENT } from "@angular/common";
import { Injectable, inject } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { filter } from "rxjs/operators";

/**
 * The left sidebar of the layout, with the CSS classes of AdminLTE on the `body` (what its PushMenu plugin did with
 * jQuery). Up to this width the sidebar slides over the content: it starts closed and closes again after each navigation
 * and when the dark layer next to it is touched (`#sidebar-overlay`). Wider, it stays next to the content, whole or only
 * with its icons (`sidebar-mini`).
 */
export const SIDEBAR_OVERLAY_MAX_WIDTH = 992;

/** The classes of the body that hold the state of the sidebar */
export const SIDEBAR_STATE_CLASSES = ["sidebar-open", "sidebar-collapse", "sidebar-closed"];

@Injectable({
  providedIn: "root",
})
export class SidebarService {
  private document = inject(DOCUMENT);
  /** Wide screens: only the icons */
  private collapsedOnWide = false;
  /** Narrow screens: over the content */
  private openOnNarrow = false;
  private wasOverlay: boolean;

  constructor() {
    this.wasOverlay = this.isOverlay;
    inject(Router)
      .events.pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.openOnNarrow = false;
        this.apply();
      });
    // Crossing the width of the overlay closes the sidebar that covered the content
    this.document.defaultView?.addEventListener("resize", () => {
      if (this.isOverlay === this.wasOverlay) return;
      this.wasOverlay = this.isOverlay;
      this.openOnNarrow = false;
      this.apply();
    });
  }

  /** Whether the sidebar slides over the content (phones and tablets) */
  public get isOverlay(): boolean {
    return (this.document.defaultView?.innerWidth ?? Number.POSITIVE_INFINITY) <= SIDEBAR_OVERLAY_MAX_WIDTH;
  }

  /** Whether the sidebar shows its texts: open over the content, or whole next to it */
  public get isExpanded(): boolean {
    return this.isOverlay ? this.openOnNarrow : !this.collapsedOnWide;
  }

  /** Puts the classes of the current state on the body (a new layout, or after something removed them) */
  public init(): void {
    this.apply();
  }

  /** The button of the navbar */
  public toggle(): void {
    if (this.isOverlay) this.openOnNarrow = !this.openOnNarrow;
    else this.collapsedOnWide = !this.collapsedOnWide;
    this.apply();
  }

  /** Closes the sidebar where it covers the content */
  public close(): void {
    this.openOnNarrow = false;
    this.apply();
  }

  /** Only the icons on wide screens, closed on narrow ones (the landing pages start like this) */
  public collapse(): void {
    this.collapsedOnWide = true;
    this.openOnNarrow = false;
    this.apply();
  }

  /** The classes of AdminLTE: `sidebar-open` over the content; `sidebar-collapse` (and `sidebar-closed`) hidden or mini */
  private apply(): void {
    const body = this.document.body.classList;
    body.remove(...SIDEBAR_STATE_CLASSES);
    if (this.isOverlay) {
      if (this.openOnNarrow) body.add("sidebar-open");
      else body.add("sidebar-collapse", "sidebar-closed");
    } else if (this.collapsedOnWide) {
      body.add("sidebar-collapse");
    }
  }
}
