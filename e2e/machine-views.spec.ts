import { controls, expect, go, loadAndStep, test } from "./fixtures";

// The views of the machine after loading a program: the description of each instruction in the code, the button that
// goes to main in the code and in the memory, the table of the memory, the button of the navbar that resets everything,
// the editor with changes not saved and the log of the simulation

/** The address of main in the program loaded (prim.s has it) */
const mainAddress = (page: import("@playwright/test").Page) =>
  page.evaluate(() => {
    // biome-ignore lint/suspicious/noExplicitAny: the debugging API of Angular has no types here
    const machine = (window as any).ng.getComponent(document.querySelector("thumder-auth-navbar")).machine;
    const entry = machine.entry();
    return `0x${entry.address.toString(16).toUpperCase().padStart(8, "0")}`;
  });

test("código: cada instrucción explica qué hace, y «main» lleva a su fila y abre su explicación", async ({ page }) => {
  await go(page, "/auth/code");
  await expect(page.locator("#codeGoToEntry")).toBeDisabled();
  await controls(page).load.click();
  await expect(controls(page).step).toBeEnabled();

  const card = page.locator("#Code-card");
  await expect(card.locator("[role=columnheader]").last()).toHaveText("Descripción");
  await expect(page.locator("#codeDetail")).toContainText("Pulsa la descripción de una instrucción");

  const main = await mainAddress(page);
  await page.locator("#codeGoToEntry").click();
  const target = card.locator(".thumder-row-target");
  await expect(target).toBeVisible();
  await expect(target.locator("[role=cell]").first()).toHaveText(main);

  // The footer explains the instruction: what it does, the fields of its word and each stage
  const detail = page.locator("#codeDetail");
  await expect(detail.locator(".code-detail-instruction")).toContainText(main);
  await expect(detail.locator(".code-field")).not.toHaveCount(0);
  expect((await detail.locator(".code-field-bits").allTextContents()).join("")).toMatch(/^[01]{32}$/);
  await expect(detail.locator(".code-stages dt")).toHaveText(["IF", "ID", /EX/, "MEM", "WB"]);

  // The button of a description closes it and opens it again
  const describe = target.locator(".code-describe");
  await expect(describe).toHaveAttribute("aria-expanded", "true");
  await describe.click();
  await expect(detail).toContainText("Pulsa la descripción");
  await describe.click();
  await expect(detail.locator(".code-detail-text")).not.toBeEmpty();

  // The footer hides with its line, and choosing another instruction shows it again
  const footer = page.locator("#Code-card details.card-footer");
  await footer.locator("summary").click();
  await expect(detail).toBeHidden();
  await describe.click();
  await describe.click();
  await expect(detail).toBeVisible();
  await expect(detail.locator(".code-detail-text")).not.toBeEmpty();
});

