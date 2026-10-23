import { describe, expect, it } from "vitest";
import { isCancelled, RECENT_SIGN_IN_MS, signedInRecently, signInProviders } from "./sign-in";

describe("The sign-in of THUMDER", () => {
  it("offers Google and GitHub in the web, and Apple when it is configured", () => {
    expect(signInProviders({ platform: "web", nativeAuth: false, apple: false })).toEqual(["google", "github"]);
    expect(signInProviders({ platform: "web", nativeAuth: false, apple: true })).toEqual(["google", "github", "apple"]);
  });

  it("offers none in the desktop: Google does not sign in inside Electron", () => {
    expect(signInProviders({ platform: "desktop", nativeAuth: false, apple: true })).toEqual([]);
  });

  it("offers the native ones on Android only with the configuration of Firebase in the application", () => {
    expect(signInProviders({ platform: "android", nativeAuth: false, apple: false })).toEqual([]);
    expect(signInProviders({ platform: "android", nativeAuth: true, apple: false })).toEqual(["google", "github"]);
  });

  it("offers Google and GitHub on iOS only next to Sign in with Apple (guideline 4.8 of the App Store)", () => {
    expect(signInProviders({ platform: "ios", nativeAuth: true, apple: false })).toEqual([]);
    expect(signInProviders({ platform: "ios", nativeAuth: false, apple: true })).toEqual([]);
    expect(signInProviders({ platform: "ios", nativeAuth: true, apple: true })).toEqual(["google", "github", "apple"]);
  });

  it("deletes an account only a few minutes after signing in", () => {
    const now = Date.parse("2026-10-23T12:00:00Z");
    expect(signedInRecently(new Date(now - 60_000).toUTCString(), now)).toBe(true);
    expect(signedInRecently(new Date(now - RECENT_SIGN_IN_MS - 1000).toUTCString(), now)).toBe(false);
    expect(signedInRecently(undefined, now)).toBe(false);
    expect(signedInRecently("not a date", now)).toBe(false);
  });

  it("does not show an error when the window of sign-in is closed", () => {
    expect(isCancelled({ code: "auth/popup-closed-by-user" })).toBe(true);
    expect(isCancelled(new Error("The user canceled the sign-in flow."))).toBe(true);
    expect(isCancelled({ code: "auth/network-request-failed", message: "Network error" })).toBe(false);
    expect(isCancelled(undefined)).toBe(false);
  });
});
