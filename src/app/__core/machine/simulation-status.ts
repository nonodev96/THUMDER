import type { MachineState } from "@core/machine/machine.service";

/** What the simulator is doing (the texts are STATUS.<status>) */
export type SimulationStatus = "IDLE" | "QUIET" | "RUNNING" | "COMPLETE" | "INPUT" | "BREAKPOINT" | "ERRORS" | "LOADED" | "PAUSED";

/** What the simulator is doing, from the state of the machine (the footer and the debug window say it) */
export function simulationStatus(state: MachineState): SimulationStatus {
  // Nothing loaded: before the first load, or after the button that resets the machine
  if (state.loads() === 0 || (state.code().length === 0 && state.errors().length === 0 && !state.canSimulate())) return "IDLE";
  if (state.quiet()) return "QUIET";
  if (state.running()) return "RUNNING";
  if (state.complete()) return "COMPLETE";
  if (state.waitingForInput()) return "INPUT";
  if (state.breakpoint()) return "BREAKPOINT";
  if (!state.canSimulate()) return "ERRORS";
  return state.cycles() === 0 ? "LOADED" : "PAUSED";
}

/** The class of the badge of each status */
export const STATUS_BADGES: Record<SimulationStatus, string> = {
  IDLE: "badge-secondary",
  QUIET: "badge-info",
  RUNNING: "badge-success",
  COMPLETE: "badge-primary",
  INPUT: "badge-warning",
  BREAKPOINT: "badge-warning",
  ERRORS: "badge-danger",
  LOADED: "badge-secondary",
  PAUSED: "badge-secondary",
};
