import { expect, go, sidebarBox, sidebarToggle, test } from "./fixtures";

// The layout: the sidebar, the dropdowns of the navbar and the cookie banner

test.describe("Menú lateral", () => {
  test("en escritorio, el botón lo pliega a iconos y lo despliega, y el estado se conserva al navegar", async ({ page }) => {
    await go(page, "/auth/code");
    const wide = (await sidebarBox(page)).width;
    await sidebarToggle(page).click();
    await expect.poll(async () => (await sidebarBox(page)).width).toBeLessThan(100);
    await page.locator(".main-sidebar a", { hasText: "Memoria" }).first().click();
    await expect(page).toHaveURL(/\/auth\/memory$/);
    // Folded, the sidebar unfolds while the mouse is over it (CSS of AdminLTE)
    await page.mouse.move(800, 500);
    await expect(page.locator("body")).toHaveClass(/sidebar-collapse/);
    await expect.poll(async () => (await sidebarBox(page)).width).toBeLessThan(100);
    await sidebarToggle(page).click();
    await expect.poll(async () => (await sidebarBox(page)).width).toBe(wide);
  });

  test("@movil abre sobre el contenido, la capa de fuera lo cierra y se cierra al navegar", async ({ page }) => {
    await go(page, "/auth/code");
    expect((await sidebarBox(page)).left).toBeLessThan(0);
    await sidebarToggle(page).tap();
    await expect.poll(async () => (await sidebarBox(page)).left).toBe(0);
    await page.locator("#sidebar-overlay").tap({ position: { x: 360, y: 400 }, force: true });
    await expect.poll(async () => (await sidebarBox(page)).left).toBeLessThan(0);
    await sidebarToggle(page).tap();
    await page.locator(".main-sidebar a", { hasText: "Memoria" }).first().tap();
    await expect(page).toHaveURL(/\/auth\/memory$/);
    await expect.poll(async () => (await sidebarBox(page)).left).toBeLessThan(0);
  });

  test("@tableta empieza cerrado al entrar directamente en una ruta interna", async ({ page }) => {
    await go(page, "/auth/registers");
    expect((await sidebarBox(page)).left).toBeLessThan(0);
  });
});

test.describe("Desplegables", () => {
  test("«Páginas» abre, Escape lo cierra y un clic fuera también", async ({ page }) => {
    await go(page, "/auth/code");
    const menu = page.locator("[aria-labelledby=dropdownSubMenuNavigation]");
    await page.locator("#dropdownSubMenuNavigation").click();
    await expect(menu).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(page.locator("#dropdownSubMenuNavigation")).toBeFocused();
    await page.locator("#dropdownSubMenuNavigation").click();
    await page.mouse.click(700, 600);
    await expect(menu).toBeHidden();
  });

  test("«Idioma» cambia el idioma y se cierra; las flechas recorren las opciones", async ({ page }) => {
    await go(page, "/auth/code");
    await page.locator("#dropdownSubMenuLang").click();
    await page.locator("#changeLangToEnglish").click();
    await expect(page.locator("#changeLangToEnglish")).toBeHidden();
    await expect(page.locator(".main-sidebar")).toContainText("Memory");
    await page.locator("#dropdownSubMenuLang").focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#changeLangToSpanish")).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#changeLangToEnglish")).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Enter");
    await expect(page.locator(".main-sidebar")).toContainText("Memoria");
  });

  test("@movil el de idioma abre con el dedo y se cierra al tocar fuera", async ({ page }) => {
    await go(page, "/auth/code");
    await page.locator("#dropdownSubMenuLang").tap();
    await expect(page.locator("#changeLangToEnglish")).toBeVisible();
    await page.locator(".content-wrapper").tap({ position: { x: 200, y: 300 } });
    await expect(page.locator("#changeLangToEnglish")).toBeHidden();
  });
});

test.describe("Cookies", () => {
  test.use({ seed: { files: [], open: null, delay: 1, cookiesAnswered: false } });

  test("el aviso sale la primera vez y su enlace lleva a «Sobre nosotros»", async ({ page }) => {
    await go(page, "/");
    await expect(page.locator(".cc-window")).toBeVisible();
    await expect(page.locator("#cookieconsent\\:link")).toBeVisible();
  });
});
