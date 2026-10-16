import { readFileSync } from "node:fs";
import { controls, example, expect, fileItem, go, loadAndStep, machineState, test } from "./fixtures";

// The tools to learn with (fase F de TODO-cierre.md): speed, running without drawing, stepping back, why each
// instruction stalls, comparing forwarding, the problems, symbols and breakpoints of the program, the guided and the
// shared exercises, the datapath and the exports

const sidebar = (page: import("@playwright/test").Page, text: string | RegExp) => page.locator(".main-sidebar a", { hasText: text }).first().click();

test.describe("simulación", () => {
  test("la velocidad se elige en la barra y se guarda", async ({ page }) => {
    await go(page, "/auth/code");
    await page.locator("#simulationSpeed").click();
    await page.getByRole("button", { name: /^Lenta/ }).click();
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("thumder_configuration") ?? "{}").delay)).toBe(250);
    await expect(page.locator("#simulationSpeed")).toHaveAttribute("title", /Lenta/);
  });

  test("ejecutar hasta el final sin dibujar termina y deja el estado final", async ({ page }) => {
    await go(page, "/auth/code");
    await controls(page).load.click();
    await expect(controls(page).step).toBeEnabled();
    await page.locator("#simulationRunToEnd").click();
    await expect.poll(async () => (await machineState(page)).complete, { timeout: 20_000 }).toBe(true);
    const state = await machineState(page);
    expect(state.step).toBeGreaterThan(100);
    await sidebar(page, "Estadísticas");
    await expect(page.locator("view-statistics pre")).toContainText(String(state.step + 1));
  });

  test("el paso atrás vuelve exactamente al ciclo anterior", async ({ page }) => {
    await go(page, "/auth/code");
    await loadAndStep(page, 8);
    const before = await machineState(page);
    await controls(page).step.click();
    await expect.poll(async () => (await machineState(page)).step).toBe(before.step + 1);
    await page.locator("#simulationStepBack").click();
    await expect.poll(async () => (await machineState(page)).step).toBe(before.step);
    expect(await machineState(page)).toEqual(before);
    // Mayúsculas+F10 también
    await page.keyboard.press("Shift+F10");
    await expect.poll(async () => (await machineState(page)).step).toBe(before.step - 1);
  });
});

test.describe("el diagrama de ciclos", () => {
  test.use({ seed: { files: [fileItem("02-suma-vector.s", example("ejemplos/02-suma-vector.s"))], open: "02-suma-vector.s", delay: 0, cookiesAnswered: true } });

  test("explica cada atasco y se exporta", async ({ page }) => {
    await go(page, "/auth/cycle-clock-diagram");
    await loadAndStep(page, 25);
    await expect(page.locator("#diagramExplanation")).toContainText("Haz clic en una celda");
    await page.locator("#diagramNextStall").click();
    await expect(page.locator("#diagramExplanation")).toContainText(/R-Stall en el ciclo \d+: .+ necesita R\d+, que calcula .+/);
    await expect(page.locator("#diagramExplanation")).toContainText(/adelantamiento/);

    await page.locator("#diagramExport").click();
    const [csv] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /Tabla \(CSV\)/ }).click()]);
    expect(csv.suggestedFilename()).toBe("diagrama-de-ciclos.csv");
    const text = readFileSync(await csv.path(), "utf8");
    expect(text.split("\n")[0]).toMatch(/^Instruction,0,1,2/);
    expect(text).toContain("R-Stall");
  });
});

test.describe("estadísticas", () => {
  test("compara el programa con y sin adelantamiento", async ({ page }) => {
    await go(page, "/auth/code");
    await controls(page).load.click();
    await expect(controls(page).step).toBeEnabled();
    await sidebar(page, "Estadísticas");
    await page.locator("#statisticsCompare").click();
    const table = page.locator("#statisticsComparison");
    await expect(table).toBeVisible({ timeout: 20_000 });
    const cycles = table.locator("tbody tr").first().locator("td");
    const [withForwarding, without] = [Number((await cycles.nth(0).innerText()).replace(/\D/g, "")), Number((await cycles.nth(1).innerText()).replace(/\D/g, ""))];
    expect(without).toBeGreaterThan(withForwarding);
  });
});

