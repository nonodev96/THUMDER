import { readFileSync } from "node:fs";
import { createZip } from "../src/app/__core/services/file-system/zip";
import { expect, fileItem, go, storedFiles, test } from "./fixtures";

// The file manager as a guest (no account): the files in the browser (IndexedDB), readable names, import and export

const row = (page: import("@playwright/test").Page, name: string) => page.locator("tbody tr", { has: page.locator(".file-name", { hasText: new RegExp(`^${name.replace(/[()]/g, "\\$&")}$`) }) });

test.describe("gestor de ficheros", () => {
  test.use({ seed: { files: [fileItem("prim.s"), fileItem("bucle.s", "loop: j loop\n", "practica")], open: null, delay: 1, cookiesAnswered: true } });

  test("sin cuenta: entra directamente y los ficheros de antes pasan a IndexedDB", async ({ page }) => {
    await go(page, "/auth/file-manager");
    await expect(page).toHaveURL(/\/auth\/file-manager$/);
    await expect(page.locator(".file-manager-sync")).toContainText("En este navegador");
    await expect(row(page, "prim.s")).toBeVisible();
    await expect(row(page, "practica")).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("local_file_items"))).toBeNull();
    expect((await storedFiles(page)).map((file) => file.name).sort()).toEqual(["bucle.s", "practica", "prim.s"]);
  });

  test("los ficheros nuevos se llaman nuevo.s y nuevo (2).s, y siguen ahí al recargar", async ({ page }) => {
    await go(page, "/auth/file-manager");
    for (let i = 0; i < 2; i++) {
      await page.locator("#fileManagerNew").click();
      await page.getByRole("button", { name: "Programa DLX (.s)" }).click();
    }
    await expect(row(page, "nuevo.s")).toBeVisible();
    await expect(row(page, "nuevo (2).s")).toBeVisible();
    await page.reload();
    await expect(row(page, "nuevo (2).s")).toBeVisible();
  });

  test("una carpeta nueva no acepta un nombre repetido ni caracteres no válidos; renombrar y eliminar preguntan", async ({ page }) => {
    await go(page, "/auth/file-manager");
    await page.locator("#fileManagerNew").click();
    await page.getByRole("button", { name: "Nueva carpeta" }).click();
    const modal = page.locator("#fileManagerNameModal");
    const input = modal.locator("#fileManagerNameInput");
    await expect(input).toBeFocused();
    await input.fill("Practica");
    await expect(modal.locator("#fileManagerNameError")).toHaveText("Ya hay un elemento con ese nombre en esta carpeta.");
    await expect(modal.locator("#fileManagerNameConfirm")).toBeDisabled();
    await input.fill("a/b");
    await expect(modal.locator("#fileManagerNameError")).toContainText("no puede llevar");
    await input.fill("datos");
    await input.press("Enter");
    await expect(modal).toBeHidden();
    await expect(row(page, "datos")).toBeVisible();

    // Renaming a folder keeps what is inside it
    await row(page, "practica").click();
    await page.keyboard.press("F2");
    await expect(input).toHaveValue("practica");
    await input.fill("practica-1");
    await modal.locator("#fileManagerNameConfirm").click();
    await expect(row(page, "practica-1")).toBeVisible();
    await expect.poll(async () => (await storedFiles(page)).find((file) => file.name === "bucle.s")?.path).toBe("practica-1");

    // Deleting asks first, and the folder goes with its files
    await row(page, "practica-1").click();
    await page.keyboard.press("Delete");
    const confirm = page.locator("#fileManagerDeleteModal");
    await expect(confirm).toContainText("carpeta, con todo lo que contiene");
    await confirm.locator("#fileManagerDeleteConfirm").click();
    await expect(row(page, "practica-1")).toHaveCount(0);
    await expect.poll(async () => (await storedFiles(page)).map((file) => file.name).sort()).toEqual(["datos", "prim.s"]);
  });

  test("importa programas y .zip, y descarga un fichero y una carpeta", async ({ page }) => {
    await go(page, "/auth/file-manager");
    // A ZIP with a folder, made with the code of THUMDER (zip.ts runs in Node too)
    const zip = Buffer.from(await createZip([{ path: "curso/hola.s", content: "trap 0\n" }]).arrayBuffer());
    const files = [
      { name: "prim.s", mimeType: "text/plain", buffer: Buffer.from("; otro prim\n") },
      { name: "curso.zip", mimeType: "application/zip", buffer: zip },
    ];
    await page.locator("#fileManagerImportInput").setInputFiles(files);
    await expect(page.locator(".ngx-toastr", { hasText: "ficheros importados" })).toBeVisible();
    await expect(row(page, "prim (2).s")).toBeVisible();
    await expect(row(page, "curso")).toBeVisible();
    await expect.poll(async () => (await storedFiles(page)).find((file) => file.name === "hola.s")?.path).toBe("curso");

    const [single] = await Promise.all([page.waitForEvent("download"), (async () => {
      await row(page, "prim (2).s").locator(".dropdown-toggle").click();
      await row(page, "prim (2).s").getByRole("button", { name: "Descargar" }).click();
    })()]);
    expect(single.suggestedFilename()).toBe("prim (2).s");
    expect(readFileSync(await single.path(), "utf8")).toBe("; otro prim\n");

    await row(page, "practica").click();
    const [folder] = await Promise.all([page.waitForEvent("download"), page.locator("#fileManagerExport").click()]);
    expect(folder.suggestedFilename()).toBe("practica.zip");
    const bytes = readFileSync(await folder.path());
    // A ZIP (PK\x03\x04) with practica/bucle.s inside
    expect(bytes.subarray(0, 4).toString("hex")).toBe("504b0304");
    expect(bytes.includes(Buffer.from("practica/bucle.s"))).toBe(true);
  });
});
