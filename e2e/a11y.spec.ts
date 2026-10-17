import AxeBuilder from "@axe-core/playwright";
import { expect, go, test } from "./fixtures";

// Accessibility (axe, WCAG 2.1 A and AA) of every view

const ROUTES = [
  "/",
  "/auth/code",
  "/auth/editor",
  "/auth/pipeline",
  "/auth/cycle-clock-diagram",
  "/auth/registers",
  "/auth/memory",
  "/auth/statistics",
  "/auth/file-manager",
  "/auth/config",
  "/auth/calculator",
  "/auth/documentation",
  "/auth/multiview",
  "/auth/profile",
  "/landing/about",
  "/landing/privacy",
  "/landing/legal",
  "/landing/accessibility",
  "/auth/logger",
  "/auth/documentation?page=start",
  "/auth/exercises",
  "/auth/datapath",
  "/auth/shared?d=invalid",
];

/** Rules that still fail (none): a rule that fails again has to be fixed, not added here */
const PENDING: string[] = [];

for (const theme of ["light", "dark"] as const) {
  for (const route of ROUTES) {
    test(`axe sin infracciones (tema ${theme === "light" ? "claro" : "oscuro"}): ${route}`, async ({ page }) => {
      await page.addInitScript((theme) => localStorage.setItem("theme", theme), theme);
      await go(page, route);
      await expect(page.locator("body")).toHaveClass(theme === "dark" ? /dark-mode/ : /^(?!.*dark-mode)/);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).disableRules(PENDING).analyze();
      const violations = results.violations.map((violation) => `${violation.id} (${violation.impact}): ${violation.nodes.length}`);
      expect(violations).toEqual([]);
    });
  }

  test(`axe sin infracciones (tema ${theme === "light" ? "claro" : "oscuro"}): el aviso y los ajustes de privacidad`, async ({ page }) => {
    await page.addInitScript((theme) => {
      localStorage.setItem("theme", theme);
      localStorage.removeItem("thumder_consent");
    }, theme);
    await go(page, "/auth/code");
    await expect(page.locator("#consentBanner")).toBeVisible();
    const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
    let results = await new AxeBuilder({ page }).withTags(tags).include("#consentBanner").analyze();
    expect(results.violations.map((violation) => `${violation.id}: ${violation.nodes.length}`)).toEqual([]);
    await page.locator("#consentSettings").click();
    await expect(page.locator("#consentDialog")).toBeVisible();
    results = await new AxeBuilder({ page }).withTags(tags).include("#consentDialog").analyze();
    expect(results.violations.map((violation) => `${violation.id}: ${violation.nodes.length}`)).toEqual([]);
  });
}
