import { expect, go, test } from "./fixtures";

// No page is wider than the screen, in phones (upright and sideways), tablets, laptops and desktops

const SIZES = {
  movil: { width: 390, height: 844 },
  "movil horizontal": { width: 844, height: 390 },
  tableta: { width: 820, height: 1180 },
  portatil: { width: 1024, height: 768 },
  escritorio: { width: 1440, height: 900 },
};

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
  "/no-existe",
];

for (const [name, size] of Object.entries(SIZES)) {
  test(`sin desbordamiento horizontal: ${name} (${size.width}×${size.height})`, async ({ page }) => {
    await page.setViewportSize(size);
    const overflowing: string[] = [];
    for (const route of ROUTES) {
      await go(page, route);
      const extra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (extra > 0) overflowing.push(`${route} (+${extra} px)`);
    }
    expect(overflowing).toEqual([]);
  });
}
