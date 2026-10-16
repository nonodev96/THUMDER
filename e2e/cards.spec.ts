import { expect, go, test } from "./fixtures";

// The cards: fold, unfold and fill the screen (thumderCard), and the tables that measure themselves again

const rows = (card: import("@playwright/test").Locator) => card.locator(".thumder-row");

test("la tarjeta de código se pliega, se maximiza y su tabla se vuelve a medir", async ({ page }) => {
  await go(page, "/auth/code");
  const card = page.locator("#Code-card");
  await card.locator(".card-tools button:has(.fa-minus)").click();
  await expect(card).toHaveClass(/collapsed-card/);
  await expect(card.locator(".card-body")).toBeHidden();
  await card.locator(".card-tools button:has(.fa-plus)").click();
  await expect(card).not.toHaveClass(/collapsed-card/);

  // Maximized, the list is taller and its rows (32 px each) still cover it
  const viewport = card.locator("cdk-virtual-scroll-viewport");
  const height = () => viewport.evaluate((element) => element.getBoundingClientRect().height);
  const before = await height();
  await card.locator(".card-tools button:has(.fa-expand)").click();
  await expect(card).toHaveClass(/maximized-card/);
  await expect(page.locator("html")).toHaveClass(/maximized-card/);
  await expect.poll(height).toBeGreaterThan(before);
  await expect.poll(async () => (await rows(card).count()) * 32).toBeGreaterThanOrEqual(Math.floor(await height()));
  await card.locator(".card-tools button:has(.fa-compress)").click();
  await expect(page.locator("html")).not.toHaveClass(/maximized-card/);
  expect(await height()).toBeGreaterThan(200);
});

test("los registros están en pestañas, cada una con su tabla y sus controles", async ({ page }) => {
  await go(page, "/auth/registers");
  await expect(page.getByRole("tab")).toHaveText(["Control", "Enteros", "Coma flotante", "Dobles"]);
  await expect(page.locator("#registersTab-Control")).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#registersPanel-Control .thumder-row").first()).toContainText("PC");

  // The arrows choose the next tab and take the focus to it
  await page.locator("#registersTab-Control").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#registersTab-R")).toBeFocused();
  await expect(page.locator("#registersTab-R")).toHaveAttribute("aria-selected", "true");
  await expect.poll(() => rows(page.locator("#registersPanel-R")).count()).toBeGreaterThan(3);
  await expect(page.locator("#registersPanel-R .thumder-row").first()).toContainText("00000000 00000000 00000000 00000000");

  // The controls of a group are in its tab
  await page.locator("#registersTab-D").click();
  const doubles = page.locator("#registersPanel-D");
  await doubles.getByRole("button", { name: "Uint8" }).click();
  await expect(doubles.getByRole("button", { name: "Uint8" })).toHaveAttribute("aria-pressed", "true");
  await expect(doubles.locator("[role=columnheader]").nth(2)).toHaveText("Uint8");

  // The tab chosen is the one shown the next time
  await page.reload();
  await expect(page.locator("#registersTab-D")).toHaveAttribute("aria-selected", "true");
});

test("el nombre del registro se queda al desplazar la tabla en horizontal", async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 800 });
  await go(page, "/auth/registers");
  await page.locator("#registersTab-D").click();
  const panel = page.locator("#registersPanel-D");
  const scroller = panel.locator(".thumder-table-scroll");
  await expect.poll(() => scroller.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeGreaterThan(200);
  const cells = panel.locator(".thumder-row").first().locator("[role=cell]");
  const x = async (index: number) => ((await cells.nth(index).boundingBox()) as { x: number }).x;
  const [name, hex] = [await x(0), await x(1)];
  await scroller.evaluate((element) => {
    element.scrollLeft = 200;
  });
  await expect.poll(async () => Math.round(hex - (await x(1)))).toBe(200);
  // The name follows the scroll in the next frame (the scroll event)
  await expect.poll(async () => Math.round(await x(0))).toBe(Math.round(name));
  await expect(cells.nth(0)).toHaveText("F0-F1");
});

test("el editor se maximiza y se restaura", async ({ page }) => {
  await go(page, "/auth/editor");
  const card = page.locator("#card-IDE");
  await card.locator(".card-tools button:has(.fa-expand)").click();
  await expect(card).toHaveClass(/maximized-card/);
  await card.locator(".card-tools button:has(.fa-compress)").click();
  await expect(page.locator("html")).not.toHaveClass(/maximized-card/);
});

test("la vista múltiple empieza con todas las ventanas plegadas, también la ruta de datos", async ({ page }) => {
  await go(page, "/auth/multiview");
  const cards = page.locator(".content-wrapper .card");
  await expect.poll(() => cards.count()).toBeGreaterThan(3);
  await expect(page.locator("view-datapath #datapathCard")).toBeVisible();
  await expect(page.locator(".content-wrapper .card:not(.collapsed-card)")).toHaveCount(0);
  await cards.first().locator(".card-tools button:has(.fa-plus)").first().click();
  await expect(cards.first().locator(".card-body")).toBeVisible();
});

