import AxeBuilder from "@axe-core/playwright";
import { expect, go, test } from "./fixtures";

// The accordions of «Sobre nosotros», the documentation by parts, the highlighting of their code (Prism) and the
// instruction table, which THUMDER draws from the definitions of its engine

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
    await expect(page.locator(".docs-markdown, thumder-instruction-table"), id).not.toBeEmpty();
    await expect(page.locator(".docs-page [role=alert]"), id).toHaveCount(0);
  }
});

test("la tabla de instrucciones: la lista y los detalles juntos, la búsqueda, los filtros y el mapa de códigos", async ({ page }) => {
  await go(page, "/auth/documentation?page=instruction-table");
  const panel = page.locator("#itableDetail");
  await expect(panel.locator(".itable-detail-title")).toContainText("ADD");
  await expect(panel.locator(".itable-formula")).toContainText("R3 ← R1 + R2");
  await expect(panel.locator(".itable-field")).toHaveCount(5);
  await expect(panel.locator(".itable-stages li")).toHaveCount(5);

  // The search puts the closest mnemonic first, and a chip leaves one category
  await page.locator("#itableSearch").fill("lw");
  await expect(page.locator(".itable-item-button").first()).toContainText("LW");
  await page.locator("#itableSearch").fill("");
  const float = page.locator(".itable-chip", { hasText: "Coma flotante" });
  await float.click();
  await expect(float).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".itable-item")).toHaveCount(20);

  // A cell of the map opens its instruction, without the filter that left it out, and the address names it
  await page.locator(".itable-matrix button", { hasText: "SW" }).click();
  await expect(page).toHaveURL(/i=SW/);
  await expect(panel.locator(".itable-detail-title")).toContainText("SW");
  await expect(page.locator(".itable-chip").first()).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#itable-SW")).toHaveAttribute("aria-current", "true");

  // A link to an instruction
  await go(page, "/auth/documentation?page=instruction-table&i=JAL");
  await expect(panel.locator(".itable-detail-title")).toContainText("JAL");
  await expect(panel.locator(".itable-facts")).toContainText("R31");
});

test("la tabla de instrucciones en el móvil: tarjetas que se despliegan, sin desplazamiento horizontal @movil", async ({ page }) => {
  await go(page, "/auth/documentation?page=instruction-table");
  await page.locator("#itableSearch").fill("carga palabra");
  const card = page.locator("#itable-LW");
  await expect(card).toHaveAttribute("aria-expanded", "false");
  await card.click();
  await expect(card).toHaveAttribute("aria-expanded", "true");
  const details = page.locator("#itableDetail-LW");
  await expect(details).toContainText("Mem[R1 + 8]");
  await expect(details.locator(".itable-field")).toHaveCount(4);
  await expect(details.locator(".itable-stages li")).toHaveCount(5);
  await expect(page).toHaveURL(/i=LW/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  await card.click();
  await expect(card).toHaveAttribute("aria-expanded", "false");
  await expect(details).toHaveCount(0);
});

for (const theme of ["light", "dark"] as const) {
  test(`la tabla de instrucciones: axe sin infracciones (tema ${theme === "light" ? "claro" : "oscuro"})`, async ({ page }) => {
    await page.addInitScript((theme) => localStorage.setItem("theme", theme), theme);
    await go(page, "/auth/documentation?page=instruction-table&i=LD");
    await expect(page.locator("#itableDetail .itable-detail-title")).toContainText("LD");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).include("thumder-instruction-table").analyze();
    expect(results.violations.map((violation) => `${violation.id} (${violation.impact}): ${violation.nodes.length}`)).toEqual([]);
  });
}
