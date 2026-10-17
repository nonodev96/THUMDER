import { controls, expect, go, loadAndStep, test } from "./fixtures";

// The sounds of the simulation (SoundService): what sounds is written in its history, and the Web Audio API of the
// browser plays it once a click has unlocked it

/** SoundService through the navbar (development build: `ng.getComponent`) */
const sound = (page: import("@playwright/test").Page) =>
  page.evaluate(() => {
    // biome-ignore lint/suspicious/noExplicitAny: the debugging API of Angular has no types here
    const service = (window as any).ng.getComponent(document.querySelector("thumder-auth-navbar")).sound;
    return { history: [...service.history] as string[], state: (service.context?.state ?? "none") as string };
  });

test("cada ciclo suena con las etapas a las que entran las instrucciones, y el programa cargado y el final tienen su sonido", async ({ page }) => {
  await go(page, "/auth/code");
  await loadAndStep(page, 4);
  const { history, state } = await sound(page);
  expect(state).toBe("running");
  expect(history[0]).toBe("load");
  // The first cycles: an instruction enters IF, then the next one IF and the first one ID...
  expect(history).toContain("IF:enter");
  expect(history).toContain("IF:enter ID:enter");
  expect(history.some((entry) => /IF:enter ID:enter EX:enter/.test(entry))).toBe(true);

  await page.locator("#simulationRunToEnd").click();
  await expect.poll(async () => (await sound(page)).history.at(-1)).toBe("complete");
});

test("el sonido se apaga desde el menú de la velocidad y se ajusta en la configuración", async ({ page }) => {
  await go(page, "/auth/code");
  await page.locator("#simulationSpeed").click();
  await expect(page.locator("#soundToggle")).toHaveAttribute("aria-pressed", "true");
  await page.locator("#soundToggle").click();
  await loadAndStep(page, 3);
  expect((await sound(page)).history).toEqual([]);
  const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem("thumder_configuration") ?? "{}").sound);
  expect(await saved()).toMatchObject({ enabled: false });

  // The configuration: on again, only the events, and another volume
  await page.locator(".main-sidebar a", { hasText: "Configuración" }).first().click();
  await expect(page.locator("#soundEnabled")).not.toBeChecked();
  await expect(page.locator("#soundStages")).toBeDisabled();
  await page.locator("label[for='soundEnabled']").click();
  await page.locator("label[for='soundStages']").click();
  await page.locator("#soundVolume").evaluate((input: HTMLInputElement) => {
    input.value = "30";
    input.dispatchEvent(new Event("change"));
  });
  expect(await saved()).toEqual({ enabled: true, volume: 30, stages: false });
  await page.locator("#soundPreview").click();
  expect((await sound(page)).history.at(-1)).toBe("preview");

  // Without the notes of the stages, a cycle is silent but the events sound
  const before = (await sound(page)).history.length;
  await page.locator(".main-sidebar a", { hasText: "Código" }).first().click();
  await controls(page).step.click();
  await page.waitForTimeout(300);
  expect((await sound(page)).history.slice(before).filter((entry) => entry.includes(":"))).toEqual([]);
});
