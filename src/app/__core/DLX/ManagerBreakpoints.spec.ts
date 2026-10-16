import { ManagerBreakpoints } from "@core/DLX/ManagerBreakpoints";
import { describe, expect, it } from "vitest";

describe("ManagerBreakpoints", () => {
  it("toggles a breakpoint on and off", () => {
    const manager = new ManagerBreakpoints();
    manager.toggleBreakpoint(12);
    expect(manager.isBreakpoint(12)).toBe(true);
    expect(manager.getBreakpoint(12)).toBe(true);
    manager.toggleBreakpoint(12);
    expect(manager.isBreakpoint(12)).toBe(false);
    expect(manager.getBreakpoint(12)).toBeNull();
  });

  it("takes the breakpoints of the editor, whose lines are text and whose removed ones are false", () => {
    const manager = new ManagerBreakpoints();
    manager.updateManager({ "3": true, "8": false, "21": true } as unknown as Record<number, boolean>);
    expect(manager.isBreakpoint(3)).toBe(true);
    expect(manager.isBreakpoint(8)).toBe(false);
    // The simulator stops only at the active ones
    expect(manager.getAllLinesWithBreakpoints()).toEqual([3, 21]);
  });

  it("ignores missing breakpoints and starts again on reset", () => {
    const manager = new ManagerBreakpoints();
    manager.toggleBreakpoint(5);
    manager.updateManager(null as unknown as Record<number, boolean>);
    expect(manager.getAllLinesWithBreakpoints()).toEqual([5]);
    manager.reset();
    expect(manager.getAllLinesWithBreakpoints()).toEqual([]);
  });
});
