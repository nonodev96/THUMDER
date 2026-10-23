import { _electron as electron, expect, type TestInfo, test } from "@playwright/test";
import electronPath from "electron";

// THUMDER as a desktop application: it loads dist/browser with file://, the page has no Node.js and the interface works
// without a server

/** THUMDER with its own data in the folder of the test: the settings and the files of the developer are not touched */
function launch(testInfo: TestInfo) {
  // This variable turns Electron into Node.js: never for the application
  const env = { ...process.env } as Record<string, string>;
  delete env.ELECTRON_RUN_AS_NODE;
  const data = testInfo.outputPath("user-data");
  return electron.launch({ executablePath: electronPath as unknown as string, args: [".", `--user-data-dir=${data}`], env });
}

test("la aplicación de escritorio arranca segura y su interfaz funciona", async ({}, testInfo) => {
  const app = await launch(testInfo);
  const page = await app.firstWindow();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  await page.waitForLoadState("load");
  await page.locator(".main-sidebar").waitFor();

  expect(page.url()).toMatch(/^file:/);
  expect(
    await page.evaluate(() => ({ jQuery: typeof (window as any).jQuery, bridge: typeof (window as any).thumder, require: typeof (window as any).require })),
  ).toEqual({ jQuery: "undefined", bridge: "object", require: "undefined" });

  // Sidebar
  const width = () => page.evaluate(() => Math.round(document.querySelector(".main-sidebar")?.getBoundingClientRect().width ?? 0));
  const wide = await width();
  await page.locator("nav.main-header button:has(.fa-bars)").click();
  await expect.poll(width).toBeLessThan(wide);
  await page.locator("nav.main-header button:has(.fa-bars)").click();
  await expect.poll(width).toBe(wide);

  // A card, navigating with the sidebar (routes cannot be opened directly with file://)
  await page.locator(".main-sidebar a", { hasText: /Código|Code/ }).first().click();
  const card = page.locator("#Code-card");
  await card.locator(".card-tools button:has(.fa-minus)").click();
  await expect(card).toHaveClass(/collapsed-card/);
  await card.locator(".card-tools button:has(.fa-plus)").click();

  // A modal and the dropdown of the language
  await page.locator(".main-sidebar a", { hasText: /Registros|Registers/ }).first().click();
  await page.locator("#modal-EditRegister-Button").click();
  await expect(page.locator("#modal-EditRegister")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#modal-EditRegister")).toBeHidden();
  await page.locator("#dropdownSubMenuLang").click();
  await expect(page.locator("#changeLangToEnglish")).toBeVisible();
  await page.keyboard.press("Escape");

  // The file manager keeps the files in IndexedDB, also with file://: the first time, the two classic programs
  await page.locator(".main-sidebar a", { hasText: /Gestor de ficheros|File manager/ }).first().click();
  await expect(page.locator(".file-name", { hasText: /^prim\.s$/ })).toBeVisible();
  await page.locator("#fileManagerNew").click();
  await page.getByRole("button", { name: /Programa DLX|DLX program/ }).click();
  await expect(page.locator(".file-name", { hasText: /^(nuevo|new)\.s$/ })).toBeVisible();

  // The simulator runs in its Web Worker
  expect(page.workers().length).toBeGreaterThan(0);
  expect(errors).toEqual([]);
  await app.close();
});

test("la ventana es de escritorio: la barra de navegación es la de título, con el tema y el menú de THUMDER", async ({}, testInfo) => {
  const app = await launch(testInfo);
  const page = await app.firstWindow();
  await page.waitForLoadState("load");
  await page.locator(".main-sidebar").waitFor();

  const main = () =>
    app.evaluate(({ BrowserWindow, Menu, nativeTheme }) => {
      const window = BrowserWindow.getAllWindows()[0];
      return {
        visible: window.isVisible(),
        background: window.getBackgroundColor(),
        themeSource: nativeTheme.themeSource,
        menu: Menu.getApplicationMenu()?.items.map((item) => item.label) ?? [],
      };
    });

  // Windows and Linux: no native title bar; the buttons of the window are over the right of the navbar
  if (process.platform !== "darwin") {
    expect(await page.evaluate(() => document.documentElement.classList.contains("thumder-titlebar"))).toBe(true);
    const overlay = await page.evaluate(() => navigator.windowControlsOverlay?.getTitlebarAreaRect?.());
    expect(overlay?.width).toBeLessThan(await page.evaluate(() => innerWidth));
    // The buttons of the window are as high as the navbar, and nothing of the navbar is under them
    const navbar = await page.evaluate(() => Math.floor(document.querySelector(".main-header")?.getBoundingClientRect().height ?? 0) - 1);
    await expect.poll(() => page.evaluate(() => navigator.windowControlsOverlay?.getTitlebarAreaRect?.().height)).toBe(navbar);
    const hidden = await page.evaluate(() => {
      const limit = navigator.windowControlsOverlay?.getTitlebarAreaRect?.().width ?? innerWidth;
      return [...document.querySelectorAll<HTMLElement>(".main-header button, .main-header a")]
        .filter((element) => element.offsetParent !== null && element.getBoundingClientRect().right > limit + 1)
        .map((element) => element.id || element.textContent?.trim());
    });
    expect(hidden).toEqual([]);

    // A card that fills the window starts under the navbar: its buttons are not under those of the window, and the
    // navbar is still the title bar, with its menus over the card
    await page.locator(".main-sidebar a", { hasText: /Registros|Registers/ }).first().click();
    const card = page.locator("#registersCard");
    await card.locator(".card-tools button:has(.fa-expand)").click();
    await expect(card).toHaveClass(/maximized-card/);
    const layout = () =>
      page.evaluate(() => {
        const rect = (selector: string) => document.querySelector(selector)?.getBoundingClientRect() ?? new DOMRect();
        const over = (selector: string, inside: string) => {
          const { x, y, width, height } = rect(selector);
          return document.elementFromPoint(x + width / 2, y + height / 2)?.closest(inside) !== null;
        };
        const tools = [...document.querySelectorAll("#registersCard .card-tools button")].map((button) => button.getBoundingClientRect().top);
        return {
          navbar: rect(".main-header").bottom,
          card: rect("#registersCard").top,
          bottom: rect("#registersCard").bottom <= innerHeight + 1,
          tools: Math.min(...tools),
          windowButtons: navigator.windowControlsOverlay?.getTitlebarAreaRect?.().height ?? 0,
          navbarOnTop: over("#dropdownTheme", ".main-header"),
        };
      });
    const maximized = await layout();
    expect(maximized.card).toBeGreaterThanOrEqual(maximized.navbar - 1);
    expect(maximized.tools).toBeGreaterThanOrEqual(maximized.windowButtons);
    expect(maximized.bottom).toBe(true);
    expect(maximized.navbarOnTop).toBe(true);
    await page.locator("#dropdownTheme").click();
    await expect(page.locator("#theme-dark")).toBeVisible();
    expect(
      await page.evaluate(() => {
        const { x, y, width, height } = document.querySelector("#theme-dark")?.getBoundingClientRect() ?? new DOMRect();
        return document.elementFromPoint(x + width / 2, y + height / 2)?.closest(".main-header") !== null;
      }),
    ).toBe(true);
    await page.keyboard.press("Escape");
    await card.locator(".card-tools button:has(.fa-compress)").click();
    await expect(card).not.toHaveClass(/maximized-card/);
  }

  // The menu of THUMDER, not the one of Electron
  const menu = (await main()).menu;
  expect(menu).not.toContain("File");
  expect(menu.length).toBeGreaterThanOrEqual(4);

  // The theme chosen in THUMDER goes to the window: its colour and its native parts
  await page.locator("#dropdownTheme").click();
  await page.locator("#theme-dark").click();
  await expect.poll(async () => (await main()).themeSource).toBe("dark");
  expect((await main()).background).toBe("#0F172A");
  await page.locator("#dropdownTheme").click();
  await page.locator("#theme-light").click();
  await expect.poll(async () => (await main()).themeSource).toBe("light");
  expect((await main()).background).toBe("#F1F5F9");
  await page.locator("#dropdownTheme").click();
  await page.locator("#theme-system").click();
  await expect.poll(async () => (await main()).themeSource).not.toBe("light");

  // The language of THUMDER is the one of the menu
  await page.locator("#dropdownSubMenuLang").click();
  await page.locator("#changeLangToSpanish").click();
  await expect.poll(async () => (await main()).menu).toContain("Ayuda");
  await page.locator("#dropdownSubMenuLang").click();
  await page.locator("#changeLangToEnglish").click();
  await expect.poll(async () => (await main()).menu).toContain("Help");

  expect((await main()).visible).toBe(true);
  await app.close();
});
