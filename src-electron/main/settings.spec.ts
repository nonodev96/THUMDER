import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseSettings, type Settings, SettingsStore } from "./settings";

const defaults: Settings = { theme: "system", lang: "en", maximized: true };

describe("The settings of the window", () => {
  let dir: string;
  let file: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "thumder-settings-"));
    file = path.join(dir, "desktop.json");
  });

  afterEach(() => {
    vi.useRealTimers();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("keeps what is valid of what was saved, and the defaults for the rest", () => {
    const bounds = { x: 10, y: 20, width: 800, height: 600 };
    expect(parseSettings({ theme: "dark", lang: "es", bounds, maximized: false }, defaults)).toEqual({
      theme: "dark",
      lang: "es",
      bounds,
      maximized: false,
    });
    expect(parseSettings({ theme: "pink", lang: "../x", bounds: { x: 1 }, maximized: "no" }, defaults)).toEqual(defaults);
    expect(parseSettings(undefined, defaults)).toEqual(defaults);
  });

  it("starts with the defaults without a file or with a broken one", () => {
    expect(new SettingsStore(file, defaults).value).toEqual(defaults);
    fs.writeFileSync(file, "{ not json");
    expect(new SettingsStore(file, defaults).value).toEqual(defaults);
  });

  it("writes the changes a moment later, all at once, and reads them the next time", () => {
    vi.useFakeTimers();
    const store = new SettingsStore(file, defaults, 500);
    store.update({ theme: "dark" });
    store.update({ maximized: false });
    expect(fs.existsSync(file)).toBe(false);
    vi.advanceTimersByTime(500);
    expect(JSON.parse(fs.readFileSync(file, "utf8"))).toEqual({ ...defaults, theme: "dark", maximized: false });
    expect(new SettingsStore(file, defaults).value).toEqual({ ...defaults, theme: "dark", maximized: false });
  });

  it("writes them at once when the window closes, creating its folder", () => {
    const nested = path.join(dir, "THUMDER", "desktop.json");
    const store = new SettingsStore(nested, defaults);
    store.update({ lang: "es" });
    store.flush();
    expect(JSON.parse(fs.readFileSync(nested, "utf8")).lang).toBe("es");
  });
});
