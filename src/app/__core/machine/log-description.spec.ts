import { describe, expect, it } from "vitest";
import { describeLog } from "./log-description";

describe("describeLog", () => {
  it("says what the events of the simulation mean", () => {
    expect(describeLog("RESET")).toEqual({ event: "RESET", key: "DEBUG_PANEL.LOG.RESET", params: {} });
    expect(describeLog("CLEAR").key).toBe("DEBUG_PANEL.LOG.CLEAR");
    expect(describeLog("SimulationInit").key).toBe("DEBUG_PANEL.LOG.INIT");
  });

  it("reads the cycle and the line of a step", () => {
    expect(describeLog("SimulationNextStep S: 3 L: 28")).toEqual({
      event: "SimulationNextStep",
      key: "DEBUG_PANEL.LOG.STEP",
      params: { cycle: 3, line: 28 },
    });
    expect(describeLog("SimulationNextStep S: 9 L: 0").key).toBe("DEBUG_PANEL.LOG.STEP_NO_LINE");
  });

  it("reads the configuration sent to the simulator", () => {
    const text = `UpdateConfigurationMachine: ${JSON.stringify({
      enabledForwarding: false,
      memorySize: 32768,
      addition: { count: 1, delay: 2 },
      multiplication: { count: 2, delay: 5 },
      division: { count: 1, delay: 19 },
    })}`;
    expect(describeLog(text)).toEqual({
      event: "UpdateConfigurationMachine",
      key: "DEBUG_PANEL.LOG.CONFIG_NO_FORWARDING",
      params: { memory: 32768, fadd: "1 × 2", fmul: "2 × 5", fdiv: "1 × 19" },
    });
  });

  it("counts the labels of the editor and keeps any other message as it is", () => {
    expect(describeLog('ListOfTags: ["main","loop"]').params).toEqual({ count: 2 });
    expect(describeLog("Something else")).toEqual({ event: "Something", key: "DEBUG_PANEL.LOG.OTHER", params: { text: "Something else" } });
  });
});
