import { describe, expect, it } from "vitest";
import { appRoute, type BackState, backAction, isExternalLink, nativePlatform } from "./mobile";

const nothing: BackState = { modal: false, dropdown: false, maximizedCard: false, sidebar: false, canGoBack: false };

describe("The applications of Android and iOS", () => {
  it("know where they run", () => {
    expect(nativePlatform("android")).toBe("android");
    expect(nativePlatform("ios")).toBe("ios");
    expect(nativePlatform("web")).toBeNull();
    // In the tests THUMDER runs in the browser
    expect(nativePlatform()).toBeNull();
  });

  it("close what is on top with the back button, then go back, and leave at the start", () => {
    const all: BackState = { modal: true, dropdown: true, maximizedCard: true, sidebar: true, canGoBack: true };
    expect(backAction(all)).toBe("close-modal");
    expect(backAction({ ...all, modal: false })).toBe("close-dropdown");
    expect(backAction({ ...all, modal: false, dropdown: false })).toBe("restore-card");
    expect(backAction({ ...nothing, sidebar: true, canGoBack: true })).toBe("close-sidebar");
    expect(backAction({ ...nothing, canGoBack: true })).toBe("go-back");
    expect(backAction(nothing)).toBe("leave");
  });

  it("open the links to other sites outside THUMDER, and keep its own", () => {
    const page = "https://localhost";
    expect(isExternalLink("https://github.com/nonodev96/THUMDER", page)).toBe(true);
    expect(isExternalLink("http://example.org", page)).toBe(true);
    expect(isExternalLink("/auth/registers", page)).toBe(false);
    expect(isExternalLink("https://localhost/auth/memory", page)).toBe(false);
    expect(isExternalLink("mailto:a@b.c", page)).toBe(false);
    expect(isExternalLink("javascript:alert(1)", page)).toBe(false);
  });

  it("open a shared exercise from its link, and nothing else", () => {
    expect(appRoute("https://thumder.netlify.app/auth/shared?e=abc#x")).toBe("/auth/shared?e=abc#x");
    expect(appRoute("https://thumder.netlify.app/auth/registers")).toBeNull();
    expect(appRoute("https://evil.example/auth/shared?e=abc")).toBeNull();
    expect(appRoute("not a link")).toBeNull();
  });
});
