import {
  DEFAULT_AUTO_SAVE_CONFIGURATION,
  DEFAULT_ENABLED_FORWARDING_CONFIGURATION,
  DEFAULT_FLOATING_POINT_STAGE_CONFIGURATION,
  DEFAULT_MEMORY_SIZE_CONFIGURATION,
  DEFAULT_MULTIVIEW_CONFIGURATION,
  DEFAULT_TIME_SIMULATION_CONFIGURATION,
} from "@app/CONSTANTS";
import type { TypeFloatingPointStageConfiguration, TypeMultiviewConfiguration, TypeWindowGeometry } from "@app/Types";

/** The configuration of THUMDER, saved under one key with its version (CONFIG_KEY) */
export type ThumderConfig = {
  version: typeof CONFIG_VERSION;
  /** Forwarding of results between the stages of the pipeline */
  forwarding: boolean;
  /** The floating point units: how many of each kind and their cycles */
  floatingPoint: TypeFloatingPointStageConfiguration;
  /** The size of the memory in bytes */
  memorySize: number;
  /** The milliseconds between two cycles when the simulation runs */
  delay: number;
  /** Save the file when the editor is closed */
  autoSave: boolean;
  /** The windows of the multiview and their order */
  multiview: TypeMultiviewConfiguration;
  /** The windows of the multiview that float over it, with their place and size; the order is the one of the pile */
  windows: Record<string, TypeWindowGeometry>;
  /** How many cycles the cycle clock diagram keeps (WinDLX: the history of the diagram); the oldest ones go */
  diagramHistory: number;
};

export const CONFIG_KEY = "thumder_configuration";
export const CONFIG_VERSION = 1;

/** The limits of WinDLX: 1 to 8 units of each kind and 1 to 50 cycles; 512 bytes to 1 MB of memory, a multiple of 8 */
export const LIMITS = {
  units: { min: 1, max: 8 },
  cycles: { min: 1, max: 50 },
  memorySize: { min: 512, max: 1048576 },
  delay: { min: 0, max: 10000 },
  diagramHistory: { min: 100, max: 100000 },
  windowPlace: { min: -10000, max: 100000 },
  windowSize: { min: 120, max: 10000 },
} as const;

/** The cycles the diagram keeps by default: enough for the examples, and light for long runs */
export const DEFAULT_DIAGRAM_HISTORY = 2000;

/** The parts of the configuration the simulator uses: changing them loads the program again */
export const MACHINE_KEYS = ["forwarding", "floatingPoint", "memorySize"] as const satisfies readonly (keyof ThumderConfig)[];

/** The keys of each part before version 1 (one key of localStorage each) */
const OLD_KEYS = {
  forwarding: "enabled_forwarding_configuration",
  floatingPoint: "floating_point_stage_configuration",
  memorySize: "memory_size_configuration",
  delay: "time_simulation_configuration",
  autoSave: "auto_save_configuration",
  multiview: "multiview_configuration",
} as const;

export const UNITS = ["addition", "multiplication", "division"] as const;

