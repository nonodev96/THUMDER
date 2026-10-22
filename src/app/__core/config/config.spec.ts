import { DEFAULT_MULTIVIEW_CONFIGURATION } from "@app/CONSTANTS";
import { beforeEach, describe, expect, it } from "vitest";
import { CONFIG_KEY, changesMachine, defaultConfig, loadConfig, saveConfig, validateConfig } from "./config";

describe("validateConfig", () => {
  it("gives the defaults for anything that is not a configuration", () => {
    for (const value of [null, undefined, 3, "x", [], {}]) expect(validateConfig(value)).toEqual(defaultConfig());
  });

  it("keeps the sounds valid: on by default, and a volume between 0 and 100", () => {
    expect(defaultConfig().sound).toEqual({ enabled: true, volume: 60, stages: true });
    expect(validateConfig({ sound: { enabled: false, volume: 140, stages: "no" } }).sound).toEqual({ enabled: false, volume: 100, stages: true });
    expect(validateConfig({ sound: { volume: -3 } }).sound.volume).toBe(0);
    expect(validateConfig({ sound: "loud" }).sound).toEqual(defaultConfig().sound);
  });

  it("adjusts the values out of range to the limits of WinDLX", () => {
    const config = validateConfig({
      floatingPoint: { addition: { count: 12, delay: 0 }, multiplication: { count: "3", delay: 99 }, division: { count: -1, delay: "x" } },
      memorySize: 1003,
      delay: -5,
    });
    expect(config.floatingPoint).toEqual({ addition: { count: 8, delay: 1 }, multiplication: { count: 3, delay: 50 }, division: { count: 1, delay: 19 } });
    expect(config.memorySize).toBe(1000);
    expect(validateConfig({ memorySize: 10 }).memorySize).toBe(512);
    expect(validateConfig({ memorySize: 2 ** 30 }).memorySize).toBe(1048576);
    expect(config.delay).toBe(0);
  });

  it("keeps the architecture when it is one THUMDER simulates, and the parameters of SuperDLX valid", () => {
    expect(defaultConfig().architecture).toBe("dlx");
    expect(validateConfig({ architecture: "superdlx" }).architecture).toBe("superdlx");
    expect(validateConfig({ architecture: "mips" }).architecture).toBe("dlx");
    const config = validateConfig({ superdlx: { fetch: 99, rob: { fp: 1 }, prediction: "yes" } });
    expect(config.superdlx.fetch).toBe(16);
    expect(config.superdlx.rob).toEqual({ int: 20, fp: 2 });
    expect(config.superdlx.prediction).toBe(true);
  });

  it("changing the architecture or SuperDLX changes the machine", () => {
    const config = defaultConfig();
    expect(changesMachine(config, { ...config, architecture: "superdlx" })).toBe(true);
    expect(changesMachine(config, { ...config, superdlx: { ...config.superdlx, commit: 2 } })).toBe(true);
  });

  it("keeps the booleans only when they are booleans", () => {
    expect(validateConfig({ forwarding: false, autoSave: false })).toMatchObject({ forwarding: false, autoSave: false });
    expect(validateConfig({ forwarding: "false", autoSave: 0 })).toMatchObject({ forwarding: true, autoSave: true });
  });

  it("keeps each window of the multiview once, and puts the missing ones at the end", () => {
    const multiview = validateConfig({ multiview: { list_1: ["memory", "memory", "unknown", 4], list_2: ["code"], memory: false } }).multiview;
    expect(multiview.list_1).toEqual(["memory"]);
    expect(multiview.list_2[0]).toBe("code");
    expect([...multiview.list_1, ...multiview.list_2].sort()).toEqual([...DEFAULT_MULTIVIEW_CONFIGURATION.list_1, ...DEFAULT_MULTIVIEW_CONFIGURATION.list_2].sort());
    expect(multiview.memory).toBe(false);
    expect(multiview.code).toBe(DEFAULT_MULTIVIEW_CONFIGURATION.code);
  });

  it("adds the datapath to a multiview saved before it existed", () => {
    const saved = { list_1: ["code", "cycle_clock_diagram", "memory", "pipeline"], list_2: ["registers", "calculator", "statistics"], statistics: true };
    const multiview = validateConfig({ multiview: saved }).multiview;
    expect(multiview.list_2).toEqual(["registers", "calculator", "statistics", "datapath"]);
    expect(multiview.datapath).toBe(true);
    expect(multiview.statistics).toBe(true);
  });

  it("keeps the floating windows of the multiview that exist, with whole numbers in their limits and in their order", () => {
    const windows = validateConfig({
      windows: {
        memory: { x: 10.4, y: "20", width: 50, height: 400 },
        unknown: { x: 0, y: 0, width: 300, height: 300 },
        code: { x: "a", y: null, width: 99999, height: 300 },
        pipeline: "no",
      },
    }).windows;
    expect(Object.keys(windows)).toEqual(["memory", "code"]);
    expect(windows.memory).toEqual({ x: 10, y: 20, width: 120, height: 400 });
    expect(windows.code).toEqual({ x: 0, y: 0, width: 10000, height: 300 });
    expect(validateConfig({}).windows).toEqual({});
  });

  it("knows which changes load the program again", () => {
    const config = defaultConfig();
    expect(changesMachine(config, { ...config, delay: 10, autoSave: false })).toBe(false);
    expect(changesMachine(config, { ...config, forwarding: false })).toBe(true);
    expect(changesMachine(config, validateConfig({ ...config, floatingPoint: { ...config.floatingPoint, division: { count: 2, delay: 19 } } }))).toBe(true);
  });
});

describe("loadConfig", () => {
  beforeEach(() => localStorage.clear());

  it("joins the keys of the versions before 1, saves them under one key and removes them", () => {
    localStorage.setItem("enabled_forwarding_configuration", "false");
    localStorage.setItem("memory_size_configuration", "4096");
    localStorage.setItem("time_simulation_configuration", "0");
    localStorage.setItem("floating_point_stage_configuration", "not json");
    const config = loadConfig(localStorage);
    expect(config).toMatchObject({ version: 1, forwarding: false, memorySize: 4096, delay: 0 });
    expect(config.floatingPoint).toEqual(defaultConfig().floatingPoint);
    expect(JSON.parse(localStorage.getItem(CONFIG_KEY) ?? "null")).toEqual(config);
    expect(localStorage.getItem("memory_size_configuration")).toBeNull();
    expect(localStorage.getItem("floating_point_stage_configuration")).toBeNull();
  });

  it("reads the saved configuration, validated", () => {
    saveConfig(localStorage, { ...defaultConfig(), delay: 75 });
    localStorage.setItem(CONFIG_KEY, JSON.stringify({ ...JSON.parse(localStorage.getItem(CONFIG_KEY) ?? "{}"), memorySize: 7 }));
    expect(loadConfig(localStorage)).toMatchObject({ delay: 75, memorySize: 512 });
  });

  it("starts with the defaults", () => {
    expect(loadConfig(localStorage)).toEqual(defaultConfig());
  });
});
