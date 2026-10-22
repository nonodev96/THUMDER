// The parameters of the SuperDLX machine: the ones of the MACHINE file of SuperDLX and WinSuperDLX (instructions per
// cycle, sizes of the buffers and the functional units with their latencies), with their limits. Pure TypeScript, for
// the Web Worker, the configuration and the views.

/** The two halves of the machine: the integer one and the floating point one, each with its window and its ROB */
export type Side = "int" | "fp";
export const SIDES: Side[] = ["int", "fp"];

/** The kinds of functional units of each half (SuperDLX: Integer_Functional_Units and Floating_Point_Units) */
export const INT_POOLS = ["alu", "shift", "comp", "address", "branch"] as const;
export const FP_POOLS = ["add", "mult", "div", "conv", "comp", "address", "branch"] as const;
export type IntPool = (typeof INT_POOLS)[number];
export type FpPool = (typeof FP_POOLS)[number];
/** A kind of functional unit with its half: "int.alu", "fp.mult"... */
export type PoolKey = `int.${IntPool}` | `fp.${FpPool}`;

export const POOL_KEYS: PoolKey[] = [...INT_POOLS.map((pool) => `int.${pool}` as const), ...FP_POOLS.map((pool) => `fp.${pool}` as const)];

/** How many units of a kind there are and how many cycles each one is busy with an instruction (they are not pipelined) */
export type UnitSpec = { count: number; latency: number };

export type SuperscalarParameters = {
  /** Instructions fetched, decoded (sent to the windows) and committed per cycle */
  fetch: number;
  decode: number;
  commit: number;
  /** Entries of the instruction queue, between fetch and decode */
  queue: number;
  /** Entries of the reorder buffers */
  rob: Record<Side, number>;
  /** Entries of the instruction windows (the reservation stations) */
  window: Record<Side, number>;
  loadBuffer: number;
  storeBuffer: number;
  /** Entries of the branch target buffer, with a 2-bit counter each */
  btb: number;
  /** Branch prediction: without it, fetch stops at each branch until it is resolved */
  prediction: boolean;
  /** The data memory: cycles of an access and accesses per cycle (loads first) */
  memory: { latency: number; accesses: number };
  units: { int: Record<IntPool, UnitSpec>; fp: Record<FpPool, UnitSpec> };
};

/** What the simulator needs: the parameters and the size of the memory (shared with DLX) */
export type SuperscalarConfig = SuperscalarParameters & { memorySize: number };

/** The MACHINE file that comes with WinSuperDLX */
export function defaultSuperscalar(): SuperscalarParameters {
  return {
    fetch: 6,
    decode: 4,
    commit: 4,
    queue: 20,
    rob: { int: 20, fp: 20 },
    window: { int: 20, fp: 20 },
    loadBuffer: 5,
    storeBuffer: 5,
    btb: 111,
    prediction: true,
    memory: { latency: 1, accesses: 4 },
    units: {
      int: {
        alu: { count: 4, latency: 1 },
        shift: { count: 2, latency: 1 },
        comp: { count: 1, latency: 1 },
        address: { count: 4, latency: 1 },
        branch: { count: 1, latency: 1 },
      },
      fp: {
        add: { count: 4, latency: 2 },
        mult: { count: 4, latency: 5 },
        div: { count: 2, latency: 10 },
        conv: { count: 2, latency: 2 },
        comp: { count: 1, latency: 1 },
        address: { count: 4, latency: 1 },
        branch: { count: 1, latency: 1 },
      },
    },
  };
}

/** The limits of each parameter (SuperDLX allows up to 20 units of a kind) */
export const SUPERSCALAR_LIMITS = {
  width: { min: 1, max: 16 },
  queue: { min: 1, max: 128 },
  rob: { min: 2, max: 128 },
  window: { min: 1, max: 128 },
  buffer: { min: 1, max: 64 },
  btb: { min: 1, max: 4096 },
  units: { min: 1, max: 20 },
  latency: { min: 1, max: 50 },
  memoryLatency: { min: 1, max: 50 },
  accesses: { min: 1, max: 16 },
} as const;

/** Ready-made machines: the one of WinSuperDLX, a scalar one (one instruction per cycle) and a very wide one */
export type SuperscalarProfile = "default" | "scalar" | "wide";

