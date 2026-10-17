import { expect, go, test } from "./fixtures";

// The accordions of «Sobre nosotros», the documentation by parts, and the highlighting of their code (Prism)

test("«Sobre nosotros»: abrir una sección cierra la otra, y el código bash se resalta", async ({ page }) => {
  await go(page, "/landing/about");
  await expect(page.locator("#collapse_about")).toBeVisible();
  await page.locator('a[href="#collapse_readme"]').click();
  await expect(page.locator("#collapse_readme")).toBeVisible();
  await expect(page.locator("#collapse_about")).toBeHidden();
  await expect(page.locator('a[href="#collapse_readme"]')).toHaveAttribute("aria-expanded", "true");
  await expect.poll(() => page.locator("#collapse_readme pre code .token").count()).toBeGreaterThan(0);
});

test("documentación: tres partes, una página por enlace, y los enlaces entre páginas funcionan", async ({ page }) => {
  await go(page, "/auth/documentation");
  await expect(page.locator(".docs-part-title")).toHaveText([/Usar THUMDER/, /La arquitectura DLX/, /Desarrollo/]);
  await page.locator(".docs-nav a", { hasText: "Primeros pasos" }).click();
  await expect(page).toHaveURL(/page=start/);
  await expect(page.locator(".docs-page-title")).toHaveText("Primeros pasos");
  await expect(page.locator(".docs-markdown")).toContainText("Carga el código");

  // The search of the index
  await page.locator("#docsSearch").fill("tabla");
  await expect(page.locator(".docs-nav-list a")).toHaveText([/La tabla de instrucciones/]);

  // A link to another page of the documentation opens it, and its images come from the build
  await go(page, "/auth/documentation?page=simulator");
  await page.locator(".docs-markdown a", { hasText: /manual/i }).first().click();
  await expect(page).toHaveURL(/page=windlx/);
  const image = page.locator(".docs-markdown img").first();
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth)).toBeGreaterThan(0);
});

test("documentación: todas las páginas cargan", async ({ page }) => {
  await go(page, "/auth/documentation");
  const ids = await page.locator("#docsSelect option").evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value).filter(Boolean));
  expect(ids.length).toBeGreaterThan(20);
  for (const id of ids) {
    await page.goto(`/auth/documentation?page=${id}`);
    await expect(page.locator(".docs-markdown"), id).not.toBeEmpty();
    await expect(page.locator(".docs-page [role=alert]"), id).toHaveCount(0);
  }
});
