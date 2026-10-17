import { ToastService } from "@core/services/toast/toast.service";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("ToastService", () => {
  let service: ToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = new ToastService();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows a toast for its time, and closes it", () => {
    service.success("Guardado", "Fichero", { timeOut: 3000 });
    expect(service.toasts()).toMatchObject([{ kind: "success", title: "Fichero", message: "Guardado", timeOut: 3000 }]);
    vi.advanceTimersByTime(2999);
    expect(service.toasts()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(service.toasts()).toHaveLength(0);
  });

  it("waits while the pointer is over it, and goes on after", () => {
    service.info("Hola", "", { timeOut: 5000 });
    const id = service.toasts()[0].id;
    vi.advanceTimersByTime(4000);
    service.pause(id);
    vi.advanceTimersByTime(60_000);
    expect(service.toasts()).toHaveLength(1);
    service.resume(id);
    // At least a second and a half more
    vi.advanceTimersByTime(1499);
    expect(service.toasts()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(service.toasts()).toHaveLength(0);
  });

  it("does not repeat the same toast, and keeps the last five", () => {
    service.warning("Lo mismo");
    service.warning("Lo mismo");
    expect(service.toasts()).toHaveLength(1);
    for (let i = 0; i < 7; i++) service.error(`Error ${i}`);
    expect(service.toasts().map((toast) => toast.message)).toEqual(["Error 2", "Error 3", "Error 4", "Error 5", "Error 6"]);
  });

  it("a time of 0 waits until it is closed", () => {
    service.error("Grave", "", { timeOut: 0 });
    vi.advanceTimersByTime(600_000);
    expect(service.toasts()).toHaveLength(1);
    service.close(service.toasts()[0].id);
    expect(service.toasts()).toHaveLength(0);
  });
});
