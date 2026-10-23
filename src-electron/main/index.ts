// The main process of the desktop application (Electron): `package.json` → dist-electron/main/index.js
import { app } from "electron";
import { startThumder } from "./app";
import { resolveEnvironment } from "./environment";

const environment = resolveEnvironment({
  argv: process.argv.slice(1),
  appPath: app.getAppPath(),
  mainDir: __dirname,
  platform: process.platform,
});

// A single THUMDER installed: opening it again shows the window that is open (not while developing, nor in the tests)
if (app.isPackaged && !app.requestSingleInstanceLock()) {
  app.quit();
} else {
  startThumder(environment).catch((error: unknown) => {
    console.error("THUMDER could not start", error);
    app.exit(1);
  });
}
