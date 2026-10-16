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

test("los registros enteros, de coma flotante y dobles empiezan plegados y se despliegan con su tabla", async ({ page }) => {
  await go(page, "/auth/registers");
  for (const id of ["registers_R_id", "registers_F_id", "registers_D_id"]) await expect(page.locator(`#${id}`)).toHaveClass(/collapsed-card/);
  await expect(page.locator("#registers_Control_id")).not.toHaveClass(/collapsed-card/);
  const integers = page.locator("#registers_R_id");
  await integers.locator(".card-tools button:has(.fa-plus)").click();
  await expect.poll(() => rows(integers).count()).toBeGreaterThan(3);
});

test("el editor se maximiza y se restaura", async ({ page }) => {
  await go(page, "/auth/editor");
  const card = page.locator("#card-IDE");
  await card.locator(".card-tools button:has(.fa-expand)").click();
  await expect(card).toHaveClass(/maximized-card/);
  await card.locator(".card-tools button:has(.fa-compress)").click();
  await expect(page.locator("html")).not.toHaveClass(/maximized-card/);
});

test("la vista múltiple empieza con todas las ventanas plegadas", async ({ page }) => {
  await go(page, "/auth/multiview");
  const cards = page.locator(".content-wrapper .card");
  await expect.poll(() => cards.count()).toBeGreaterThan(3);
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
