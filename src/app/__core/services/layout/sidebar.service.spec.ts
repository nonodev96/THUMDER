import { TestBed } from "@angular/core/testing";
import { NavigationEnd, Router } from "@angular/router";
import { SIDEBAR_OVERLAY_MAX_WIDTH, SidebarService } from "@core/services/layout/sidebar.service";
import { Subject } from "rxjs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("SidebarService", () => {
  const originalWidth = window.innerWidth;
  let events: Subject<unknown>;
  let sidebar: SidebarService;

  const setWidth = (width: number) => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
    window.dispatchEvent(new Event("resize"));
  };
  const classes = () => ["sidebar-open", "sidebar-collapse", "sidebar-closed"].filter((name) => document.body.classList.contains(name));
  const navigate = () => events.next(new NavigationEnd(1, "/auth/code", "/auth/code"));

  beforeEach(() => {
    events = new Subject<unknown>();
    setWidth(1440);
    document.body.className = "";
    TestBed.configureTestingModule({ providers: [{ provide: Router, useValue: { events } }] });
    sidebar = TestBed.inject(SidebarService);
  });

  afterEach(() => {
    setWidth(originalWidth);
    document.body.className = "";
  });

  it("on wide screens, the button folds the sidebar to its icons and unfolds it", () => {
    sidebar.init();
    expect(classes()).toEqual([]);
    expect(sidebar.isExpanded).toBe(true);
    sidebar.toggle();
    expect(classes()).toEqual(["sidebar-collapse"]);
    expect(sidebar.isExpanded).toBe(false);
    navigate();
    expect(classes()).toEqual(["sidebar-collapse"]);
    sidebar.toggle();
    expect(classes()).toEqual([]);
  });

  it("on narrow screens it starts closed, opens over the content and closes after a navigation", () => {
    setWidth(SIDEBAR_OVERLAY_MAX_WIDTH - 200);
    sidebar.init();
    expect(classes()).toEqual(["sidebar-collapse", "sidebar-closed"]);
    sidebar.toggle();
    expect(classes()).toEqual(["sidebar-open"]);
    expect(sidebar.isExpanded).toBe(true);
    navigate();
    expect(classes()).toEqual(["sidebar-collapse", "sidebar-closed"]);
    sidebar.toggle();
    sidebar.close();
    expect(classes()).toEqual(["sidebar-collapse", "sidebar-closed"]);
  });

  it("closes the sidebar that covered the content when the window gets wide, and keeps the choice of wide screens", () => {
    sidebar.toggle();
    setWidth(SIDEBAR_OVERLAY_MAX_WIDTH - 200);
    sidebar.toggle();
    expect(classes()).toEqual(["sidebar-open"]);
    setWidth(1440);
    expect(classes()).toEqual(["sidebar-collapse"]);
  });

  it("the landing pages start folded", () => {
    sidebar.collapse();
    expect(classes()).toEqual(["sidebar-collapse"]);
  });
});
