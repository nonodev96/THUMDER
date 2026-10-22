import { ChangeDetectionStrategy, Component, computed, inject, signal } from "@angular/core";
import { poolLabel } from "@components/superscalar-machine/superscalar-machine.component";
import type { CompareArchitecturesResponse, RunSummary } from "@core/engine/simulator";
import type { CommitStall, DispatchStall, FetchStall, SuperscalarStats } from "@core/engine/superscalar";
import { POOL_KEYS, type PoolKey, unitSpec } from "@core/engine/superscalar-config";
import { logger } from "@core/logger/logger";
import { MachineService } from "@core/machine/machine.service";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";

export type SuperscalarTab = "summary" | "stalls" | "branches" | "units" | "compare";

const TABS: { id: SuperscalarTab; label: string }[] = [
  { id: "summary", label: "ST.TABS.SUMMARY" },
  { id: "stalls", label: "ST.TABS.STALLS" },
  { id: "branches", label: "SST.TABS.BRANCHES" },
  { id: "units", label: "SST.TABS.UNITS" },
  { id: "compare", label: "SST.TABS.COMPARE" },
];

/** The tab chosen last (only this browser) */
const TAB_KEY = "superscalar_statistics_tab";

const FETCH: FetchStall[] = ["queueFull", "branch", "jreg", "recovery", "halt", "fault"];
const DISPATCH: DispatchStall[] = ["queueEmpty", "robInt", "robFp", "windowInt", "windowFp", "loadBuffer", "storeBuffer"];
const COMMIT: CommitStall[] = ["notDone", "order", "storeData", "trap", "input"];

type Bar = { key: string; value: number; per: number };

/** Every number of the statistics of SuperDLX as a table: group, item and value (EDU-06) */
export function superscalarStatsToCsv(stats: SuperscalarStats): string {
  const lines = ["group,item,value"];
  const add = (group: string, value: unknown, item = "") => {
    if (Array.isArray(value)) {
      for (const [index, entry] of value.entries()) lines.push([group, String(index), String(entry)].join(","));
    } else if (typeof value === "object" && value !== null) for (const [key, entry] of Object.entries(value)) add(group, entry, key);
    else lines.push([group, item, String(value)].join(","));
  };
  for (const [key, value] of Object.entries(stats)) {
    if (typeof value === "object") add(key, value);
    else lines.push([key, "", String(value)].join(","));
  }
  return `${lines.join("\n")}\n`;
}

/**
 * The statistics of SuperDLX, in tabs (the ones of WinSuperDLX, explained): the summary (instructions per cycle and how
 * many cycles commit how many), why fetch, decode and commit stop, the branch prediction, the use of the units and the
 * buffers, and the same program in DLX and in SuperDLX
 */
