import { defineConfig } from "vitest/config";

// The tests of the desktop application (src-electron/**/*.spec.ts): in Node, without Electron. They test the parts that
// do not need it (the settings, the theme, the menus, the translations, the sizes of the window, what the page sends);
// the window itself is tested by e2e/electron
export default defineConfig({
  test: {
    include: ["src-electron/**/*.spec.ts"],
    environment: "node",
  },
});
