import { Injectable, signal } from "@angular/core";

// The notifications of THUMDER (UI-10): a few lines in a corner of the screen (over the bar at the bottom on a phone)
// that go by themselves. ToastsComponent (in AppComponent) draws them, and the screen readers hear them: the errors and
// the warnings at once, the rest when they can.

export type ToastKind = "info" | "success" | "warning" | "error";

export type ToastOptions = {
  /** Milliseconds it is shown (0: until it is closed); by default, the time of its kind */
  duration?: number;
};

export type Toast = {
  id: number;
  kind: ToastKind;
  title: string;
  message: string;
  /** Milliseconds it is shown (0: until it is closed) */
  duration: number;
  /** Times it was shown: the same notice again counts instead of piling up */
  count: number;
  /** Going away (its animation; then it is removed) */
  leaving: boolean;
};

/**
 * The time of each kind: long enough to read about 20 words in 5 s, longer for the warnings and the errors. Every notice
 * has a button to close it and waits while the pointer or the focus is on it
 */
export const TOAST_DURATION: Record<ToastKind, number> = { info: 5000, success: 3500, warning: 8000, error: 12000 };

/** The ones shown at the same time: an older one goes when there are more */
const MAX_TOASTS = 4;

/** How long a notice takes to go away (ToastsComponent: its animation) */
export const TOAST_LEAVE_MS = 180;

@Injectable({ providedIn: "root" })
export class ToastService {
  private readonly list = signal<Toast[]>([]);
  public readonly toasts = this.list.asReadonly();

  private nextId = 1;
  /** The timers of the notices that are shown, with the time each one has left (the pointer over one pauses it) */
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
    const duration = options.duration ?? TOAST_DURATION[kind];
    // The same notice again (a button pressed twice): the one shown counts it and starts its time again
    const same = this.list().find((toast) => !toast.leaving && toast.kind === kind && toast.title === title && toast.message === message);
    if (same) {
      this.list.update((toasts) => toasts.map((toast) => (toast.id === same.id ? { ...toast, count: toast.count + 1 } : toast)));
      this.start(same.id, duration);
      return;
    }
    const toast: Toast = { id: this.nextId++, kind, title, message, duration, count: 1, leaving: false };
    const shown = this.list().filter((other) => !other.leaving);
    for (const old of shown.slice(0, Math.max(0, shown.length - (MAX_TOASTS - 1)))) this.close(old.id);
    this.list.update((toasts) => [...toasts, toast]);
    this.start(toast.id, duration);
  }

  /** It goes away: first its animation, then it is removed */
  public close(id: number): void {
    this.stop(id);
    const toast = this.list().find((other) => other.id === id);
    if (!toast || toast.leaving) return;
    this.list.update((toasts) => toasts.map((other) => (other.id === id ? { ...other, leaving: true } : other)));
    setTimeout(() => this.list.update((toasts) => toasts.filter((other) => other.id !== id)), TOAST_LEAVE_MS);
  }

  public clear(): void {
    for (const toast of this.list()) this.close(toast.id);
  }

  /** The pointer or the focus on a notice: it waits (WCAG 2.2.1) */
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
