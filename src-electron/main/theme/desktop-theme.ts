// Linux: whether the desktop says it is dark in a way Chromium does not read (the theme of the panels of Cinnamon, the
// themes of GNOME and MATE), with `gsettings`. Without gsettings the theme of the desktop is the one Chromium sees.
import { type ChildProcess, execFile, spawn } from "node:child_process";

interface DesktopKey {
  readonly schema: string;
  readonly key: string;
  readonly dark: (value: string) => boolean;
}

const preferDark = (value: string) => value.includes("prefer-dark");
const darkName = (value: string) => /dark/i.test(value);

/** The settings of the desktops of Linux that say it is dark: the preference of dark applications, and the themes */
export const DESKTOP_KEYS: readonly DesktopKey[] = [
  { schema: "org.gnome.desktop.interface", key: "color-scheme", dark: preferDark },
  { schema: "org.x.apps.portal", key: "color-scheme", dark: preferDark },
  { schema: "org.gnome.desktop.interface", key: "gtk-theme", dark: darkName },
  { schema: "org.cinnamon.desktop.interface", key: "gtk-theme", dark: darkName },
  { schema: "org.cinnamon.theme", key: "name", dark: darkName },
  { schema: "org.mate.interface", key: "gtk-theme", dark: darkName },
];

/** A value of gsettings, or "" when the desktop does not have it */
export type ReadSetting = (schema: string, key: string) => Promise<string>;

const gsettings: ReadSetting = (schema, key) =>
  new Promise((resolve) => {
    execFile("gsettings", ["get", schema, key], { timeout: 2000 }, (error, stdout) => resolve(error ? "" : stdout.trim()));
  });

/** Whether any setting of the desktop says it is dark */
export async function readDesktopDark(read: ReadSetting = gsettings): Promise<boolean> {
  const values = await Promise.all(DESKTOP_KEYS.map(({ schema, key }) => read(schema, key)));
  return DESKTOP_KEYS.some(({ dark }, index) => values[index] !== "" && dark(values[index]));
}

/**
 * The theme of the desktop changes while THUMDER is open (`gsettings monitor`, one process for each schema): it calls
 * `onChange` with whether it is dark now. It returns what stops watching
 */
export function watchDesktopTheme(onChange: (dark: boolean) => void, read: ReadSetting = gsettings): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const changed = () => {
    if (timer !== undefined) clearTimeout(timer);
    // A change of theme changes several keys at once
    timer = setTimeout(async () => onChange(await readDesktopDark(read)), 300);
  };
  const monitors: ChildProcess[] = [];
  for (const schema of new Set(DESKTOP_KEYS.map(({ schema }) => schema))) {
    try {
      const monitor = spawn("gsettings", ["monitor", schema], { stdio: ["ignore", "pipe", "ignore"] });
      monitor.on("error", () => undefined);
      monitor.stdout?.on("data", changed);
      monitors.push(monitor);
    } catch {
      // Without gsettings there is nothing to watch
    }
  }
  return () => {
    if (timer !== undefined) clearTimeout(timer);
    for (const monitor of monitors) monitor.kill();
  };
}