export function superscalarProfile(profile: SuperscalarProfile): SuperscalarParameters {
  const machine = defaultSuperscalar();
  if (profile === "scalar") {
    const one = (latency: number): UnitSpec => ({ count: 1, latency });
    return {
      ...machine,
      fetch: 1,
      decode: 1,
      commit: 1,
      queue: 4,
      rob: { int: 8, fp: 8 },
      window: { int: 4, fp: 4 },
      loadBuffer: 2,
      storeBuffer: 2,
      memory: { latency: 1, accesses: 1 },
      units: {
        int: { alu: one(1), shift: one(1), comp: one(1), address: one(1), branch: one(1) },
        fp: { add: one(2), mult: one(5), div: one(10), conv: one(2), comp: one(1), address: one(1), branch: one(1) },
      },
    };
  }
  if (profile === "wide") {
    const many = (count: number, latency: number): UnitSpec => ({ count, latency });
    return {
      ...machine,
      fetch: 8,
      decode: 8,
      commit: 8,
      queue: 64,
      rob: { int: 64, fp: 64 },
      window: { int: 48, fp: 48 },
      loadBuffer: 16,
      storeBuffer: 16,
      btb: 1024,
      memory: { latency: 1, accesses: 8 },
      units: {
        int: { alu: many(8, 1), shift: many(4, 1), comp: many(4, 1), address: many(8, 1), branch: many(4, 1) },
        fp: {
          add: many(8, 2),
          mult: many(8, 5),
          div: many(4, 10),
          conv: many(4, 2),
          comp: many(4, 1),
          address: many(8, 1),
          branch: many(4, 1),
        },
      },
    };
  }
  return machine;
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

/** An integer between min and max, or the fallback when it is not a number */
function clamp(value: unknown, { min, max }: { min: number; max: number }, fallback: number): number {
  const number = Math.round(typeof value === "string" ? Number.parseFloat(value) : Number(value));
  return typeof value !== "boolean" && value !== null && value !== "" && Number.isFinite(number)
    ? Math.min(max, Math.max(min, number))
    : fallback;
}

/** Any value (saved by any version, edited by hand or from a link) as valid parameters: what is wrong takes the default */
export function validateSuperscalar(value: unknown): SuperscalarParameters {
  const defaults = defaultSuperscalar();
  const raw = isObject(value) ? value : {};
  const L = SUPERSCALAR_LIMITS;
  const pair = (key: "rob" | "window", limit: { min: number; max: number }): Record<Side, number> => {
    const part = isObject(raw[key]) ? raw[key] : {};
    return { int: clamp(part.int, limit, defaults[key].int), fp: clamp(part.fp, limit, defaults[key].fp) };
  };
  const memory = isObject(raw.memory) ? raw.memory : {};
  const rawUnits = isObject(raw.units) ? raw.units : {};
  const unitsOf = <K extends string>(side: Side, pools: readonly K[], fallback: Record<K, UnitSpec>): Record<K, UnitSpec> => {
    const part = isObject(rawUnits[side]) ? rawUnits[side] : {};
    const result = {} as Record<K, UnitSpec>;
    for (const pool of pools) {
      const unit = isObject(part[pool]) ? part[pool] : {};
      result[pool] = {
        count: clamp(unit.count, L.units, fallback[pool].count),
        latency: clamp(unit.latency, L.latency, fallback[pool].latency),
      };
    }
    return result;
  };
  return {
    fetch: clamp(raw.fetch, L.width, defaults.fetch),
    decode: clamp(raw.decode, L.width, defaults.decode),
    commit: clamp(raw.commit, L.width, defaults.commit),
    queue: clamp(raw.queue, L.queue, defaults.queue),
    rob: pair("rob", L.rob),
    window: pair("window", L.window),
    loadBuffer: clamp(raw.loadBuffer, L.buffer, defaults.loadBuffer),
    storeBuffer: clamp(raw.storeBuffer, L.buffer, defaults.storeBuffer),
    btb: clamp(raw.btb, L.btb, defaults.btb),
    prediction: typeof raw.prediction === "boolean" ? raw.prediction : defaults.prediction,
    memory: {
      latency: clamp(memory.latency, L.memoryLatency, defaults.memory.latency),
      accesses: clamp(memory.accesses, L.accesses, defaults.memory.accesses),
    },
    units: {
      int: unitsOf("int", INT_POOLS, defaults.units.int),
      fp: unitsOf("fp", FP_POOLS, defaults.units.fp),
    },
  };
}

/** The unit of a kind in the parameters */
export function unitSpec(parameters: SuperscalarParameters, pool: PoolKey): UnitSpec {
  const [side, kind] = pool.split(".") as [Side, string];
  return side === "int" ? parameters.units.int[kind as IntPool] : parameters.units.fp[kind as FpPool];
}
