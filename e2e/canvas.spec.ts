import { expect, go, loadAndStep, test } from "./fixtures";

// The canvases (PixiJS): zoom, dragging and pinching. `ng.getComponent` exists in the development build (ng serve).

const cycleScale = (page: import("@playwright/test").Page) =>
  page.evaluate(() => (window as any).ng.getComponent(document.querySelector("thumder-pixi-cycle-clock-diagram")).pApp.stage.scale.x as number);
/** What is visible of the diagram: how far it moved to the left and up, and how far it can go */
const cycleScroll = (page: import("@playwright/test").Page) =>
  page.evaluate(() => {
    const diagram = (window as any).ng.getComponent(document.querySelector("thumder-pixi-cycle-clock-diagram"));
    return { x: diagram.scrollX as number, y: diagram.scrollY as number, maxX: diagram.maxScrollX as number };
  });
const pipelineScale = (page: import("@playwright/test").Page) =>
  page.evaluate(() => (window as any).ng.getComponent(document.querySelector("thumder-pixi-pipeline")).pApp.stage.children[0].scale.x as number);

test("el pipeline se amplía con los botones y con Ctrl + rueda", async ({ page }) => {
  await go(page, "/auth/pipeline");
  const initial = await pipelineScale(page);
  await page.locator(".card-tools button:has(.fa-search-plus)").click();
  expect(await pipelineScale(page)).toBeGreaterThan(initial);
  const width = await page.locator("canvas").evaluate((canvas) => canvas.getBoundingClientRect().width);
  const cardWidth = await page.locator("thumder-pixi-pipeline").evaluate((host) => host.getBoundingClientRect().width);
  expect(width).toBeGreaterThan(cardWidth);
  await page.locator(".card-tools button:has(.fa-search)").click();
  expect(await pipelineScale(page)).toBe(initial);
  const box = await page.locator("canvas").boundingBox();
  await page.mouse.move((box?.x ?? 0) + 200, (box?.y ?? 0) + 200);
  await page.keyboard.down("Control");
  await page.mouse.wheel(0, 300);
  await page.keyboard.up("Control");
  await expect.poll(() => pipelineScale(page)).toBeLessThan(initial);
});

test("el diagrama de ciclos se amplía con los botones y con + - 0", async ({ page }) => {
  await go(page, "/auth/cycle-clock-diagram");
  const initial = await cycleScale(page);
  await page.locator(".card-tools button:has(.fa-search-plus)").click();
  const larger = await cycleScale(page);
  expect(larger).toBeGreaterThan(initial);
  await page.locator("canvas").click({ position: { x: 300, y: 200 } });
  await page.keyboard.press("-");
  await page.keyboard.press("-");
  expect(await cycleScale(page)).toBeLessThan(larger);
  await page.keyboard.press("0");
  expect(await cycleScale(page)).toBe(initial);
});

test("@movil el diagrama de ciclos se pellizca y se arrastra con el dedo", async ({ page, context }) => {
  await go(page, "/auth/cycle-clock-diagram");
  await loadAndStep(page, 30);
  const canvas = page.locator("canvas").first();
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  const [x, y] = [(box?.x ?? 0) + (box?.width ?? 0) * 0.6, (box?.y ?? 0) + 150];
  const cdp = await context.newCDPSession(page);
  const touch = (type: string, points: { x: number; y: number }[]) =>
    cdp.send("Input.dispatchTouchEvent", { type, touchPoints: points.map((point, id) => ({ ...point, id })) });

  // It follows the last cycle: the finger to the right shows the previous ones, and back to the left the last ones again
  const before = await cycleScroll(page);
  expect(before.x).toBeGreaterThan(0);
  expect(before.x).toBe(before.maxX);
  await touch("touchStart", [{ x: x - 150, y }]);
  for (let i = 1; i <= 10; i++) await touch("touchMove", [{ x: x - 150 + i * 15, y: y + i * 8 }]);
  await touch("touchEnd", []);
  const after = await cycleScroll(page);
  expect(after.x).toBeLessThan(before.x);
  expect(after.y).toBeLessThanOrEqual(before.y);
  await touch("touchStart", [{ x, y }]);
  for (let i = 1; i <= 10; i++) await touch("touchMove", [{ x: x - i * 15, y }]);
  await touch("touchEnd", []);
  expect((await cycleScroll(page)).x).toBeGreaterThan(after.x);

  const initial = await cycleScale(page);
  await touch("touchStart", [{ x: x - 30, y }, { x: x + 30, y }]);
  for (let d = 40; d <= 100; d += 10) await touch("touchMove", [{ x: x - d, y }, { x: x + d, y }]);
  await touch("touchEnd", []);
  expect(await cycleScale(page)).toBeGreaterThan(initial * 1.5);
});

test("el diagrama de ciclos se mueve con el teclado solo cuando tiene el foco, y sigue al último ciclo", async ({ page }) => {
  await go(page, "/auth/cycle-clock-diagram");
  await loadAndStep(page, 30);
  const canvas = page.locator("thumder-pixi-cycle-clock-diagram canvas");
  await expect(canvas).toHaveAttribute("aria-label", /.+/);
  const end = await cycleScroll(page);
  expect(end.x).toBeGreaterThan(0);
  expect(end.x).toBe(end.maxX);

  // Without the focus, the arrows do not move it
  await page.keyboard.press("ArrowLeft");
  expect((await cycleScroll(page)).x).toBe(end.x);

  await canvas.focus();
  await page.keyboard.press("ArrowLeft");
  expect((await cycleScroll(page)).x).toBeLessThan(end.x);
  await page.keyboard.press("Home");
  expect(await cycleScroll(page)).toMatchObject({ x: 0, y: 0 });
  // Back at the start, a new cycle does not move it
  await canvas.blur();
  await page.locator("button[title$='(F10)']").click();
  expect((await cycleScroll(page)).x).toBe(0);
  await canvas.focus();
  await page.keyboard.press("End");
  const last = await cycleScroll(page);
  expect(last.x).toBe(last.maxX);
  // At the end again, it follows the new cycles
  await canvas.blur();
  await page.locator("button[title$='(F10)']").click();
  await expect.poll(async () => (await cycleScroll(page)).x).toBeGreaterThan(last.x);
});

test("@movil el pipeline se desplaza en horizontal con el dedo", async ({ page, context }) => {
  await go(page, "/auth/pipeline");
  const host = page.locator("thumder-pixi-pipeline");
  await host.scrollIntoViewIfNeeded();
  const box = (await host.boundingBox()) as { x: number; y: number; width: number; height: number };
  expect(await host.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeGreaterThan(50);
  const cdp = await context.newCDPSession(page);
  const touch = (type: string, points: { x: number; y: number }[]) =>
    cdp.send("Input.dispatchTouchEvent", { type, touchPoints: points.map((point, id) => ({ ...point, id })) });
  const [x, y] = [box.x + box.width - 30, box.y + 100];
  await touch("touchStart", [{ x, y }]);
  for (let i = 1; i <= 12; i++) await touch("touchMove", [{ x: x - i * 20, y }]);
  await touch("touchEnd", []);
  await expect.poll(() => host.evaluate((element) => element.scrollLeft)).toBeGreaterThan(100);
});