export function defaultConfig(): ThumderConfig {
  return {
    version: CONFIG_VERSION,
    forwarding: DEFAULT_ENABLED_FORWARDING_CONFIGURATION,
    floatingPoint: structuredClone(DEFAULT_FLOATING_POINT_STAGE_CONFIGURATION),
    memorySize: DEFAULT_MEMORY_SIZE_CONFIGURATION,
    delay: DEFAULT_TIME_SIMULATION_CONFIGURATION,
    autoSave: DEFAULT_AUTO_SAVE_CONFIGURATION,
    multiview: structuredClone(DEFAULT_MULTIVIEW_CONFIGURATION),
    windows: {},
    diagramHistory: DEFAULT_DIAGRAM_HISTORY,
  };
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

/** An integer between min and max, or the fallback when it is not a number */
function clamp(value: unknown, { min, max }: { min: number; max: number }, fallback: number): number {
  const number = Math.round(typeof value === "string" ? Number.parseFloat(value) : Number(value));
  return typeof value !== "boolean" && value !== null && value !== "" && Number.isFinite(number)
    ? Math.min(max, Math.max(min, number))
    : fallback;
}

/** The windows of the multiview: the known ones, each one once, and the missing ones at the end of the second column */
function validateMultiview(value: unknown): TypeMultiviewConfiguration {
  const defaults = defaultConfig().multiview;
  if (!isObject(value)) return defaults;
  const known = [...defaults.list_1, ...defaults.list_2];
  const seen = new Set<string>();
  const list = (raw: unknown): string[] => {
    const names: string[] = [];
    for (const name of Array.isArray(raw) ? raw : []) {
      if (typeof name !== "string" || !known.includes(name) || seen.has(name)) continue;
      seen.add(name);
      names.push(name);
    }
    return names;
  };
  const list_1 = list(value.list_1);
  const list_2 = list(value.list_2);
  list_2.push(...known.filter((name) => !seen.has(name)));
  const multiview = { ...defaults, list_1, list_2 } as TypeMultiviewConfiguration;
  for (const name of known) multiview[name] = typeof value[name] === "boolean" ? value[name] : defaults[name];
  return multiview;
}

/** The floating windows: only the windows of the multiview, each one once, with whole numbers in their limits */
function validateWindows(value: unknown, multiview: TypeMultiviewConfiguration): Record<string, TypeWindowGeometry> {
  const known = [...multiview.list_1, ...multiview.list_2];
  const windows: Record<string, TypeWindowGeometry> = {};
  if (!isObject(value)) return windows;
  for (const [name, raw] of Object.entries(value)) {
    if (!known.includes(name) || !isObject(raw)) continue;
    windows[name] = {
      x: clamp(raw.x, LIMITS.windowPlace, 0),
      y: clamp(raw.y, LIMITS.windowPlace, 0),
      width: clamp(raw.width, LIMITS.windowSize, 480),
      height: clamp(raw.height, LIMITS.windowSize, 360),
    };
  }
  return windows;
}

/** Any value (what was saved, by any version, or edited by hand) as a valid configuration: what is wrong takes the default */
export function validateConfig(value: unknown): ThumderConfig {
  const defaults = defaultConfig();
  const raw = isObject(value) ? value : {};
  const floatingPoint = structuredClone(defaults.floatingPoint);
  const rawUnits = isObject(raw.floatingPoint) ? raw.floatingPoint : {};
  for (const unit of UNITS) {
    const rawUnit = isObject(rawUnits[unit]) ? rawUnits[unit] : {};
    floatingPoint[unit] = {
      count: clamp(rawUnit.count, LIMITS.units, defaults.floatingPoint[unit].count),
      delay: clamp(rawUnit.delay, LIMITS.cycles, defaults.floatingPoint[unit].delay),
    };
  }
  const multiview = validateMultiview(raw.multiview);
  return {
    version: CONFIG_VERSION,
    forwarding: typeof raw.forwarding === "boolean" ? raw.forwarding : defaults.forwarding,
    floatingPoint,
    memorySize: Math.floor(clamp(raw.memorySize, LIMITS.memorySize, defaults.memorySize) / 8) * 8,
    delay: clamp(raw.delay, LIMITS.delay, defaults.delay),
    autoSave: typeof raw.autoSave === "boolean" ? raw.autoSave : defaults.autoSave,
    multiview,
    windows: validateWindows(raw.windows, multiview),
    diagramHistory: clamp(raw.diagramHistory, LIMITS.diagramHistory, defaults.diagramHistory),
  };
}

/** Whether two configurations differ in what the simulator uses */
export function changesMachine(a: ThumderConfig, b: ThumderConfig): boolean {
  return MACHINE_KEYS.some((key) => JSON.stringify(a[key]) !== JSON.stringify(b[key]));
}

const read = (storage: Storage, key: string): unknown => {
  try {
    return JSON.parse(storage.getItem(key) ?? "null");
  } catch {
    return null;
  }
};

/**
 * The configuration saved in `storage`, valid and in the current version. The versions before 1 kept each part under
 * its own key: they are joined, saved under CONFIG_KEY and removed
 */
export function loadConfig(storage: Storage): ThumderConfig {
  const saved = read(storage, CONFIG_KEY);
  if (isObject(saved)) return validateConfig(saved);
  const old: Record<string, unknown> = {};
  for (const [key, oldKey] of Object.entries(OLD_KEYS)) {
    const value = read(storage, oldKey);
    if (value !== null) old[key] = value;
  }
  const config = validateConfig(old);
  saveConfig(storage, config);
  for (const oldKey of Object.values(OLD_KEYS)) storage.removeItem(oldKey);
  return config;
}

export function saveConfig(storage: Storage, config: ThumderConfig): void {
  storage.setItem(CONFIG_KEY, JSON.stringify(validateConfig(config)));
}