test("memoria: «main» lleva a su palabra y la dirección se queda al desplazar la tabla en horizontal", async ({ page }) => {
  await page.setViewportSize({ width: 760, height: 900 });
  await go(page, "/auth/memory");
  await controls(page).load.click();
  await expect(controls(page).step).toBeEnabled();
  const main = await mainAddress(page);
  await page.locator("#memoryGoToEntry").click();
  const card = page.locator("#Memory-card");
  const target = card.locator(".thumder-row-target");
  await expect(target).toBeVisible();
  await expect(target.locator("[role=cell]").first()).toHaveText(main);

  // The columns take the width of what they show: with the doubles it scrolls sideways, and the address stays
  await card.getByRole("button", { name: "Double" }).first().click();
  const scroller = card.locator(".thumder-table-scroll");
  await expect.poll(() => scroller.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeGreaterThan(50);
  const cells = card.locator(".thumder-row").first().locator("[role=cell]");
  const x = async (index: number) => ((await cells.nth(index).boundingBox()) as { x: number }).x;
  const address = await x(0);
  await scroller.evaluate((element) => {
    element.scrollLeft = element.scrollWidth;
  });
  await expect.poll(async () => Math.round(await x(0))).toBe(Math.round(address));
});

test("la barra reinicia la máquina: memoria, código y registros a cero, y hay que volver a cargar", async ({ page }) => {
  await go(page, "/auth/code");
  await loadAndStep(page, 3);
  await page.locator("#simulationClear").click();
  await expect(page.locator(".thumder-toast", { hasText: "Máquina reiniciada" })).toBeVisible();
  await expect(page.locator("#simulationStatus")).toContainText("Sin cargar");
  await expect(controls(page).step).toBeDisabled();
  await expect(page.locator("#codeGoToEntry")).toBeDisabled();
  const code = () =>
    // biome-ignore lint/suspicious/noExplicitAny: the debugging API of Angular has no types here
    page.evaluate(() => (window as any).ng.getComponent(document.querySelector("thumder-auth-navbar")).machine.state.code().length as number);
  expect(await code()).toBe(0);

  await controls(page).load.click();
  await expect(controls(page).step).toBeEnabled();
  expect(await code()).toBeGreaterThan(0);
  await page.locator("#codeGoToEntry").click();
  await expect(page.locator("#Code-card .thumder-row-target .code-describe")).toBeVisible();
});

test("el editor avisa de los cambios sin guardar, también al cargar, hasta que se guardan", async ({ page }) => {
  await go(page, "/auth/editor");
  await expect(page.locator("#editorUnsaved")).toBeHidden();
  await page.locator("thumder-monaco-editor .view-lines").click();
  await page.keyboard.press("Control+Home");
  await page.keyboard.insertText("; cambio ");
  await expect(page.locator("#editorUnsaved")).toBeVisible();
  await expect(page.locator("#editorUnsavedBadge")).toHaveText(/Sin guardar/);
  await expect(page.locator("#editorSave")).toHaveAttribute("aria-label", /hay cambios sin guardar/);

  await controls(page).load.click();
  await expect(page.locator(".thumder-toast", { hasText: "Cambios sin guardar" })).toBeVisible();

  await page.locator("#editorSaveNow").click();
  await expect(page.locator("#editorUnsaved")).toBeHidden();
  await expect(page.locator("#editorUnsavedBadge")).toHaveCount(0);
  // Undoing the change makes it different again from what was saved
  await page.locator("thumder-monaco-editor .view-lines").click();
  await page.keyboard.press("Control+z");
  await expect(page.locator("#editorUnsaved")).toBeVisible();
});

test("el registro de la simulación se filtra, se vacía y se puede copiar", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await go(page, "/auth/logger");
  await loadAndStep(page, 2);
  const viewer = page.locator("#loggerViewer");
  await expect(viewer.locator(".logger-line").first()).toBeVisible();
  await expect(viewer).toContainText("RESET");

  await page.locator("#loggerFilter").fill("SimulationNextStep");
  await expect.poll(() => viewer.locator(".logger-line").count()).toBeGreaterThanOrEqual(2);
  await expect(viewer.locator(".logger-line", { hasNotText: "SimulationNextStep" })).toHaveCount(0);
  await page.locator("#loggerCopy").click();
  await expect(page.locator(".thumder-toast", { hasText: /\d+ mensajes copiados/ })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("SimulationNextStep");

  await page.locator("#loggerFilter").fill("");
  await page.locator("#loggerClear").click();
  await expect(viewer).toContainText("Aún no hay mensajes");
});

test("@movil el código y la memoria ponen primero lo que se lee, y la memoria elige su tipo en una lista", async ({ page }) => {
  await go(page, "/auth/code");
  await controls(page).load.click();
  await expect(controls(page).step).toBeEnabled();
  const headers = page.locator("#Code-card [role=columnheader]");
  await expect(headers.first()).toHaveText("Dirección");
  await expect(headers.nth(1)).toHaveText("Instrucción");
  await expect(headers.nth(2)).toHaveText("Etapa");
  await expect(headers.nth(3)).toHaveText("Descripción");

  await page.locator(".main-header button:has(.fa-bars)").tap();
  await page.locator(".main-sidebar a", { hasText: "Memoria" }).first().tap();
  await expect(page.locator("#memoryTypeSelect")).toBeVisible();
  await page.locator("#memoryTypeSelect").selectOption("Float");
  const memory = page.locator("#Memory-card [role=columnheader]");
  await expect(memory.nth(1)).toHaveText("Float");
  await expect(memory.last()).toHaveText(/Binario/);
});
