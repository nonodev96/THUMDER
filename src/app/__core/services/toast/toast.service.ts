import { Injectable, signal } from "@angular/core";

// The notifications of THUMDER (UI-10): a few lines in the bottom right corner that go by themselves. They are drawn by
// ToastsComponent (in AppComponent), and announced to the screen readers: the errors at once, the rest when they can.

export type ToastKind = "info" | "success" | "warning" | "error";

export type ToastOptions = {
  /** Milliseconds it is shown (0: until it is closed) */
  timeOut?: number;
};

export type Toast = { id: number; kind: ToastKind; title: string; message: string; timeOut: number };

/** The ones shown at the same time: an older one goes when there are more */
const MAX_TOASTS = 5;

@Injectable({ providedIn: "root" })
export class ToastService {
  private readonly list = signal<Toast[]>([]);
  public readonly toasts = this.list.asReadonly();

  private nextId = 1;
  /** The timers of the toasts that are going, with the time each one has left (the pointer over one pauses it) */
  private readonly timers = new Map<number, { timer?: ReturnType<typeof setTimeout>; left: number; since: number }>();

  public info(message: string, title = "", options: ToastOptions = {}): void {
    this.show("info", message, title, options);
  }

  public success(message: string, title = "", options: ToastOptions = {}): void {
    this.show("success", message, title, options);
  }

  public warning(message: string, title = "", options: ToastOptions = {}): void {
    this.show("warning", message, title, options);
  }

  public error(message: string, title = "", options: ToastOptions = {}): void {
    this.show("error", message, title, options);
  }

  public show(kind: ToastKind, message: string, title = "", options: ToastOptions = {}): void {
    const timeOut = options.timeOut ?? 5000;
    // The same toast again (a button pressed twice): the one shown starts its time again
    const same = this.list().find((toast) => toast.kind === kind && toast.title === title && toast.message === message);
    if (same) {
      this.start(same.id, timeOut);
      return;
    }
    const toast: Toast = { id: this.nextId++, kind, title, message, timeOut };
    const kept = this.list().slice(-(MAX_TOASTS - 1));
    for (const old of this.list()) if (!kept.includes(old)) this.stop(old.id);
    this.list.set([...kept, toast]);
    this.start(toast.id, timeOut);
  }

  public close(id: number): void {
    this.stop(id);
    this.list.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  public clear(): void {
    for (const toast of this.list()) this.stop(toast.id);
    this.list.set([]);
  }

  /** The pointer or the focus on a toast: it waits (WCAG 2.2.1) */
  public pause(id: number): void {
    const timer = this.timers.get(id);
    if (!timer?.timer) return;
    clearTimeout(timer.timer);
    timer.timer = undefined;
    timer.left = Math.max(0, timer.left - (Date.now() - timer.since));
  }

  public resume(id: number): void {
    const timer = this.timers.get(id);
    if (!timer || timer.timer) return;
    // At least a second and a half more, so that it does not disappear the moment the pointer leaves
    this.start(id, Math.max(timer.left, 1500));
  }

  private start(id: number, time: number): void {
    this.stop(id);
    if (time <= 0) return;
    this.timers.set(id, { timer: setTimeout(() => this.close(id), time), left: time, since: Date.now() });
  }

  private stop(id: number): void {
    clearTimeout(this.timers.get(id)?.timer);
    this.timers.delete(id);
  }
}
