import { defineConfig, devices } from "@playwright/test";

// The e2e tests of THUMDER in the browser (`pnpm e2e`). They start `ng serve` themselves, or use the one running on 4200.
// The tests of the desktop application (Electron) have their own configuration: playwright.electron.config.ts.
export default defineConfig({
  testDir: "e2e",
  testIgnore: "electron/**",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  timeout: 60_000,
  use: {
    baseURL: "http://127.0.0.1:4200",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    // Tests for one size are tagged: @movil, @tableta. The rest are for desktops.
    { name: "escritorio", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } }, grepInvert: /@movil|@tableta/ },
    { name: "movil", use: { ...devices["Pixel 7"] }, grep: /@movil/ },
    {
      name: "tableta",
      use: { ...devices["Desktop Chrome"], viewport: { width: 820, height: 1180 }, isMobile: true, hasTouch: true },
      grep: /@tableta/,
    },
  ],
  webServer: {
    command: "pnpm exec ng serve --configuration dev --port 4200 --host 127.0.0.1",
    url: "http://127.0.0.1:4200",
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
