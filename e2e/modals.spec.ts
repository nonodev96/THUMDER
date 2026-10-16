import { expect, go, test } from "./fixtures";

// The modals (ModalService): backdrop, Escape, click outside, focus

test("«Editar registro»: fondo, foco dentro, Escape, la X y un clic fuera la cierran; el foco vuelve al botón", async ({ page }) => {
  await go(page, "/auth/registers");
  const modal = page.locator("#modal-EditRegister");
  const opener = page.locator("#modal-EditRegister-Button");

  await opener.focus();
  await page.keyboard.press("Enter");
  await expect(modal).toBeVisible();
  await expect(page.locator(".modal-backdrop")).toHaveCount(1);
  await expect(page.locator("body")).toHaveClass(/modal-open/);
  expect(await modal.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(modal).toBeHidden();
  await expect(opener).toBeFocused();
  await expect(page.locator(".modal-backdrop")).toHaveCount(0);

  await opener.click();
  await modal.locator(".close").click();
  await expect(modal).toBeHidden();
  await expect(page.locator("body")).not.toHaveClass(/modal-open/);

  await opener.click();
  await expect(modal).toBeVisible();
  await page.mouse.click(15, 450);
  await expect(modal).toBeHidden();
});

test("«Editar memoria» abre y la X la cierra", async ({ page }) => {
  await go(page, "/auth/memory");
  await page.locator("#editMemoryModalButton").click();
  await expect(page.locator("#editMemoryModal")).toBeVisible();
  await page.locator("#editMemoryModal .close").click();
  await expect(page.locator("#editMemoryModal")).toBeHidden();
});

test("la información del diagrama de ciclos abre y su botón la cierra", async ({ page }) => {
  await go(page, "/auth/cycle-clock-diagram");
  await page.locator("app-modal > button").first().click();
  const modal = page.locator("#modal-info-pixi-id");
  await expect(modal).toBeVisible();
  await modal.locator(".modal-footer button.btn-default").click();
  await expect(modal).toBeHidden();
});
