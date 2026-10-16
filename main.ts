import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";
import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  Notification,
  type NotificationConstructorOptions,
  nativeImage,
  screen,
  shell,
  Tray,
} from "electron";

let win: BrowserWindow = null;
const args = process.argv.slice(1);
const isServe = args.some((val) => val === "--serve");

// The Angular application, built by `ng build` into dist/browser
const DEV_SERVER_URL = "http://localhost:4200";
const APP_URL = isServe
  ? DEV_SERVER_URL
  : url.format({
      pathname: path.join(__dirname, "dist", "browser", "index.html"),
      protocol: "file:",
      slashes: true,
    });

const EXTERNAL_PROTOCOLS = ["https:", "http:", "mailto:"];

function isExternal(link: string): boolean {
  try {
    return EXTERNAL_PROTOCOLS.includes(new URL(link).protocol);
  } catch {
    return false;
  }
}

function isApp(link: string): boolean {
  return isServe ? link.startsWith(DEV_SERVER_URL) : link.startsWith("file:");
}

function createWindow(): BrowserWindow {
  const size = screen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: size.width,
    height: size.height,
    minWidth: 400,
    minHeight: 400,
    webPreferences: {
      // The page has no access to Node.js: it only gets what preload.ts exposes
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  // Links to other sites open in the browser of the system, never inside THUMDER
  win.webContents.setWindowOpenHandler(({ url: link }) => {
    if (isExternal(link)) void shell.openExternal(link);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (event, link) => {
    if (isApp(link)) return;
    event.preventDefault();
    if (isExternal(link)) void shell.openExternal(link);
  });

  if (isServe) {
    win.webContents.openDevTools();
    // The page reloads by itself with `ng serve`; when main.js or preload.js change (tsc), Electron starts again
    for (const file of ["main.js", "preload.js"]) {
      fs.watch(path.join(__dirname, file), () => {
        app.relaunch();
        app.exit(0);
      });
    }
  }
  void win.loadURL(APP_URL);

  // Emitted when the window is closed.
  win.on("closed", () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  return win;
}

try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  app.on("ready", () => setTimeout(createWindow, 400));

  let tray = null;
  let alwaysOnTop = false;
  app.whenReady().then(() => {
    const image = nativeImage.createFromPath(path.join(__dirname, "dist", "browser", "assets", "icons", "faviconWhite.512x512.png"));
    tray = new Tray(image.resize({ width: 20, height: 20 }));
    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Always on top",
        type: "checkbox",
        checked: alwaysOnTop,
        click: () => {
          alwaysOnTop = !alwaysOnTop;
          if (win != null) win.setAlwaysOnTop(alwaysOnTop);
        },
      },
      { type: "separator" },
      {
        label: "Reload app",
        click: async () => {
          await win?.loadURL(APP_URL);
        },
      },
    ]);
    tray.setToolTip("THUMDER");
    tray.setContextMenu(contextMenu);
  });

  // Quit when all windows are closed.
  app.on("window-all-closed", () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("activate", () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });

  ipcMain.handle("thumder-open-external", async (_event, link: unknown) => {
    if (typeof link === "string" && isExternal(link)) await shell.openExternal(link);
  });

  ipcMain.on("thumder-notification", (_$event, _args) => {
    const options: NotificationConstructorOptions = {
      title: "THUMDER",
      body: "Notifications are working",
      silent: false,
    };
    const customNotification = new Notification(options);
    customNotification.show();
  });
} catch (error) {
  console.error(error);
  // Catch Error
  // throw e;
}
