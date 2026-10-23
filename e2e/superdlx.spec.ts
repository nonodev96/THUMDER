import type { Page } from "@playwright/test";
import { controls, expect, fileItem, go, test } from "./fixtures";

// The architecture chosen in the header: DLX (the pipeline of WinDLX) or SuperDLX (superscalar, as WinSuperDLX)

/** The cycles of the history of SuperDLX (MachineService.timeline) */
const superscalarCycles = (page: Page) =>
  // biome-ignore lint/suspicious/noExplicitAny: the debugging API of Angular has no types here
  page.evaluate(() => (window as any).ng.getComponent(document.querySelector("thumder-auth-navbar")).machine.timeline.cycles as number);

/** Chooses an architecture in the header */
async function choose(page: Page, name: "DLX" | "SuperDLX"): Promise<void> {
  await page.locator("#architectureSelector").click();
  await page.locator(`#architecture-${name === "DLX" ? "dlx" : "superdlx"}`).click();
  await expect(page.locator("#architectureSelector")).toContainText(name);
}

/** Loads the program and runs `count` cycles of SuperDLX, one by one */
async function loadAndStepSuperscalar(page: Page, count: number): Promise<void> {
  const { load, step } = controls(page);
  await load.click();
  await expect(step).toBeEnabled();
  for (let i = 1; i <= count; i++) {
    await step.click();
    await expect.poll(() => superscalarCycles(page), { timeout: 5_000 }).toBeGreaterThanOrEqual(i);
  }
}

test.use({
  seed: {
    files: [fileItem("ejemplos/16-producto-escalar.s"), fileItem("prim.s")],
    open: "16-producto-escalar.s",
    delay: 1,
    cookiesAnswered: true,
  },
});

test("la cabecera elige la arquitectura: SuperDLX muestra su máquina, su diagrama y sus estadísticas", async ({ page }) => {
  await go(page, "/auth/pipeline");
  await expect(page.locator("#architectureSelector")).toContainText("DLX");
  await choose(page, "SuperDLX");
  await expect(page.locator("#pixiCardPipeline .card-title")).toContainText("Máquina superescalar");
  // The configuration keeps it
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("thumder_configuration") ?? "{}").architecture)).toBe("superdlx");

  await loadAndStepSuperscalar(page, 8);
  await expect(page.locator("#superscalarStatus")).toContainText("Ciclo");
  await expect(page.locator("#superscalarRob-int tbody tr").first()).toBeVisible();
  await expect(page.locator("#superscalarUnits")).toContainText("ALU");

  // The diagram of SuperDLX: an instruction in each row, the events in the cycles
  await page.locator(".main-sidebar a", { hasText: "Ciclos de reloj" }).first().click();
  await expect(page.locator("#superscalarDiagram tbody tr").first()).toBeVisible();
  await expect(page.locator("#superscalarDiagram .ssd-cell--F").first()).toBeVisible();
  await page.locator("#superscalarDiagram .ssd-instruction").first().click();
  await expect(page.locator("#superscalarDiagramDetail")).toContainText("#0");
  await page.locator("#superscalarEventsTab").click();
  await expect(page.locator("thumder-superscalar-diagram .thumder-row").first()).toBeVisible();

  // To the end: the statistics say the instructions per cycle
  await page.locator(".main-sidebar a", { hasText: "Estadísticas" }).first().click();
  await page.locator("#simulationRun").click();
  await expect(page.locator("#superscalarIpc")).not.toHaveText("0", { timeout: 20_000 });
  await expect.poll(async () => Number((await page.locator("#superscalarIpc").textContent())?.split(" ")[0].replace(",", "."))).toBeGreaterThan(1);
  await page.locator("#superscalarStatisticsTab-compare").click();
  await page.locator("#superscalarCompare").click();
  await expect(page.locator("#superscalarSpeedup")).toContainText("SuperDLX es");

  // The datapath is of DLX: it is not in the menu with SuperDLX
  await expect(page.locator(".main-sidebar a", { hasText: "Ruta de datos" })).toHaveCount(0);
  await choose(page, "DLX");
  await expect(page.locator(".main-sidebar a", { hasText: "Ruta de datos" })).toHaveCount(1);
  await expect(page.locator("#statisticsTab-summary")).toBeVisible();
});

// In SuperDLX the instruction just fetched can be far ahead of the ones that commit: the editor and the code view say
// the state of every instruction in the machine, and which ones committed in the cycle
test("en SuperDLX el editor y el código dicen el estado de cada instrucción y las que se confirman", async ({ page }) => {
  await go(page, "/auth/editor");
  await choose(page, "SuperDLX");
  await page.locator(".monaco-editor .view-lines").first().waitFor();
  const { load, step } = controls(page);
  await load.click();
  await expect(step).toBeEnabled();
  const labels = page.locator(".monaco-editor .exec-label");
  for (let i = 1; i <= 12; i++) {
    await step.click();
    await expect.poll(() => superscalarCycles(page), { timeout: 5_000 }).toBeGreaterThanOrEqual(i);
    if ((await labels.allTextContents()).some((text) => text.includes("Confirmada"))) break;
  }
  const texts = (await labels.allTextContents()).join(" | ");
  expect(texts).toContain("Confirmada");
  expect(texts).not.toMatch(/\b(IF|ID|MEM|WB)\b/);
  // The code view, with the same states
  await page.locator(".main-sidebar a", { hasText: /^\s*Código\s*$/ }).first().click();
  await page.locator("#Code-card cdk-virtual-scroll-viewport").evaluate((element) => {
    element.scrollTop = 60 * 32;
  });
  await expect
    .poll(() => page.locator("#Code-card .thumder-row[class*='stage-']").allTextContents())
    .toEqual(expect.arrayContaining([expect.stringMatching(/En la cola|En la ventana|En su unidad|Terminada|Confirmada/)]));
});

