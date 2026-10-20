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

test("la ayuda del diagrama de ciclos está en su pie, que se oculta y se queda oculto", async ({ page }) => {
  await go(page, "/auth/cycle-clock-diagram");
  const footer = page.locator("details.card-footer", { hasText: "Cómo moverse por el diagrama" });
  const help = footer.locator(".diagram-help");
  await expect(help).toBeVisible();
  await expect(help.locator("li")).toHaveCount(5);
  await footer.locator("summary").click();
  await expect(help).toBeHidden();
  // As the user left it, the next time
  await page.reload();
  await expect(page.locator("details.card-footer .diagram-help")).toBeHidden();
  await page.locator("details.card-footer summary").click();
  await expect(page.locator("details.card-footer .diagram-help")).toBeVisible();
});
