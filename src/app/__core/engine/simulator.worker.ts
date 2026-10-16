/// <reference lib="webworker" />
// The Web Worker of the simulator: assembling, simulating and running happen here, outside the page
import { SimulationRunner, type ToSimulator } from "@core/engine/runner";

const runner = new SimulationRunner((message) => postMessage(message));

addEventListener("message", ({ data }: MessageEvent<ToSimulator>) => runner.handle(data));
