import { Injectable, type OnDestroy } from "@angular/core";
import {
  type FromSimulator,
  type RunOptions,
  SimulationRunner,
  type StageBreakpoint,
  type StopReason,
  type ToSimulator,
  type Watchpoint,
} from "@core/engine/runner";
import type { LocalSimulationStep } from "@core/engine/simulator";
import { logger } from "@core/logger/logger";

type Pending = { resolve: (value: unknown) => void; reject: (error: Error) => void };

/**
 * The simulator of THUMDER (src/app/__core/engine), in a Web Worker: assembling, simulating and the execution loop happen
 * there, and the page only receives the cycles to draw them. Where there are no workers (the unit tests) the same runner
 * works in the page. The messages between both are in runner.ts (docs/simulador.md, «El protocolo del Worker»).
 */
@Injectable({
  providedIn: "root",
})
export class LocalSimulatorService implements OnDestroy {
  private readonly worker: Worker | null;
  private readonly inline: SimulationRunner | null;
  private nextId = 1;
  private readonly pending = new Map<number, Pending>();
  // The run going on: the steps are handled one after another, and the run ends when the last one is handled
  private onStep: ((step: LocalSimulationStep) => Promise<void>) | null = null;
  private stopped: ((reason: StopReason) => void) | null = null;
  private queue: Promise<void> = Promise.resolve();

  constructor() {
    this.worker = LocalSimulatorService.createWorker();
    if (this.worker) {
      this.worker.addEventListener("message", ({ data }: MessageEvent<FromSimulator>) => this.receive(data));
      this.inline = null;
    } else {
      // The answers arrive later, as they would from a worker
      this.inline = new SimulationRunner((message) => setTimeout(() => this.receive(message)));
    }
  }

  private static createWorker(): Worker | null {
    if (typeof Worker === "undefined") return null;
    try {
      return new Worker(new URL("../../engine/simulator.worker", import.meta.url), { type: "module" });
    } catch (error) {
      logger.error("The simulator runs in the page: no Web Worker", error);
      return null;
    }
  }

  /** Whether the simulator runs in a Web Worker (or, where there are none, in the page) */
  public get inWorker(): boolean {
    return this.worker !== null;
  }

  public request<T>(event: string, payload: unknown = {}): Promise<T> {
    const id = this.nextId++;
    const text = typeof payload === "string" ? payload : JSON.stringify(payload);
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve: (value) => resolve(value as T), reject });
      this.post({ kind: "request", id, event, payload: text });
    });
  }

  /**
   * Runs the program in the simulator: `onStep` gets each cycle, in order, and the promise ends with the reason it
   * stopped (the end, a breakpoint, an error, input needed or a pause)
   */
  public run(options: RunOptions, onStep: (step: LocalSimulationStep) => Promise<void>): Promise<StopReason> {
    return new Promise<StopReason>((resolve) => {
      this.onStep = onStep;
      this.stopped = resolve;
      this.queue = Promise.resolve();
      this.post({ kind: "run", ...options });
    });
  }

  public pause(): void {
    this.post({ kind: "pause" });
  }

  /** A new pace for the run going on */
  public setSpeed(delay: number): void {
    this.post({ kind: "speed", delay });
  }

  public setBreakpoints(lines: number[], stages: StageBreakpoint[] = [], watchpoints: Watchpoint[] = []): void {
    this.post({ kind: "breakpoints", lines, stages, watchpoints });
  }

  ngOnDestroy(): void {
    this.worker?.terminate();
  }

  private post(message: ToSimulator): void {
    if (this.worker) this.worker.postMessage(message);
    else this.inline?.handle(message);
  }

  private receive(message: FromSimulator): void {
    switch (message.kind) {
      case "response": {
        const pending = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error !== undefined) pending?.reject(new Error(message.error));
        else pending?.resolve(JSON.parse(message.result ?? "null"));
        break;
      }
      case "steps": {
        const onStep = this.onStep;
        for (const step of message.steps) this.queue = this.queue.then(() => onStep?.(step));
        break;
      }
      case "stopped": {
        const stopped = this.stopped;
        this.queue = this.queue.then(() => {
          if (this.stopped === stopped) {
            this.stopped = null;
            this.onStep = null;
          }
          stopped?.(message.reason);
        });
        break;
      }
    }
  }
}
