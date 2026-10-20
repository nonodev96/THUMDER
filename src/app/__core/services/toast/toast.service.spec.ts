import { TOAST_DURATION, TOAST_LEAVE_MS, ToastService } from "@core/services/toast/toast.service";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("ToastService", () => {
  let service: ToastService;
  const shown = () => service.toasts().filter((toast) => !toast.leaving);

  beforeEach(() => {
    vi.useFakeTimers();
    service = new ToastService();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows a notice for the time of its kind, and then it goes (after its animation)", () => {
    service.success("Guardado", "Fichero");
    expect(service.toasts()).toMatchObject([{ kind: "success", title: "Fichero", message: "Guardado", duration: TOAST_DURATION.success }]);
    vi.advanceTimersByTime(TOAST_DURATION.success - 1);
    expect(shown()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(shown()).toHaveLength(0);
    expect(service.toasts()).toMatchObject([{ leaving: true }]);
    vi.advanceTimersByTime(TOAST_LEAVE_MS);
    expect(service.toasts()).toHaveLength(0);
  });

  it("waits while the pointer is over it, and goes on after", () => {
    service.info("Hola", "", { duration: 5000 });
    const id = service.toasts()[0].id;
    vi.advanceTimersByTime(4000);
    service.pause(id);
    vi.advanceTimersByTime(60_000);
    expect(shown()).toHaveLength(1);
    service.resume(id);
    // At least a second and a half more
    vi.advanceTimersByTime(1499);
    expect(shown()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(shown()).toHaveLength(0);
  });

  it("counts the same notice instead of repeating it, and keeps the last four", () => {
    service.warning("Lo mismo");
    service.warning("Lo mismo");
    expect(service.toasts()).toMatchObject([{ message: "Lo mismo", count: 2 }]);
    for (let i = 0; i < 7; i++) service.error(`Error ${i}`);
    expect(shown().map((toast) => toast.message)).toEqual(["Error 3", "Error 4", "Error 5", "Error 6"]);
    vi.advanceTimersByTime(TOAST_LEAVE_MS);
    expect(service.toasts()).toHaveLength(4);
  });

  it("a time of 0 waits until it is closed", () => {
    service.error("Grave", "", { duration: 0 });
    vi.advanceTimersByTime(600_000);
    expect(shown()).toHaveLength(1);
    service.close(service.toasts()[0].id);
    vi.advanceTimersByTime(TOAST_LEAVE_MS);
    expect(service.toasts()).toHaveLength(0);
  });
});
