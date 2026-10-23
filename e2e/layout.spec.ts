import { expect, go, loadAndStep, sidebarBox, sidebarToggle, test } from "./fixtures";

// The layout: the sidebar, the dropdowns of the navbar, the privacy banner and the legal texts

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

  test("@movil «Más opciones» reúne la velocidad, el tema y el idioma, abre con el dedo y se cierra al tocar fuera", async ({ page }) => {
    await go(page, "/auth/code");
    await expect(page.locator("#dropdownSubMenuLang")).toBeHidden();
    await expect(page.locator("#simulationSpeed")).toBeHidden();
    await page.locator("#navbarMore").tap();
    await expect(page.locator("#moreLangEnglish")).toBeVisible();
    await expect(page.locator("#moreTheme-dark")).toBeVisible();
    // Outside the menu, which takes the right of the screen
    await page.locator(".content-wrapper").tap({ position: { x: 20, y: 300 } });
    await expect(page.locator("#moreLangEnglish")).toBeHidden();

    // An option closes the menu and does what it says
    await page.locator("#navbarMore").tap();
    await page.locator("#moreLangEnglish").tap();
    await expect(page.locator("#moreLangEnglish")).toBeHidden();
    await expect(page.locator(".main-sidebar")).toContainText("Memory");
  });
});

test.describe("Privacidad", () => {
  test.use({ seed: { files: [], open: null, delay: 1, cookiesAnswered: false } });

  test("el aviso sale la primera vez, rechazar es tan fácil como aceptar y la elección se guarda", async ({ page }) => {
    await go(page, "/");
    const banner = page.locator("#consentBanner");
    await expect(banner).toBeVisible();
    await expect(banner.getByRole("link", { name: "Política de privacidad y cookies" })).toHaveAttribute("href", "/landing/privacy");
    await expect(page.locator("#consentReject")).toBeVisible();
    await expect(page.locator("#consentAccept")).toBeVisible();

    await page.locator("#consentReject").click();
    await expect(banner).toBeHidden();
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("thumder_consent") ?? "null"));
    expect(stored).toMatchObject({ analytics: false, errors: false, version: 1 });

    await page.reload();
    await expect(page.locator("#consentBanner")).toBeHidden();
  });

  test("la ventana de privacidad se abre desde el pie, guarda cada opción y se cierra con Escape", async ({ page }) => {
    await go(page, "/auth/editor");
    await page.locator("#consentSettings").click();
    const dialog = page.locator("#consentDialog");
    await expect(dialog).toBeVisible();
    await expect(page.locator("#consentNecessary")).toBeDisabled();
    await expect(page.locator("#consentAnalytics")).not.toBeChecked();
    await page.locator("label[for='consentErrors']").click();
    await expect(page.locator("#consentErrors")).not.toBeChecked();
    await page.locator("label[for='consentAnalytics']").click();
    await page.locator("#consentSave").click();
    await expect(dialog).toBeHidden();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("thumder_consent") ?? "null"))).toMatchObject({ analytics: true, errors: false });

    await page.locator("#footerConsent").click();
    await expect(dialog).toBeVisible();
    await expect(page.locator("#consentAnalytics")).toBeChecked();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("la cookie del aviso anterior (cookieconsent) cuenta como respuesta", async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "cookieconsent_status", value: "deny", url: baseURL as string }]);
    await go(page, "/");
    await expect(page.locator("#consentBanner")).toBeHidden();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("thumder_consent") ?? "null"))).toMatchObject({ analytics: false });
    expect(await page.evaluate(() => document.cookie)).not.toContain("cookieconsent_status");
  });

  test("los textos legales: privacidad, aviso legal, borrar la cuenta y accesibilidad, en los dos idiomas", async ({ page }) => {
    for (const [route, title] of [
      ["/landing/privacy", "Privacidad y cookies"],
      ["/landing/legal", "Aviso legal"],
      ["/landing/delete-account", "Borrar tu cuenta de THUMDER"],
      ["/landing/accessibility", "Declaración de accesibilidad"],
    ]) {
      await go(page, route);
      await expect(page.locator("view-legal h1")).toHaveText(title);
      await expect(page.locator("view-legal [aria-current='page']")).toHaveCount(1);
    }
    await page.locator("#dropdownSubMenuLang").click();
    await page.locator("#changeLangToEnglish").click();
    await expect(page.locator("view-legal h1")).toHaveText("Accessibility statement");
  });

  // What Google Play asks of the page to delete an account: the steps, what is deleted and what is not, and how to ask
  // for it without getting in
  test("la página para borrar la cuenta dice cómo, qué se borra y qué no, y cómo pedirlo sin poder entrar", async ({ page }) => {
    await go(page, "/landing/delete-account");
    const text = page.locator("view-legal .legal-text");
    for (const heading of ["Desde THUMDER", "Si no puedes entrar", "Qué se borra", "Qué no se borra"]) {
      await expect(text.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    }
    await expect(text.getByRole("link", { name: "nonodev96@gmail.com" })).toHaveAttribute("href", /^mailto:nonodev96@gmail\.com\?subject=/);
    // Without accounts (no keys of Firebase) there is no sign-in to delete one
    await expect(page.locator("#legalSignInToDelete, #legalGoToDelete")).toHaveCount(0);
    // It is in the legal texts and in the page of THUMDER
    await expect(page.locator("view-legal [aria-current='page']")).toHaveText("Borrar la cuenta");
    await go(page, "/landing/about");
    // In its section of legal texts (folded)
    await expect(page.locator('#collapseOne_LEGAL a[href="/landing/delete-account"]')).toHaveCount(1);
  });
});

