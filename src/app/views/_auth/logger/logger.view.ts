import { ChangeDetectionStrategy, Component, computed, type ElementRef, effect, inject, signal, untracked, ViewChild } from "@angular/core";
import { TOAST } from "@app/CONSTANTS";
import { LOG_LIMIT, type LogEntry, MachineService } from "@core/machine/machine.service";
import { ToastService } from "@core/services/toast/toast.service";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { CardDirective, CardWidgetDirective } from "../../../__shared/directives/card/card.directive";

/** The lines drawn at most (the newest ones): the whole log can be copied or downloaded */
const SHOWN = 500;

/**
 * The log of the simulation (MachineService.writeToLog): what was loaded, each cycle and each change of the
 * configuration. It can be filtered, followed as it grows, copied and downloaded as text
 */
@Component({
  selector: "view-logger",
  templateUrl: "./logger.view.html",
  styleUrls: ["./logger.view.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardDirective, CardWidgetDirective, TranslatePipe],
})
export class LoggerView {
  machine = inject(MachineService);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);

  @ViewChild("viewer", { static: true }) private viewer!: ElementRef<HTMLElement>;

  public readonly limit = LOG_LIMIT;
  public readonly shownLimit = SHOWN;
  public readonly filter = signal("");
  /** The view goes down to each new line */
  public readonly follow = signal(true);

  private readonly entries = computed<readonly LogEntry[]>(() => {
    this.machine.logVersion();
    return this.machine.logHistory();
  });

  public readonly matching = computed(() => {
    const filter = this.filter().trim().toLowerCase();
    const entries = this.entries();
    return filter === "" ? entries : entries.filter((entry) => `${entry.level} ${entry.text}`.toLowerCase().includes(filter));
  });

  public readonly shown = computed(() => this.matching().slice(-SHOWN));

  constructor() {
    effect(() => {
      this.shown();
      if (!untracked(this.follow)) return;
      // After Angular draws the new lines
      setTimeout(() => {
        const viewer = this.viewer.nativeElement;
        viewer.scrollTop = viewer.scrollHeight;
      });
    });
  }

  public time(entry: LogEntry): string {
    return entry.date.toLocaleTimeString(undefined, { hour12: false });
  }

  public trackById(_: number, entry: LogEntry): number {
    return entry.id;
  }

  /** The log as text, one message a line (what is copied and downloaded) */
  private asText(entries: readonly LogEntry[]): string {
    return entries.map((entry) => `${entry.date.toISOString()}\t${entry.level}\t${entry.cycle}\t${entry.text}`).join("\n");
  }

  public async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.asText(this.matching()));
      this.toast.success(this.translate.instant("LOGGER.COPIED", { count: this.matching().length }), "", TOAST.success);
    } catch {
      this.toast.error(this.translate.instant("LOGGER.COPY_FAILED"), "", TOAST.error);
    }
  }

  public download(): void {
    const blob = new Blob([this.asText(this.matching())], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `thumder-log-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  public clear(): void {
    this.machine.clearLog();
  }

  /** Scrolling up stops following the new lines; down to the end, it follows them again */
  public onScroll(): void {
    const viewer = this.viewer.nativeElement;
    this.follow.set(viewer.scrollHeight - viewer.scrollTop - viewer.clientHeight < 8);
  }

  public toggleFollow(): void {
    this.follow.update((follow) => !follow);
    if (this.follow()) {
      const viewer = this.viewer.nativeElement;
      viewer.scrollTop = viewer.scrollHeight;
    }
  }
}
