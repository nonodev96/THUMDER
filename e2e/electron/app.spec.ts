import { _electron as electron, expect, test } from "@playwright/test";
import electronPath from "electron";

// THUMDER as a desktop application: it loads dist/browser with file://, the page has no Node.js and the interface works
// without a server

test("la aplicación de escritorio arranca segura y su interfaz funciona", async () => {
  // This variable turns Electron into Node.js: never for the application
  const env = { ...process.env } as Record<string, string>;
  delete env.ELECTRON_RUN_AS_NODE;
  const app = await electron.launch({ executablePath: electronPath as unknown as string, args: ["."], env });
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