test("la ventana de depuración se abre desde el pie, se pliega y se cierra", async ({ page }) => {
  await go(page, "/auth/code");
  await page.locator(".main-footer button", { hasText: "Depuración" }).click();
  const debug = page.locator("#card-debug");
  await expect(debug).toBeVisible();
  await debug.locator(".card-tools button:has(.fa-minus)").click();
  await expect(debug).toHaveClass(/collapsed-card/);
  await debug.locator(".card-tools button:has(.fa-times)").click();
  await expect(debug).toHaveCount(0);
});

test.describe("ventanas flotantes de la vista múltiple", () => {
  const window = (page: import("@playwright/test").Page, name: string) => page.locator(`.thumder-window[data-window="${name}"]`);
  const box = async (page: import("@playwright/test").Page, name: string) => (await window(page, name).boundingBox()) as { x: number; y: number; width: number; height: number };
  const saved = (page: import("@playwright/test").Page) =>
    page.evaluate(() => JSON.parse(localStorage.getItem("thumder_configuration") ?? "{}").windows ?? {});

  test("una ventana se saca, se mueve por su título, cambia de tamaño, se guarda y vuelve a su columna", async ({ page }) => {
    await go(page, "/auth/multiview");
    await page.locator('[data-float="pipeline"]').click();
    await expect(window(page, "pipeline")).toBeVisible();
    await expect(page.locator(".multiview-item view-pipeline")).toHaveCount(0);

    // Moved by its title bar
    const before = await box(page, "pipeline");
    const title = window(page, "pipeline").locator(".card-header").first();
    const titleBox = (await title.boundingBox()) as { x: number; y: number; width: number; height: number };
    // In the middle of the title bar, away from its buttons
    const [grabX, grabY] = [titleBox.x + titleBox.width / 2, titleBox.y + titleBox.height / 2];
    await page.mouse.move(grabX, grabY);
    await page.mouse.down();
    await page.mouse.move(grabX + 200, grabY + 120, { steps: 8 });
    await page.mouse.up();
    const moved = await box(page, "pipeline");
    expect(Math.round(moved.x - before.x)).toBe(200);
    expect(Math.round(moved.y - before.y)).toBe(120);

    // Resized from its corner (on the screen)
    await window(page, "pipeline").locator(".thumder-window-handle-se").scrollIntoViewIfNeeded();
    const moved2 = await box(page, "pipeline");
    const corner = (await window(page, "pipeline").locator(".thumder-window-handle-se").boundingBox()) as { x: number; y: number };
    await page.mouse.move(corner.x + 5, corner.y + 5);
    await page.mouse.down();
    await page.mouse.move(corner.x - 95, corner.y + 65, { steps: 8 });
    await page.mouse.up();
    const resized = await box(page, "pipeline");
    expect(Math.round(resized.width - moved2.width)).toBe(-100);
    expect(Math.round(resized.height - moved2.height)).toBe(60);

    // With the keyboard, from a button of the window
    await window(page, "pipeline").locator('[data-float="pipeline"]').focus();
    await page.keyboard.press("Alt+ArrowRight");
    expect(Math.round((await box(page, "pipeline")).x - resized.x)).toBe(20);

    // Saved: after reloading it is where it was
    await expect.poll(async () => (await saved(page)).pipeline?.width).toBe(Math.round(resized.width));
    await page.reload();
    await expect(window(page, "pipeline")).toBeVisible();
    expect(Math.round((await box(page, "pipeline")).x - resized.x)).toBe(20);

    // Back to its column
    await window(page, "pipeline").locator('[data-float="pipeline"]').click();
    await expect(window(page, "pipeline")).toHaveCount(0);
    await expect(page.locator(".multiview-item view-pipeline")).toHaveCount(1);
    expect(await saved(page)).toEqual({});
  });

  test("la ventana en la que se hace clic pasa delante", async ({ page }) => {
    await go(page, "/auth/multiview");
    // The code window, moved aside with the keyboard (it covers the column), and then the memory one, in front of it
    await page.locator('[data-float="code"]').click();
    await window(page, "code").locator('[data-float="code"]').focus();
    for (let i = 0; i < 30; i++) await page.keyboard.press("Alt+ArrowRight");
    await page.locator('[data-float="memory"]').click();
    const z = (name: string) => window(page, name).evaluate((element) => Number(getComputedStyle(element).zIndex));
    expect(await z("memory")).toBeGreaterThan(await z("code"));
    const header = window(page, "code").locator(".card-header").first();
    const headerBox = (await header.boundingBox()) as { width: number; height: number };
    await header.click({ position: { x: headerBox.width / 2, y: headerBox.height / 2 } });
    await expect.poll(() => z("code")).toBeGreaterThan(await z("memory"));
  });
});
