import { DecimalPipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, signal } from "@angular/core";
import type { TypeDataStatistics } from "@app/Types";
import type { CompareResponse, RunSummary } from "@core/engine/simulator";
import { logger } from "@core/logger/logger";
import { MachineService } from "@core/machine/machine.service";
import { TranslatePipe } from "@ngx-translate/core";
import { download } from "@shared/utils/download";
import { CardDirective, CardWidgetDirective } from "../../../__shared/directives/card/card.directive";

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

@Component({
  selector: "view-statistics",
  templateUrl: "./statistics.view.html",
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardDirective, CardWidgetDirective, TranslatePipe, DecimalPipe],
})
export class StatisticsView {
  private machine = inject(MachineService);

  /** The statistics of the simulation (WinDLX: Statistics) */
  public readonly data = this.machine.state.statistics;

  public readonly compared = COMPARED;
  public readonly comparison = signal<CompareResponse | null>(null);
  public readonly comparing = signal(false);
  public readonly comparisonFailed = signal(false);

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

  public exportCsv(): void {
    download("estadisticas.csv", statisticsToCsv(this.data()), "text/csv");
  }
}
