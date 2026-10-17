import { readFileSync } from "node:fs";
import { test as base, expect, type Page } from "@playwright/test";

// What every e2e test starts with: THUMDER in local mode with some DLX programs in the file manager, the privacy banner
// answered, and a check at the end that the page had no errors.

/** A program of src/assets/examples-dlx (for example "prim.s" or "ejemplos/15-hanoi.s") */
export const example = (path: string) => readFileSync(`src/assets/examples-dlx/${path}`, "utf8");

/** A file of the file manager, as the versions before IndexedDB kept it (THUMDER moves it to IndexedDB when it starts) */
export function fileItem(name: string, content = example(name), path = "") {
  return {
    $key: `k-${name}`,
    content,
    dataItem: null,
    dateModified: 0,
    description: "",
    e1_uid: "local",
    f_id: "",
    hasSubDirectories: false,
    isDirectory: false,
    key: `key-${name}`,
    name: name.split("/").pop() as string,
    path,
    pathKeys: path ? path.split("/") : [],
    size: content.length,
    thumbnail: "",
  };
}

type Seed = {
  /** The files of the file manager */
  files: ReturnType<typeof fileItem>[];
  /** The one open in the editor (and the one the simulator loads) */
  open: string | null;
  /** Milliseconds between cycles when running */
  delay: number;
  /** Whether the user already answered the privacy banner */
  cookiesAnswered: boolean;
  /** The breakpoints of the editor, by line (false: removed) */
  breakpoints?: Record<string, boolean>;
};

export const test = base.extend<{ seed: Seed; pageErrors: string[] }>({
  seed: [
    { files: [fileItem("prim.s"), fileItem("gcm.s"), fileItem("input.s")], open: "prim.s", delay: 1, cookiesAnswered: true },
    { option: true },
  ],

  // Every test: no errors in the page
  pageErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await use(errors);
      expect(errors, "errores en la página").toEqual([]);
    },
    { auto: true },
  ],

  page: async ({ page, context, seed }, use) => {
    await context.addInitScript((seed) => {
      // Only the first time: later navigations keep what the application changed
      if (sessionStorage.getItem("e2e-seeded")) return;
      sessionStorage.setItem("e2e-seeded", "1");
      // The privacy banner answered with «only what is needed» (ConsentService)
      if (seed.cookiesAnswered) {
        localStorage.setItem(
          "thumder_consent",
          JSON.stringify({ analytics: false, errors: false, version: 1, date: "2026-01-01T00:00:00.000Z" }),
        );
      }
      localStorage.setItem("local_file_items", JSON.stringify(seed.files));
      const open = seed.files.find((file) => file.name === seed.open);
      if (open) localStorage.setItem("interfaceFileItem", JSON.stringify(open));
      // The configuration of THUMDER (src/app/__core/config/config.ts): the rest takes its default value
      localStorage.setItem("thumder_configuration", JSON.stringify({ version: 1, delay: seed.delay }));
      if (seed.breakpoints) localStorage.setItem("breakpoints", JSON.stringify(seed.breakpoints));
    }, seed);
    await use(page);
  },
});

export { expect };

/** Opens a route and waits until Angular has drawn it */
export async function go(page: Page, route: string): Promise<void> {
  await page.goto(route);
  await page.waitForLoadState("networkidle");
  await page.locator(".content-wrapper, app-page-not-found").first().waitFor();
}

/** The left edge and the width of the sidebar (negative left: hidden) */
export const sidebarBox = (page: Page) =>
  page.evaluate(() => {
    const box = document.querySelector(".main-sidebar")?.getBoundingClientRect();
    return { left: Math.round(box?.left ?? 0), width: Math.round(box?.width ?? 0) };
  });

/** The button of the navbar that opens and folds the sidebar */
export const sidebarToggle = (page: Page) => page.locator("nav.main-header button:has(.fa-bars)");

/** The simulation controls of the navbar */
export const controls = (page: Page) => ({
  load: page.locator("button[title*='Shift+F5']"),
  run: page.locator("button[title*='(F5)']"),
  step: page.locator("button[title$='(F10)']"),
});

/** How many cycles the diagram has: one more with each cycle (the first one is the cycle 0) */
const cycles = (page: Page) =>
  // biome-ignore lint/suspicious/noExplicitAny: the debugging API of Angular has no types here
  page.evaluate(() => (window as any).ng.getComponent(document.querySelector("thumder-auth-navbar")).machine.diagram.cycles as number);

/** Loads the program open in the editor and runs `count` cycles, one by one (each one waits for the previous to arrive) */
export async function loadAndStep(page: Page, count: number): Promise<void> {
  const { load, step } = controls(page);
  await load.click();
  await expect(step).toBeEnabled();
  const first = await cycles(page);
  for (let i = 1; i <= count; i++) {
    await step.click();
    await page.waitForFunction(
      // biome-ignore lint/suspicious/noExplicitAny: the debugging API of Angular has no types here
      (target) => (window as any).ng.getComponent(document.querySelector("thumder-auth-navbar")).machine.diagram.cycles >= target,
      first + i,
      { polling: "raf", timeout: 5_000 },
    );
  }
}

/** MachineService of the page (development build: `ng.getComponent`) */
export const machineState = (page: Page) =>
  page.evaluate(() => {
    // biome-ignore lint/suspicious/noExplicitAny: the debugging API of Angular has no types here
    const state = (window as any).ng.getComponent(document.querySelector("thumder-auth-navbar")).machine.state;
    return {
      running: state.running() as boolean,
      complete: state.complete() as boolean,
      canSimulate: state.canSimulate() as boolean,
      step: state.step() as number,
      line: state.line() as number,
      pipeline: JSON.stringify(state.pipeline()),
    };
  });

/** The files of the file manager, as they are in the browser (IndexedDB "thumder", store "files") */
export const storedFiles = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<{ key: string; name: string; path: string; isDirectory: boolean; content: string; dateModified: number }[]>(
        (resolve, reject) => {
          const request = indexedDB.open("thumder");
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains("files")) {
              db.close();
              resolve([]);
              return;
            }
            const all = db.transaction("files").objectStore("files").getAll();
            all.onsuccess = () => {
              db.close();
              resolve(all.result);
            };
            all.onerror = () => reject(all.error);
          };
        },
      ),
  );