test.describe("el editor", () => {
  const broken = "        .text\n        .global main\nmain:   addi    r1,r0\n        add     r2,r1,r9,r3\n        trap    0\n";
  test.use({ seed: { files: [fileItem("roto.s", broken)], open: "roto.s", delay: 1, cookiesAnswered: true } });

  test("el panel de problemas explica por qué no se puede simular y lleva a cada línea", async ({ page }) => {
    await go(page, "/auth/editor");
    await expect(page.locator("thumder-problems-panel")).toContainText("Carga el código");
    await controls(page).load.click();
    const panel = page.locator("thumder-problems-panel");
    await expect(panel).toContainText("No se puede simular: el programa tiene 2 errores");
    await expect(panel.locator("li")).toHaveCount(2);
    await panel.locator("li button").nth(1).click();
    await expect
      .poll(() => page.evaluate(() => (window as any).ng.getComponent(document.querySelector("thumder-monaco-editor")).editor.getPosition().lineNumber))
      .toBe(4);
  });
});

test.describe("símbolos y puntos de ruptura", () => {
  const store = example("prim.s").split("\n").findIndex((line) => line.includes("sw      Table(r1),r2")) + 1;
  test.use({ seed: { files: [fileItem("prim.s")], open: "prim.s", delay: 0, cookiesAnswered: true, breakpoints: { [store]: true } } });

  test("los símbolos del programa, y un punto de ruptura que espera a MEM", async ({ page }) => {
    await go(page, "/auth/editor");
    await controls(page).load.click();
    await expect(controls(page).step).toBeEnabled();
    await page.locator("#editorSymbols").click();
    await expect(page.locator("#symbolsTable")).toContainText("Loop");
    await page.locator("#symbolsFilter").fill("table");
    await expect(page.locator("#symbolsTable tbody tr")).toHaveCount(1);
    await expect(page.locator("#symbolsTable")).toContainText("0x00001004");
    await page.keyboard.press("Escape");

    await page.locator("#editorBreakpoints").click();
    await page.locator(`#breakpointStage-${store}`).selectOption("MEM");
    await page.keyboard.press("Escape");
    await controls(page).run.click();
    await expect(page.locator(".ngx-toastr", { hasText: `Parada en la línea ${store}, al llegar a MEM` })).toBeVisible();
  });

  test("vigilar una dirección para la ejecución cuando se escribe", async ({ page }) => {
    await go(page, "/auth/editor");
    await controls(page).load.click();
    await expect(controls(page).step).toBeEnabled();
    await page.locator("#editorBreakpoints").click();
    await page.locator("#watchAddress").fill("0x1008");
    await page.locator("#watchAdd").click();
    await expect(page.locator("#breakpointsWatchpoints")).toContainText("0x00001008");
    await page.keyboard.press("Escape");
    // Without the breakpoint of the line
    await page.evaluate(() => localStorage.setItem("breakpoints", "{}"));
    await page.evaluate(() => (window as any).ng.getComponent(document.querySelector("thumder-auth-navbar")).machine.breakpointManager.updateManager({}));
    await controls(page).run.click();
    await expect(page.locator(".ngx-toastr", { hasText: "se ha escrito en 0x00001008" })).toBeVisible();
  });
});

