// What each message of the log of the simulation means, in words (the debug window): its event and a text of the
// translations (DEBUG_PANEL.LOG.*) with its values. Pure TypeScript.

export type LogDescription = {
  /** The event, as the simulator calls it */
  event: string;
  /** Its text in the translations */
  key: string;
  params: Record<string, string | number>;
};

type Configuration = {
  enabledForwarding?: boolean;
  memorySize?: number;
  addition?: { count: number; delay: number };
  multiplication?: { count: number; delay: number };
  division?: { count: number; delay: number };
};

/** The meaning of a message of the log (MachineService.writeToLog) */
export function describeLog(text: string): LogDescription {
  if (text === "RESET") return { event: "RESET", key: "DEBUG_PANEL.LOG.RESET", params: {} };
  if (text === "CLEAR") return { event: "CLEAR", key: "DEBUG_PANEL.LOG.CLEAR", params: {} };
  if (text === "SimulationInit") return { event: "SimulationInit", key: "DEBUG_PANEL.LOG.INIT", params: {} };
  const step = /^SimulationNextStep S: (\d+) L: (-?\d+)$/.exec(text);
  if (step) {
    const [cycle, line] = [Number(step[1]), Number(step[2])];
    return {
      event: "SimulationNextStep",
      key: line > 0 ? "DEBUG_PANEL.LOG.STEP" : "DEBUG_PANEL.LOG.STEP_NO_LINE",
      params: { cycle, line },
    };
  }
  const configuration = /^UpdateConfigurationMachine: (.*)$/s.exec(text);
  if (configuration) {
    try {
      const value = JSON.parse(configuration[1]) as Configuration;
      const unit = (unit?: { count: number; delay: number }) => (unit ? `${unit.count} × ${unit.delay}` : "?");
      return {
        event: "UpdateConfigurationMachine",
        key: value.enabledForwarding ? "DEBUG_PANEL.LOG.CONFIG_FORWARDING" : "DEBUG_PANEL.LOG.CONFIG_NO_FORWARDING",
        params: {
          memory: value.memorySize ?? "?",
          fadd: unit(value.addition),
          fmul: unit(value.multiplication),
          fdiv: unit(value.division),
        },
      };
    } catch {
      return { event: "UpdateConfigurationMachine", key: "DEBUG_PANEL.LOG.CONFIG", params: {} };
    }
  }
  const tags = /^ListOfTags: (.*)$/s.exec(text);
  if (tags) {
    let count = 0;
    try {
      const value = JSON.parse(tags[1]);
      count = Array.isArray(value) ? value.length : Object.keys(value ?? {}).length;
    } catch {
      // Not JSON: the count stays at 0
    }
    return { event: "ListOfTags", key: "DEBUG_PANEL.LOG.TAGS", params: { count } };
  }
  return { event: text.split(/[\s:]/)[0] || text, key: "DEBUG_PANEL.LOG.OTHER", params: { text } };
}