test("las dos arquitecturas acaban el programa con el mismo resultado", async ({ page }) => {
  await go(page, "/auth/registers");
  const f8 = () =>
    page.evaluate(() => {
      // biome-ignore lint/suspicious/noExplicitAny: the debugging API of Angular has no types here
      const machine = (window as any).ng.getComponent(document.querySelector("thumder-auth-navbar")).machine;
      return `${machine.state.complete()},${JSON.stringify([machine.registers.R, machine.registers.F])}`;
    });
  const runToTheEnd = async () => {
    await controls(page).load.click();
    await expect(controls(page).run).toBeEnabled();
    await controls(page).run.click();
    await expect.poll(f8, { timeout: 20_000 }).toMatch(/^true,/);
    return f8();
  };
  const dlx = await runToTheEnd();
  await choose(page, "SuperDLX");
  expect(await runToTheEnd()).toBe(dlx);
});

test("la configuración tiene los parámetros de SuperDLX y sus máquinas predefinidas", async ({ page }) => {
  await go(page, "/auth/config");
  await page.locator("label[for=configArchitecture-superdlx]").click();
  await expect(page.locator("#superdlxSettings")).toBeVisible();
  await page.locator("#superdlxProfile-scalar").click();
  await expect(page.locator("#superdlx-fetch")).toHaveValue("1");
  await page.locator("#superdlx-rob-int").fill("500");
  await page.locator("#configSaveButton").click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("thumder_configuration") ?? "{}"));
  expect(saved.architecture).toBe("superdlx");
  expect(saved.superdlx.fetch).toBe(1);
  // Out of range: to its limit
  expect(saved.superdlx.rob.int).toBe(128);
  await expect(page.locator("#architectureSelector")).toContainText("SuperDLX");
});

test("@movil el menú «Más» del móvil elige la arquitectura", async ({ page }) => {
  await go(page, "/auth/pipeline");
  await page.locator("#navbarMore").click();
  await page.locator("#moreArchitecture-superdlx").click();
  await expect(page.locator("#pixiCardPipeline .card-title")).toContainText("Máquina superescalar");
});

test.describe("ejemplos y ejercicios de SuperDLX", () => {
  test.use({ seed: { files: [], open: null, delay: 0, cookiesAnswered: true } });

  test("los ejemplos de SuperDLX están en «ejemplos/superdlx», de solo lectura", async ({ page }) => {
    await go(page, "/auth/file-manager");
    await page.locator("tbody tr", { has: page.locator(".file-name", { hasText: /^ejemplos$/ }) }).dblclick();
    await page.locator("tbody tr", { has: page.locator(".file-name", { hasText: /^superdlx$/ }) }).dblclick();
    for (const name of ["01-paralelismo.s", "02-renombrado.s", "03-prediccion-de-saltos.s", "04-dependencias-en-memoria.s", "05-rob-y-coma-flotante.s"]) {
      await expect(page.locator(".file-name", { hasText: name })).toBeVisible();
    }
    await expect(page.locator("#fileManagerNew")).toBeDisabled();
  });

  test("un ejercicio de SuperDLX elige y fija la arquitectura, y sus respuestas salen de la simulación", async ({ page }) => {
    await go(page, "/auth/exercises");
    await expect(page.locator("article", { hasText: "Predicción de saltos con contadores de 2 bits" })).toContainText("SuperDLX");
    await page.locator("[data-exercise='superdlx-prediccion']").click();
    await expect(page).toHaveURL(/\/auth\/editor$/);
    await expect(page.locator("#architectureSelector")).toContainText("SuperDLX");
    await expect(controls(page).step).toBeEnabled();
    await page.keyboard.press("Shift+F9");
    const stats = () =>
      page.evaluate(() => {
        // biome-ignore lint/suspicious/noExplicitAny: the debugging API of Angular has no types here
        const state = (window as any).ng.getComponent(document.querySelector("thumder-auth-navbar")).machine.state;
        return { complete: state.complete() as boolean, stats: state.superscalarStats() as { mispredicted: number; squashed: number } | null };
      });
    await expect.poll(async () => (await stats()).complete, { timeout: 20_000 }).toBe(true);
    const { mispredicted, squashed } = (await stats()).stats as { mispredicted: number; squashed: number };

    await page.locator(".main-sidebar a", { hasText: "Ejercicios" }).first().click();
    await expect(page.locator("#exerciseActive")).toBeVisible();
    await page.locator("#answer-branches").fill("64");
    await page.locator("#answer-mispredicted").fill(String(mispredicted));
    await page.locator("#answer-squashed").fill(String(squashed));
    await page.locator("#exerciseCheck").click();
    await expect(page.locator("#exerciseScore")).toHaveText("3 de 4 respuestas correctas.");

    // The architecture of the exercise cannot change while it is open
    await page.locator("#architectureSelector").click();
    await expect(page.locator("#architectureLocked")).toBeVisible();
    await expect(page.locator("#architecture-dlx")).toBeDisabled();
  });
});
