import { expect, go, loadAndStep, machineState, test } from "./fixtures";

// The configuration: each option explained, and a confirmation before a change throws away the simulation going on

/** A part of the saved configuration (src/app/__core/config/config.ts) */
const stored = (page: import("@playwright/test").Page, key: string) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem("thumder_configuration") ?? "{}")[key] ?? null, key);

test("cada opción tiene su explicación, y ya no hay opciones de THUMDER-server", async ({ page }) => {
  await go(page, "/auth/config");
  for (const id of ["forwardingHelp", "floatingPointHelp", "memorySizeHelp", "timeSimulationHelp", "autoSaveHelp"]) {
    await expect(page.locator(`#${id}`)).not.toBeEmpty();
  }
  await expect(page.locator("#forwardingID")).toHaveAttribute("aria-describedby", "forwardingHelp");
  await expect(page.getByText(/WebSocket|THUMDER-server/)).toHaveCount(0);
});

test("sin simulación en marcha, guarda sin preguntar y ajusta los valores fuera de rango", async ({ page }) => {
  await go(page, "/auth/config");
  await page.locator("#additionCountID").fill("12");
  await page.locator("#memorySizeID").fill("1000");
  await page.locator("#configSaveButton").click();
  await expect(page.locator("#configConfirmModal")).toBeHidden();
  await expect.poll(() => stored(page, "floatingPoint")).toMatchObject({ addition: { count: 8 } });
  expect(await stored(page, "memorySize")).toBe(1000);
  // The form shows what was saved
  await expect(page.locator("#additionCountID")).toHaveValue("8");
});

test("un cambio de la velocidad se guarda sin preguntar aunque haya una simulación en marcha", async ({ page }) => {
  await go(page, "/auth/code");
  await loadAndStep(page, 3);
  await page.locator(".main-sidebar a", { hasText: "Configuración" }).first().click();
  await page.locator("#timeSimulationID").fill("40");
  await page.locator("#configSaveButton").click();
  await expect(page.locator("#configConfirmModal")).toBeHidden();
  await expect.poll(() => stored(page, "delay")).toBe(40);
  // The simulation goes on
  expect((await machineState(page)).step).toBeGreaterThan(0);
});

test("con una simulación en marcha, pide confirmación: cancelar no cambia nada y aceptar reinicia", async ({ page }) => {
  await go(page, "/auth/code");
  await loadAndStep(page, 3);
  await page.locator(".main-sidebar a", { hasText: "Configuración" }).first().click();
  const before = await stored(page, "forwarding");
  await page.locator("#forwardingID").uncheck();

  await page.locator("#configSaveButton").click();
  const modal = page.locator("#configConfirmModal");
  await expect(modal).toBeVisible();
  await modal.locator(".modal-footer button.btn-secondary").click();
  await expect(modal).toBeHidden();
  expect(await stored(page, "forwarding")).toBe(before);
  expect((await machineState(page)).canSimulate).toBe(true);

  await page.locator("#configSaveButton").click();
  await page.locator("#configConfirmButton").click();
  await expect(modal).toBeHidden();
  await expect.poll(() => stored(page, "forwarding")).toBe(false);
  await expect.poll(async () => (await machineState(page)).step).toBe(0);
});
