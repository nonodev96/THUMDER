import { expect, go, test } from "./fixtures";

// The accordions of «Sobre nosotros» and of the documentation, and the highlighting of their code (Prism)

test("«Sobre nosotros»: abrir una sección cierra la otra, y el código bash se resalta", async ({ page }) => {
  await go(page, "/landing/about");
  await expect(page.locator("#collapse_about")).toBeVisible();
  await page.locator('a[href="#collapse_readme"]').click();
  await expect(page.locator("#collapse_readme")).toBeVisible();
  await expect(page.locator("#collapse_about")).toBeHidden();
  await expect(page.locator('a[href="#collapse_readme"]')).toHaveAttribute("aria-expanded", "true");
  await expect.poll(() => page.locator("#collapse_readme pre code .token").count()).toBeGreaterThan(0);
});

test("documentación: abrir una sección cierra la otra", async ({ page }) => {
  await go(page, "/auth/documentation");
  const links = page.locator(".content-wrapper .card-title a");
  await links.nth(0).click();
  await links.nth(1).click();
  const open = () => page.locator(".content-wrapper .collapse").evaluateAll((panels) => panels.map((panel) => panel.classList.contains("show")));
  await expect.poll(open).toEqual(expect.arrayContaining([true]));
  const states = await open();
  expect(states[0]).toBe(false);
  expect(states[1]).toBe(true);
  expect(states.filter(Boolean)).toHaveLength(1);
});