@Component({
  selector: "thumder-superscalar-statistics",
  templateUrl: "./superscalar-statistics.component.html",
  styleUrls: ["./statistics.view.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
})
export class SuperscalarStatisticsComponent {
  private machine = inject(MachineService);
  private translate = inject(TranslateService);

  public readonly tabs = TABS;
  public readonly tab = signal<SuperscalarTab>(SuperscalarStatisticsComponent.savedTab());
  public readonly stats = this.machine.state.superscalarStats;
  public readonly hasData = computed(() => (this.stats()?.cycles ?? 0) > 0);
  public readonly parameters = computed(() => {
    this.machine.state.loads();
    return this.machine.superscalarParameters;
  });

  public readonly summary = computed(() => {
    const stats = this.stats();
    if (stats === null) return null;
    const ratio = (a: number, b: number) => (b > 0 ? a / b : 0);
    return {
      cycles: stats.cycles,
      instructions: stats.instructions,
      ipc: ratio(stats.instructions, stats.cycles),
      cpi: ratio(stats.cycles, stats.instructions),
      fetched: stats.fetched,
      squashed: stats.squashed,
      squashedPer: ratio(stats.squashed, stats.fetched) * 100,
      peak: this.parameters().commit,
    };
  });

  /** How many cycles committed 0, 1, 2... instructions (up to the width of commit, and beyond it only if some cycle did) */
  public readonly commits = computed(() => {
    const values = this.stats()?.commitHistogram ?? [];
    let last = Math.min(values.length - 1, this.parameters().commit);
    for (let i = values.length - 1; i > last; i--) {
      if (values[i] > 0) {
        last = i;
        break;
      }
    }
    return this.histogram(values.slice(0, last + 1));
  });

  public readonly fetchStalls = computed(() => this.bars(FETCH, this.stats()?.fetchStalls));
  public readonly dispatchStalls = computed(() => this.bars(DISPATCH, this.stats()?.dispatchStalls));
  public readonly commitStalls = computed(() => this.bars(COMMIT, this.stats()?.commitStalls));

  public readonly waits = computed(() => {
    const stats = this.stats();
    const operands = stats?.waitOperands ?? 0;
    const unit = stats?.waitUnit ?? 0;
    const total = operands + unit;
    return [
      { key: "OPERANDS", value: operands, per: total > 0 ? (operands / total) * 100 : 0 },
      { key: "UNIT", value: unit, per: total > 0 ? (unit / total) * 100 : 0 },
    ];
  });

  public readonly branches = computed(() => {
    const stats = this.stats();
    if (stats === null) return null;
    const per = (a: number, b: number) => (b > 0 ? (a / b) * 100 : 0);
    return {
      branches: stats.branches,
      taken: stats.taken,
      takenPer: per(stats.taken, stats.branches),
      mispredicted: stats.mispredicted,
      accuracy: per(stats.branches - stats.mispredicted, stats.branches),
      btbMisses: stats.btbMisses,
      btbCollisions: stats.btbCollisions,
      squashed: stats.squashed,
      recoveries: stats.recoveries,
      jumps: stats.jumps,
      perMiss: stats.mispredicted > 0 ? stats.squashed / stats.mispredicted : 0,
    };
  });

  /** Each kind of unit: how many, its latency, the instructions committed in it and how busy it was */
  public readonly units = computed(() => {
    const stats = this.stats();
    const parameters = this.parameters();
    return POOL_KEYS.map((pool) => {
      const spec = unitSpec(parameters, pool);
      const busy = stats?.unitBusy[pool] ?? 0;
      const cycles = stats?.cycles ?? 0;
      return {
        pool,
        count: spec.count,
        latency: spec.latency,
        instructions: stats?.byPool[pool] ?? 0,
        use: cycles > 0 ? (busy / (spec.count * cycles)) * 100 : 0,
      };
    });
  });

  /** How full each structure was, on average */
  public readonly occupancy = computed(() => {
    const stats = this.stats();
    const parameters = this.parameters();
    const cycles = Math.max(1, stats?.cycles ?? 1);
    const o = stats?.occupancy;
    const row = (key: string, sum: number | undefined, size: number) => {
      const mean = (sum ?? 0) / cycles;
      return { key, mean, size, per: size > 0 ? (mean / size) * 100 : 0 };
    };
    return [
      row("QUEUE", o?.queue, parameters.queue),
      row("WINDOW_INT", o?.windowInt, parameters.window.int),
      row("WINDOW_FP", o?.windowFp, parameters.window.fp),
      row("ROB_INT", o?.robInt, parameters.rob.int),
      row("ROB_FP", o?.robFp, parameters.rob.fp),
      row("LOAD_BUFFER", o?.loadBuffer, parameters.loadBuffer),
      row("STORE_BUFFER", o?.storeBuffer, parameters.storeBuffer),
    ];
  });

  public readonly comparison = signal<CompareArchitecturesResponse | null>(null);
  public readonly comparing = signal(false);
  public readonly comparisonFailed = signal(false);

  public readonly compared: { key: keyof RunSummary; label: string; digits: number }[] = [
    { key: "cycles", label: "ST.COMPARE.CYCLES", digits: 0 },
    { key: "instructions", label: "ST.COMPARE.INSTRUCTIONS", digits: 0 },
    { key: "cpi", label: "ST.COMPARE.CPI", digits: 2 },
    { key: "ipc", label: "SST.COMPARE.IPC", digits: 2 },
  ];

  private static savedTab(): SuperscalarTab {
    try {
      const saved = localStorage.getItem(TAB_KEY);
      return TABS.some((tab) => tab.id === saved) ? (saved as SuperscalarTab) : "summary";
    } catch {
      return "summary";
    }
  }

  public select(tab: SuperscalarTab): void {
    this.tab.set(tab);
    try {
      localStorage.setItem(TAB_KEY, tab);
    } catch {
      // Without storage the first tab is shown the next time
    }
  }

  /** The keys of the tabs (WAI-ARIA): the arrows, Home and End choose another one and take the focus to it */
  public onTabKeydown(event: KeyboardEvent, index: number): void {
    const moves: Record<string, number> = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: TABS.length - 1 };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const tab = TABS[(next + TABS.length) % TABS.length];
    this.select(tab.id);
    queueMicrotask(() => document.getElementById(`superscalarStatisticsTab-${tab.id}`)?.focus());
  }

  public async compare(): Promise<void> {
    this.comparing.set(true);
    this.comparisonFailed.set(false);
    try {
      this.comparison.set(await this.machine.compareArchitectures());
    } catch (error) {
      logger.error(error);
      this.comparisonFailed.set(true);
    } finally {
      this.comparing.set(false);
    }
  }

  public speedup(): number {
    const result = this.comparison();
    return result && result.superdlx.cycles > 0 ? result.dlx.cycles / result.superdlx.cycles : 0;
  }

  public comparedValue(key: keyof RunSummary, architecture: "dlx" | "superdlx"): number {
    const value = this.comparison()?.[architecture][key];
    return typeof value === "number" ? value : 0;
  }

  public comparedBar(key: keyof RunSummary, architecture: "dlx" | "superdlx"): number {
    const max = Math.max(this.comparedValue(key, "dlx"), this.comparedValue(key, "superdlx"));
    return max > 0 ? (this.comparedValue(key, architecture) / max) * 100 : 0;
  }

  public poolLabel(pool: PoolKey): string {
    return poolLabel(pool);
  }

  /** The length of a bar, in %: its part of the longest one (a bar with something is always visible) */
  public bar(share: { value: number }, max: number): number {
    if (share.value <= 0 || max <= 0) return 0;
    return Math.max(2, (share.value / max) * 100);
  }

  public max(shares: readonly { value: number }[]): number {
    return Math.max(0, ...shares.map((share) => share.value));
  }

  /** A number in the language of the interface */
  public format(value: number, digits = 0): string {
    const lang = this.translate.getCurrentLang() ?? this.translate.getFallbackLang() ?? "es";
    return new Intl.NumberFormat(lang, { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(value);
  }

  private histogram(values: readonly number[]): Bar[] {
    const total = values.reduce((sum, value) => sum + value, 0);
    return values.map((value, index) => ({ key: String(index), value, per: total > 0 ? (value / total) * 100 : 0 }));
  }

  private bars<K extends string>(keys: readonly K[], counts: Record<K, number> | undefined): Bar[] {
    const cycles = this.stats()?.cycles ?? 0;
    return keys.map((key) => ({ key, value: counts?.[key] ?? 0, per: cycles > 0 ? ((counts?.[key] ?? 0) / cycles) * 100 : 0 }));
  }
}
