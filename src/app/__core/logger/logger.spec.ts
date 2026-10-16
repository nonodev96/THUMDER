import { defaultLogLevel, logger } from "@core/logger/logger";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("logger", () => {
  const level = logger.level;

  afterEach(() => {
    logger.level = level;
    localStorage.removeItem("log_level");
    vi.restoreAllMocks();
  });

  it("writes only the messages of its level and above", () => {
    const debug = vi.spyOn(console, "debug").mockImplementation(() => undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    logger.level = "warn";
    logger.debug("hidden");
    logger.warn("shown");
    logger.error("shown too");
    expect(debug).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith("shown");
    expect(error).toHaveBeenCalledWith("shown too");
    logger.level = "off";
    logger.error("nothing");
    expect(error).toHaveBeenCalledTimes(1);
  });

  it("is detailed in development and quiet in production, unless log_level says otherwise", () => {
    expect(defaultLogLevel(false)).toBe("debug");
    expect(defaultLogLevel(true)).toBe("warn");
    localStorage.setItem("log_level", "debug");
    expect(defaultLogLevel(true)).toBe("debug");
    localStorage.setItem("log_level", "nonsense");
    expect(defaultLogLevel(true)).toBe("warn");
  });
});