test.describe("Móvil como una app", () => {
  test("@movil la barra de arriba dice la vista; la de abajo tiene el estado y los controles de la simulación", async ({ page }) => {
    await go(page, "/auth/pipeline");
    await expect(page.locator(".main-header .navbar-page-title")).toHaveText("Pipeline");
    await expect(page).toHaveTitle("Pipeline | THUMDER");
    // The controls are only at the bottom (where the thumb reaches), with their names
    const dock = page.locator(".thumder-dock");
    await expect(dock).toBeVisible();
    await expect(page.locator(".main-header #simulationStep")).toHaveCount(0);
    await expect(dock.locator("#simulationStatus")).toContainText("Sin cargar");
    await loadAndStep(page, 3);
    await expect(dock.locator("#simulationStatus")).toContainText("Ciclo");
    await expect(dock.getByRole("button", { name: "Siguiente ciclo" })).toBeVisible();
    // The legal texts and the configuration are in «More»
    await page.locator("#navbarMore").tap();
    await expect(page.locator("#moreConsent")).toBeVisible();
    await expect(page.locator(".navbar-more-menu a[href='/auth/config']")).toBeVisible();
  });

  test("@movil la vista múltiple elige con chips las vistas que se ven, abiertas", async ({ page }) => {
    await go(page, "/auth/multiview");
    const chip = (name: string) => page.locator(`.multiview-chip[data-view="${name}"]`);
    await expect(chip("pipeline")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("view-pipeline .card")).not.toHaveClass(/collapsed-card/);
    await expect(page.locator("view-code")).toHaveCount(0);
    await chip("code").tap();
    await expect(chip("code")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("view-code .card")).toBeVisible();
    await chip("pipeline").tap();
    await expect(page.locator("view-pipeline")).toHaveCount(0);
    // The choice stays
    await page.reload();
    await expect(chip("code")).toHaveAttribute("aria-pressed", "true");
    await expect(chip("pipeline")).toHaveAttribute("aria-pressed", "false");
  });
});

test("cada vista dice en su cabecera para qué sirve, y la pestaña del navegador lleva su nombre", async ({ page }) => {
  await go(page, "/auth/cycle-clock-diagram");
  await expect(page.locator(".page-header-title")).toHaveText("Ciclos de reloj");
  await expect(page.locator(".page-header-help")).toContainText("por qué se detuvo");
  await expect(page).toHaveTitle("Ciclos de reloj | THUMDER");
  await go(page, "/");
  // Every view, with what it is for (the tools of development too, in the development build)
  await expect.poll(() => page.locator(".home-tile").count()).toBeGreaterThanOrEqual(14);
  await expect(page.locator(".home-tile", { hasText: "Ruta de datos" })).toContainText("adelantamientos");
});

test.describe("Notificaciones", () => {
  const above = async (page: import("@playwright/test").Page) => {
    const toast = (await page.locator(".thumder-toast").first().boundingBox()) as { y: number; height: number };
    const bar = (await page.locator(".thumder-dock, .main-footer").first().boundingBox()) as { y: number };
    return toast.y + toast.height <= bar.y;
  };

  test("salen sobre el pie, sin taparlo, y se cierran con su botón", async ({ page }) => {
    await go(page, "/auth/code");
    await page.locator("#simulationClear").click();
    const toast = page.locator(".thumder-toast", { hasText: "Máquina reiniciada" });
    await expect(toast).toBeVisible();
    await expect.poll(() => above(page)).toBe(true);
    await toast.getByRole("button", { name: "Cerrar" }).click();
    await expect(toast).toHaveCount(0);
  });

  test("@movil salen sobre la barra de abajo y se descartan deslizándolas con el dedo", async ({ page, context, browserName }) => {
    // The fingers are simulated with the protocol of Chrome (CDP): WebKit (iphone, ipad) has no equivalent
    test.skip(browserName !== "chromium", "touch gestures need CDP");
    await go(page, "/auth/code");
    await page.locator("#navbarMore").tap();
    await page.locator("#moreClear").tap();
    const toast = page.locator(".thumder-toast", { hasText: "Máquina reiniciada" });
    await expect(toast).toBeVisible();
    await expect.poll(() => above(page)).toBe(true);
    const box = (await toast.boundingBox()) as { x: number; y: number; width: number; height: number };
    const cdp = await context.newCDPSession(page);
    const touch = (type: string, points: { x: number; y: number }[]) =>
      cdp.send("Input.dispatchTouchEvent", { type, touchPoints: points.map((point, id) => ({ ...point, id })) });
    const [x, y] = [box.x + 40, box.y + box.height / 2];
    await touch("touchStart", [{ x, y }]);
    for (let i = 1; i <= 8; i++) await touch("touchMove", [{ x: x + i * 20, y }]);
    await touch("touchEnd", []);
    await expect(toast).toHaveCount(0);
  });
});
