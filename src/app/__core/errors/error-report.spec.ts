import { describe, expect, it } from "vitest";
import { ERROR_LIMITS, errorKey, errorReport } from "./error-report";

describe("the reports of the errors", () => {
  const context = { path: "/auth/editor?d=secreto#x", version: "1.7.1", userAgent: "Mozilla/5.0 Chrome/140", lang: "es" };

  it("keeps the technical data of an error, without the query of the route", () => {
    const report = errorReport(new TypeError("x is undefined"), context);
    expect(report).toMatchObject({ message: "x is undefined", name: "TypeError", path: "/auth/editor", version: "1.7.1", platform: "web", lang: "es" });
    expect(report.stack).toContain("x is undefined");
  });

  it("removes the folders of the computer from the stacks of Electron, and tells Electron", () => {
    const error = new Error("boom");
    error.stack = "Error: boom\n    at f (file:///home/ana/Apps/THUMDER/resources/app.asar/main.js:10:5)";
    const report = errorReport(error, { ...context, userAgent: "Mozilla/5.0 Electron/38" });
    expect(report.stack).toBe("Error: boom\n    at f (file:///…/main.js:10:5)");
    expect(report.platform).toBe("electron");
  });

  it("tells the applications of Android and iOS, whose WebView looks like a browser", () => {
    expect(errorReport(new Error("boom"), { ...context, native: "android" }).platform).toBe("android");
    expect(errorReport(new Error("boom"), { ...context, native: "ios" }).platform).toBe("ios");
    expect(errorReport(new Error("boom"), { ...context, native: null }).platform).toBe("web");
  });

  it("takes what is not an Error, and cuts every field to its limit", () => {
    expect(errorReport("texto", context)).toMatchObject({ message: "texto", name: "string", stack: "" });
    expect(errorReport({ code: 1 }, context).message).toBe('{"code":1}');
    const long = errorReport(new Error("x".repeat(2000)), context);
    expect(long.message.length).toBe(ERROR_LIMITS.message);
    expect(long.message.endsWith("…")).toBe(true);
    // The same error is one key: it is sent once
    expect(errorKey(long)).toBe(errorKey({ ...long }));
  });
});