test.describe("módulos", () => {
  test.use({
    seed: { files: [fileItem("gcm.s"), fileItem("input.s"), fileItem("prim.s")], open: "gcm.s", delay: 0, cookiesAnswered: true },
  });

  test("se eligen a mano y sin el que hace falta el programa no se ensambla", async ({ page }) => {
    await go(page, "/auth/editor");
    await controls(page).load.click();
    await expect(controls(page).step).toBeEnabled();
    await page.locator("#editorModules").click();
    await expect(page.locator("#programModulesModal")).toContainText("Cargados ahora: input.s");
    await page.locator("#modulesChosen").check({ force: true });
    await page.locator("#programModulesModal label", { hasText: "input.s" }).click();
    await page.locator("#programModulesSave").click();
    await expect(page.locator("thumder-problems-panel")).toContainText("Undefined symbol: InputUnsigned");
  });
});

test.describe("ejercicios", () => {
  test.use({ seed: { files: [], open: null, delay: 0, cookiesAnswered: true } });

  test("un ejercicio guiado se abre con su configuración bloqueada y comprueba las respuestas", async ({ page }) => {
    await go(page, "/auth/exercises");
    await page.locator("[data-exercise='sin-adelantamiento']").click();
    await expect(page).toHaveURL(/\/auth\/editor$/);
    await expect(page.locator("#editorExercise")).toContainText("sin adelantamiento");
    await expect(controls(page).step).toBeEnabled();
    await page.keyboard.press("F8");
    await expect.poll(async () => (await machineState(page)).complete, { timeout: 20_000 }).toBe(true);
    const cycles = (await machineState(page)).step + 1;

    await sidebar(page, "Ejercicios");
    await expect(page.locator("#exerciseActive")).toBeVisible();
    await page.locator("#answer-cycles").fill(String(cycles));
    await page.locator("#answer-raw").fill("0");
    await page.locator("#exerciseCheck").click();
    await expect(page.locator("#exerciseScore")).toHaveText("1 de 2 respuestas correctas.");
    await page.locator("#exerciseSolutions").click();
    await expect(page.locator("#exerciseActive")).toContainText(`Solución: ${cycles}`);

    // The configuration of the exercise cannot change
    await sidebar(page, "Configuración");
    await expect(page.locator("#configLocked")).toBeVisible();
    await expect(page.locator("#forwardingID")).toBeDisabled();
    await expect(page.locator("#forwardingID")).not.toBeChecked();
  });

  test("un programa se comparte con un enlace que lo abre con lo que bloquea", async ({ page }) => {
    await go(page, "/auth/file-manager");
    await expect(page.locator(".file-name", { hasText: /^prim\.s$/ })).toBeVisible();
    await page.locator("tbody tr", { hasText: "prim.s" }).dblclick();
    await expect(page).toHaveURL(/\/auth\/editor$/);
    await page.locator("#editorShare").click();
    await page.locator("#shareStatement").fill("Cuenta los ciclos");
    await expect(page.locator("#shareLink")).toHaveValue(/\/auth\/shared\?d=[\w-]+$/);
    const link = await page.locator("#shareLink").inputValue();
    await page.keyboard.press("Escape");

    await page.goto(link);
    await expect(page.locator("#sharedName")).toHaveText(/^prim\.s$/);
    await expect(page.locator("#sharedStatement")).toHaveText("Cuenta los ciclos");
    await page.locator("#sharedOpen").click();
    await expect(page).toHaveURL(/\/auth\/editor$/);
    await expect(page.locator("#editorExercise")).toContainText("Cuenta los ciclos");
    await expect(page.locator("#editorExercise")).toContainText("Adelantamiento");
  });
});

test.describe("la ruta de datos", () => {
  test("enseña qué instrucción hay en cada etapa", async ({ page }) => {
    await go(page, "/auth/datapath");
    await expect(page.locator("#datapathSummary")).toContainText("IF: vacía");
    await loadAndStep(page, 4);
    await expect(page.locator("#datapathSummary")).toContainText("IF:");
    await expect(page.locator("#datapathSummary")).not.toContainText("IF: vacía");
    await expect(page.locator(".datapath-svg")).toBeVisible();
  });
});
