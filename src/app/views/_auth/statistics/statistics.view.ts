import { ChangeDetectionStrategy, Component, computed, inject, signal } from "@angular/core";
import type { TypeDataStatistics } from "@app/Types";
import type { CompareResponse, RunSummary } from "@core/engine/simulator";
import { logger } from "@core/logger/logger";
import { MachineService } from "@core/machine/machine.service";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { download } from "@shared/utils/download";
import { CardDirective, CardWidgetDirective } from "../../../__shared/directives/card/card.directive";
import {
  branchShares,
  cycleShares,
  floatingShares,
  instructionMix,
  rawCauses,
  type Share,
  stallShares,
  summarize,
} from "./statistics.model";

/** The statistics as a table: section, item, field and value (EDU-06) */
export function statisticsToCsv(data: TypeDataStatistics): string {
  const lines = ["section,item,field,value"];
  for (const [section, items] of Object.entries(data)) {
    for (const [item, fields] of Object.entries(items as Record<string, Record<string, unknown>>)) {
      for (const [field, value] of Object.entries(fields)) lines.push([section, item, field, String(value)].join(","));
    }
  }
  return `${lines.join("\n")}\n`;
}

/** The rows of the comparison: what each one shows of a run */
const COMPARED: { key: keyof RunSummary; label: string }[] = [
  { key: "cycles", label: "ST.COMPARE.CYCLES" },
  { key: "instructions", label: "ST.COMPARE.INSTRUCTIONS" },
  { key: "cpi", label: "ST.COMPARE.CPI" },
  { key: "rawStalls", label: "ST.COMPARE.RAW" },
  { key: "wawStalls", label: "ST.COMPARE.WAW" },
  { key: "structuralStalls", label: "ST.COMPARE.STRUCTURAL" },
  { key: "controlStalls", label: "ST.COMPARE.CONTROL" },
  { key: "totalStalls", label: "ST.COMPARE.TOTAL" },
];

/** The rows of the comparison drawn as pairs of bars */
const COMPARED_BARS: (keyof RunSummary)[] = ["cycles", "rawStalls", "totalStalls"];

export type StatisticsTab = "summary" | "stalls" | "instructions" | "compare";

const TABS: { id: StatisticsTab; label: string }[] = [
  { id: "summary", label: "ST.TABS.SUMMARY" },
  { id: "stalls", label: "ST.TABS.STALLS" },
  { id: "instructions", label: "ST.TABS.INSTRUCTIONS" },
  { id: "compare", label: "ST.TABS.COMPARE" },
];

/** The tab chosen last (only this browser) */
const TAB_KEY = "statistics_tab";

/**
 * The statistics of the simulation (WinDLX: Statistics), in tabs: a summary (the counts, the CPI and what the cycles
 * are), the stalls (each kind, what it is and how to avoid it), the instructions of the program, and the program with
 * and without forwarding. Every bar has its number written next to it.
 */
@Component({
  selector: "view-statistics",
  templateUrl: "./statistics.view.html",
  styleUrls: ["./statistics.view.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardDirective, CardWidgetDirective, TranslatePipe],
})
export class StatisticsView {
  private machine = inject(MachineService);
  private translate = inject(TranslateService);

  /** The statistics of the simulation */
  public readonly data = this.machine.state.statistics;
  public readonly summary = computed(() => summarize(this.data()));
  public readonly hasData = computed(() => this.summary().cycles > 0);
  public readonly cycles = computed(() => cycleShares(this.data()));
  public readonly stalls = computed(() => stallShares(this.data()));
  public readonly raw = computed(() => rawCauses(this.data()));
  public readonly mix = computed(() => instructionMix(this.data()));
  public readonly branches = computed(() => branchShares(this.data()));
  public readonly floating = computed(() => floatingShares(this.data()));
  public readonly hardware = computed(() => this.data().HARDWARE);
  /** The longest bar of each list is full: the others are as long as their part of it */
  public readonly maxStall = computed(() => Math.max(1, ...this.stalls().map((share) => share.value)));
  public readonly maxRaw = computed(() => Math.max(1, ...this.raw().map((share) => share.value)));
  public readonly maxFloating = computed(() => Math.max(1, ...this.floating().map((share) => share.value)));

  public readonly tabs = TABS;
  public readonly tab = signal<StatisticsTab>(StatisticsView.savedTab());

  public readonly compared = COMPARED;
  public readonly comparedBars = COMPARED_BARS;
  public readonly comparison = signal<CompareResponse | null>(null);
  public readonly comparing = signal(false);
  public readonly comparisonFailed = signal(false);

  private static savedTab(): StatisticsTab {
    try {
      const saved = localStorage.getItem(TAB_KEY);
      return TABS.some((tab) => tab.id === saved) ? (saved as StatisticsTab) : "summary";
    } catch {
      return "summary";
    }
  }

  public select(tab: StatisticsTab): void {
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
    const list = (event.currentTarget as HTMLElement).closest("[role=tablist]");
    queueMicrotask(() => list?.querySelector<HTMLElement>(`#statisticsTab-${tab.id}`)?.focus());
  }

  /** A number in the language of the interface */
  public format(value: number, digits = 0): string {
    const lang = this.translate.getCurrentLang() ?? this.translate.getFallbackLang() ?? "es";
    return new Intl.NumberFormat(lang, { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(value);
  }

  /** The length of a bar, in %: its part of the longest one (a bar with something is always visible) */
  public bar(share: Share, max: number): number {
    if (share.value <= 0) return 0;
    return Math.max(2, (share.value / max) * 100);
  }

  /** The program with and without forwarding, to the end (EDU-02) */
  public async compare(): Promise<void> {
    this.comparing.set(true);
    this.comparisonFailed.set(false);
    try {
      this.comparison.set(await this.machine.compareForwarding());
    } catch (error) {
      logger.error(error);
      this.comparisonFailed.set(true);
    } finally {
      this.comparing.set(false);
    }
  }

  public difference(key: keyof RunSummary): number {
    const result = this.comparison();
    if (result === null) return 0;
    const without = Number(result.withoutForwarding[key]);
    const withForwarding = Number(result.withForwarding[key]);
    return Math.round((without - withForwarding) * 100) / 100;
  }

  /** How many times faster the program is with forwarding */
  public speedup(): number {
    const result = this.comparison();
    if (result === null || result.withForwarding.cycles === 0) return 1;
    return Math.round((result.withoutForwarding.cycles / result.withForwarding.cycles) * 100) / 100;
  }

  /** The length of the bars of a row of the comparison: the longer of the two is full */
  public comparedBar(key: keyof RunSummary, which: "withForwarding" | "withoutForwarding"): number {
    const result = this.comparison();
    if (result === null) return 0;
    const value = Number(result[which][key]);
    const max = Math.max(1, Number(result.withForwarding[key]), Number(result.withoutForwarding[key]));
    return value <= 0 ? 0 : Math.max(2, (value / max) * 100);
  }

  public comparedValue(key: keyof RunSummary, which: "withForwarding" | "withoutForwarding"): number {
    return Number(this.comparison()?.[which][key] ?? 0);
  }

  public comparedLabel(key: keyof RunSummary): string {
    return COMPARED.find((row) => row.key === key)?.label ?? "";
  }

  public exportCsv(): void {
    download("estadisticas.csv", statisticsToCsv(this.data()), "text/csv");
  }
}
