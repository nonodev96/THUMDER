import { controls, example, expect, fileItem, go, loadAndStep, machineState, storedFiles, test } from "./fixtures";

// The simulation from the page: the Worker assembles and runs, and the views follow it

test("prim.s: el código marca las etapas y los registros siguen a la simulación", async ({ page }) => {
  await go(page, "/auth/code");
  await loadAndStep(page, 6);
  // The code starts at 0x100 (row 64): the virtual table only draws what is visible (rows of 32 px)
  await page.locator("#Code-card cdk-virtual-scroll-viewport").evaluate((element) => {
    element.scrollTop = 60 * 32;
  });
  await expect.poll(() => page.locator("#Code-card .thumder-row[class*='stage-']").count()).toBeGreaterThanOrEqual(3);

  // Through the sidebar: a reload would start again
  await page.locator(".main-sidebar a", { hasText: "Registros" }).first().click();
  const pc = () =>
    page.evaluate(
      () =>
        [...document.querySelectorAll("#registers_Control_id .thumder-row")]
          .find((row) => /^\s*PC\b/.test(row.textContent ?? ""))
          ?.querySelectorAll("[role=cell]")[1]
          ?.textContent?.trim() ?? "",
    );
  await expect.poll(pc).not.toBe("");
  const pcBefore = await pc();
  for (let i = 0; i < 3; i++) await controls(page).step.click();
  await expect.poll(pc).not.toBe(pcBefore);

  const integers = page.locator("#registers_R_id");
  await integers.locator(".card-tools button:has(.fa-plus)").click();
  const values = () => integers.evaluate((card) => [...card.querySelectorAll(".thumder-row")].map((row) => row.querySelectorAll("[role=cell]")[1]?.textContent?.trim()).join());
  const before = await values();
  for (let i = 0; i < 15; i++) await controls(page).step.click();
  await expect.poll(values).not.toBe(before);
});

test.describe("con entrada por la consola", () => {
  test.use({ seed: { files: [fileItem("gcm.s"), fileItem("input.s")], open: "gcm.s", delay: 1, cookiesAnswered: true } });

  test("gcm.s pide dos números y escribe su máximo común divisor", async ({ page }) => {
    await go(page, "/auth/code");
    const { load, run } = controls(page);
    await load.click();
    await expect(run).toBeEnabled();
    await run.click();
    const line = page.getByLabel("Línea para el programa");
    const output = page.locator(".thumder-dlx-io-output");
    await line.fill("84");
    await line.press("Enter");
    await expect(output).toContainText("Second Number:");
    await line.fill("36");
    await line.press("Enter");
    await expect(output).toContainText("gcM=12");
  });
});

test.describe("ejemplos", () => {
  test.use({ seed: { files: [], open: null, delay: 1, cookiesAnswered: true } });

  test("los 20 ejemplos están siempre en el gestor de ficheros, y Hanoi y la media se ejecutan", async ({ page }) => {
    await go(page, "/auth/file-manager");
    const run = async (name: string, lines: string[], expected: string) => {
      await go(page, "/auth/file-manager");
      await page.locator("tbody tr", { has: page.locator(".file-name", { hasText: /^ejemplos$/ }) }).dblclick();
      await page.locator("tbody tr", { hasText: name }).dblclick();
      await expect(page).toHaveURL(/\/auth\/editor$/);
      await expect(page.locator("#editorReadOnly")).toContainText("mis ejemplos");
      // Leaving the editor keeps the file open for the simulator (and, without changes, copies nothing)
      await page.locator(".main-sidebar a", { hasText: "Código" }).first().click();
      await expect(page).toHaveURL(/\/auth\/code$/);
      await controls(page).load.click();
      await expect(controls(page).run).toBeEnabled();
      await controls(page).run.click();
      for (const text of lines) {
        const line = page.getByLabel("Línea para el programa");
        await line.fill(text);
        await line.press("Enter");
      }
      await expect(page.locator(".thumder-dlx-io-output")).toContainText(expected);
    };
    await run("15-hanoi.s", [], "Movimientos: 7");
    await run("20-media-entrada.s", ["4", "8", "15", "16", "23", "42", "0"], "6 numeros, suma 108, media 18");
    // Opened and run without changes: nothing was copied
    expect((await storedFiles(page)).filter((file) => file.name.endsWith(".s"))).toHaveLength(2);
  });
});

test.describe("errores de ensamblado", () => {
  const broken = "        .text\n        .global main\nmain:   addi    r1,r0\n        add     r2,r1,r9,r3\n        trap    0\n";
  test.use({ seed: { files: [fileItem("roto.s", broken)], open: "roto.s", delay: 1, cookiesAnswered: true } });

  test("un programa con errores los marca en su línea del editor y no se puede simular", async ({ page }) => {
    await go(page, "/auth/editor");
    await controls(page).load.click();
    await expect(page.locator(".ngx-toastr", { hasText: "El programa tiene errores" })).toBeVisible();
    await expect.poll(() => page.locator(".monaco-editor .squiggly-error").count()).toBeGreaterThanOrEqual(2);
    await expect(controls(page).step).toBeDisabled();
    await expect(controls(page).run).toBeDisabled();
  });
});

const loopLine = example("prim.s").split("\n").findIndex((line) => line.startsWith("Loop:")) + 1;

test.describe("puntos de ruptura", () => {
  test.use({ seed: { files: [fileItem("prim.s")], open: "prim.s", delay: 1, cookiesAnswered: true, breakpoints: { [loopLine]: true } } });

  test("la ejecución se para en la línea con el punto de ruptura", async ({ page }) => {
    await go(page, "/auth/code");
    await controls(page).load.click();
    await expect(controls(page).run).toBeEnabled();
    await controls(page).run.click();
    await expect.poll(async () => (await machineState(page)).running).toBe(false);
    const state = await machineState(page);
    expect(state.complete).toBe(false);
    expect(state.line).toBe(loopLine);
  });
});

test.describe("un punto de ruptura quitado", () => {
  // The editor keeps the removed breakpoints with false
  test.use({ seed: { files: [fileItem("prim.s")], open: "prim.s", delay: 0, cookiesAnswered: true, breakpoints: { [loopLine]: false } } });

  test("no para la ejecución", async ({ page }) => {
    await go(page, "/auth/code");
    await controls(page).load.click();
    await expect(controls(page).run).toBeEnabled();
    await controls(page).run.click();
    await expect.poll(async () => (await machineState(page)).complete, { timeout: 30_000 }).toBe(true);
  });
});

test.describe("coma flotante", () => {
  test.use({
    seed: { files: [fileItem("16-producto-escalar.s", example("ejemplos/16-producto-escalar.s"))], open: "16-producto-escalar.s", delay: 1, cookiesAnswered: true },
  });

  test("el pipeline muestra las instrucciones dobles en las unidades de suma y de multiplicación", async ({ page }) => {
    await go(page, "/auth/pipeline");
    await controls(page).load.click();
    await expect(controls(page).step).toBeEnabled();
    const seen = { fadd: false, fmult: false };
    for (let i = 0; i < 40 && !(seen.fadd && seen.fmult); i++) {
      await controls(page).step.click();
      const units = JSON.parse((await machineState(page)).pipeline) as Record<"faddEX" | "fmultEX", { text: string }[]> | null;
      seen.fadd ||= units?.faddEX.some(({ text }) => /addd/i.test(text)) ?? false;
      seen.fmult ||= units?.fmultEX.some(({ text }) => /multd/i.test(text)) ?? false;
    }
    expect(seen).toEqual({ fadd: true, fmult: true });
  });
});

