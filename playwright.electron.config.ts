import { defineConfig } from "@playwright/test";

// The desktop application: `pnpm e2e:electron` builds it (build:prod) and opens it with Playwright. On Linux without a
// screen it needs a virtual one: `xvfb-run -a pnpm e2e:electron`.
export default defineConfig({
  testDir: "e2e/electron",
  workers: 1,
  timeout: 120_000,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { trace: "retain-on-failure" },
});
