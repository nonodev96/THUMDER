import { CdkDrag, CdkDragHandle } from "@angular/cdk/drag-drop";
import { Component, computed, ElementRef, effect, inject, signal, untracked } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { NavigationEnd, Router } from "@angular/router";
import { NPM_VERSION } from "@app/CONSTANTS";
import type { TypePipelineCellInstruction } from "@app/Types";
import { ConfigService } from "@core/config/config.service";
import { describeLog } from "@core/machine/log-description";
import { MachineService } from "@core/machine/machine.service";
import { STATUS_BADGES, simulationStatus } from "@core/machine/simulation-status";
import { ElectronService } from "@core/services";
import { Globals } from "@core/services/globals/globals.service";
import { ThemeService } from "@core/services/theme/theme.service";
import { ToastService } from "@core/services/toast/toast.service";
import { StorageService } from "@core/storage/storage.service";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { filter, map } from "rxjs";
import { AppConfig } from "../../../../environments/_environment";
import { CardDirective, CardWidgetDirective } from "../../../__shared/directives/card/card.directive";
import { DetailsDirective } from "../../../__shared/directives/details/details.directive";
import { ResizableDirective } from "../../../__shared/directives/resizable/resizable.directive";

/** A fact of the state: its name, its value and what it means (texts of the translations, or a value as it is) */
type Fact = { label: string; value: string; translate?: boolean; params?: Record<string, unknown>; help?: string; mono?: boolean };
type Section = { title: string; icon: string; facts: Fact[] };

/** The messages shown, the newest last */
const SHOWN = 200;

const hex = (binary: string) =>
  `0x${Number.parseInt(binary || "0", 2)
    .toString(16)
    .toUpperCase()
    .padStart(8, "0")}`;

/**
 * The debug window (the footer opens it): what THUMDER is doing, said explicitly. «State»: the simulation (its status,
 * the cycle, the line, the file), the registers that drive it (PC, IR), what each stage of the pipeline has, the
 * configuration and the application, each value with what it means. «Messages»: the log of the simulation, each message
 * with its time, its cycle, its event and what it means in words, with a filter, follow the new ones, copy and clear.
 */
@Component({
  selector: "THUMDER-windows-debug",
  templateUrl: "./debug.component.html",
  styleUrls: ["./debug.component.scss"],
  imports: [CardDirective, CdkDrag, CdkDragHandle, CardWidgetDirective, TranslatePipe, ResizableDirective, DetailsDirective],
})
export class DebugComponent {
  router = inject(Router);
  globals = inject(Globals);
  private machine = inject(MachineService);
  private config = inject(ConfigService);
  private theme = inject(ThemeService);
  private electron = inject(ElectronService);
  private storage = inject(StorageService);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);
  private element: HTMLElement = inject(ElementRef<HTMLElement>).nativeElement;

  public readonly version = `${NPM_VERSION} (${AppConfig.environment})`;
  public readonly tab = signal<"state" | "messages">("state");
  public readonly filter = signal("");
  public readonly follow = signal(true);

  public readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  public readonly status = computed(() => simulationStatus(this.machine.state));
  public readonly statusClass = computed(() => STATUS_BADGES[this.status()]);

  /** The state, by sections */
  public readonly sections = computed<Section[]>(() => {
    const state = this.machine.state;
    state.values();
    state.loads();
    const registers = this.machine.registers;
    const pipeline = state.pipeline();
    const config = this.config.value();
    const fp = this.machine.floatingPointStageConfiguration;
    const yes = (value: boolean): Fact["value"] => (value ? "DEBUG_PANEL.YES" : "DEBUG_PANEL.NO");
    const stage = (cell: TypePipelineCellInstruction | undefined): Pick<Fact, "value" | "translate" | "mono"> =>
      !cell?.text || cell.draw === false
        ? { value: "DATAPATH.EMPTY", translate: true }
        : { value: `${cell.text.replace(/\s+/g, " ")}${cell.draw === true ? "" : ` (${cell.draw})`}`, mono: true };
    const busy = (cells: TypePipelineCellInstruction[] | undefined) =>
      (cells ?? [])
        .filter((cell) => cell.text && cell.draw !== false)
        .map((cell) => cell.text.replace(/\s+/g, " "))
        .join(" | ");
    const file = untracked(() => this.storage.getItem("interfaceFileItem")) as { name?: string } | null;
    const loaded = this.status() !== "IDLE";
    return [
      {
        title: "DEBUG_PANEL.SIMULATION",
        icon: "fa-play-circle",
        facts: [
          { label: "DEBUG_PANEL.STATUS", value: `STATUS.${this.status()}`, translate: true, help: "DEBUG_PANEL.STATUS_HELP" },
          { label: "DEBUG_PANEL.FILE", value: file?.name ?? "—", mono: true, help: "DEBUG_PANEL.FILE_HELP" },
          {
            label: "DEBUG_PANEL.CYCLE",
            value: state.cycles() > 0 ? String(state.step()) : "—",
            mono: true,
            help: "DEBUG_PANEL.CYCLE_HELP",
          },
          { label: "DEBUG_PANEL.CYCLES", value: String(state.cycles()), mono: true, help: "DEBUG_PANEL.CYCLES_HELP" },
          { label: "DEBUG_PANEL.LINE", value: state.line() > 0 ? String(state.line()) : "—", mono: true, help: "DEBUG_PANEL.LINE_HELP" },
          { label: "DEBUG_PANEL.CAN_SIMULATE", value: yes(state.canSimulate()), translate: true, help: "DEBUG_PANEL.CAN_SIMULATE_HELP" },
          { label: "DEBUG_PANEL.ERRORS", value: String(state.errors().length), mono: true, help: "DEBUG_PANEL.ERRORS_HELP" },
          { label: "DEBUG_PANEL.INPUT", value: yes(state.waitingForInput()), translate: true, help: "DEBUG_PANEL.INPUT_HELP" },
        ],
      },
      {
        title: "DEBUG_PANEL.REGISTERS",
        icon: "fa-microchip",
        facts: [
          { label: "PC", value: loaded ? hex(registers.PC.binary) : "—", mono: true, help: "DEBUG_PANEL.PC_HELP" },
          { label: "IR", value: loaded ? hex(registers.IR.binary) : "—", mono: true, help: "DEBUG_PANEL.IR_HELP" },
        ],
      },
      {
        title: "DEBUG_PANEL.PIPELINE",
        icon: "fa-stream",
        facts: [
          { label: "IF", ...stage(pipeline?.IF), help: "DEBUG_PANEL.IF_HELP" },
          { label: "ID", ...stage(pipeline?.ID), help: "DEBUG_PANEL.ID_HELP" },
          { label: "EX", ...stage(pipeline?.intEX), help: "DEBUG_PANEL.EX_HELP" },
          { label: "MEM", ...stage(pipeline?.MEM), help: "DEBUG_PANEL.MEM_HELP" },
          { label: "WB", ...stage(pipeline?.WB), help: "DEBUG_PANEL.WB_HELP" },
          {
            label: "DEBUG_PANEL.FP_UNITS",
            value:
              [busy(pipeline?.faddEX), busy(pipeline?.fmultEX), busy(pipeline?.fdivEX)].filter(Boolean).join(" | ") || "DATAPATH.EMPTY",
            translate: ![busy(pipeline?.faddEX), busy(pipeline?.fmultEX), busy(pipeline?.fdivEX)].some(Boolean),
            mono: true,
          },
        ],
      },
      {
        title: "DEBUG_PANEL.CONFIGURATION",
        icon: "fa-wrench",
        facts: [
          {
            label: "DEBUG_PANEL.FORWARDING",
            value: yes(this.machine.enabledForwarding),
            translate: true,
            help: "DEBUG_PANEL.FORWARDING_HELP",
          },
          {
            label: "DEBUG_PANEL.UNITS",
            value: fp
              ? `fadd ${fp.addition.count} × ${fp.addition.delay}, fmul ${fp.multiplication.count} × ${fp.multiplication.delay}, fdiv ${fp.division.count} × ${fp.division.delay}`
              : "—",
            mono: true,
            help: "DEBUG_PANEL.UNITS_HELP",
          },
          { label: "DEBUG_PANEL.MEMORY", value: `${this.machine.memorySize ?? 0} B`, mono: true, help: "DEBUG_PANEL.MEMORY_HELP" },
          { label: "DEBUG_PANEL.SPEED", value: `${config.delay} ms`, mono: true, help: "DEBUG_PANEL.SPEED_HELP" },
          { label: "DEBUG_PANEL.SOUND", value: yes(config.sound.enabled), translate: true },
        ],
      },
      {
        title: "DEBUG_PANEL.APPLICATION",
        icon: "fa-info-circle",
        facts: [
          { label: "DEBUG_PANEL.VERSION", value: `${NPM_VERSION} (${AppConfig.environment})`, mono: true },
          { label: "DEBUG_PANEL.ROUTE", value: this.url(), mono: true },
          {
            label: "DEBUG_PANEL.PLATFORM",
            value: this.electron.isElectronApp ? "DEBUG_PANEL.DESKTOP" : "DEBUG_PANEL.BROWSER",
            translate: true,
          },
          { label: "DEBUG_PANEL.THEME", value: `THEME.${this.theme.choice().toUpperCase()}`, translate: true },
          { label: "DEBUG_PANEL.LANGUAGE", value: this.translate.getCurrentLang() ?? "es", mono: true },
          { label: "DEBUG_PANEL.SCREEN", value: `${window.innerWidth} × ${window.innerHeight} (${window.devicePixelRatio}x)`, mono: true },
        ],
      },
    ];
  });

  /** The messages of the log, each with what it means (the filter looks in the message and in its meaning) */
  public readonly messages = computed(() => {
    this.machine.logVersion();
    const text = this.filter().trim().toLowerCase();
    const all = this.machine.logHistory().map((entry) => {
      const meaning = describeLog(entry.text);
      // The cycle of the message, numbered as in the views (the log keeps the cycles run when it was written)
      return { ...entry, ...meaning, time: entry.date.toLocaleTimeString(), shownCycle: entry.cycle > 0 ? entry.cycle - 1 : null };
    });
    const shown = text
      ? all.filter(
          (entry) =>
            entry.text.toLowerCase().includes(text) || this.translate.instant(entry.key, entry.params).toLowerCase().includes(text),
        )
      : all;
    return { total: all.length, list: shown.slice(-SHOWN) };
  });

  constructor() {
    // Following the new messages: down to the last one, after Angular draws it
    effect(() => {
      this.messages();
      if (!this.follow() || this.tab() !== "messages") return;
      setTimeout(() => {
        const panel = this.element.querySelector<HTMLElement>(".debug-panel");
        panel?.scrollTo({ top: panel.scrollHeight });
      });
    });
  }

  public async copy(): Promise<void> {
    const lines = this.messages().list.map(
      (entry) =>
        `${entry.time}\t${entry.shownCycle ?? "-"}\t${entry.level}\t${entry.text}\t${this.translate.instant(entry.key, entry.params)}`,
    );
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      this.toast.success(this.translate.instant("LOGGER.COPIED", { count: lines.length }));
    } catch {
      this.toast.error(this.translate.instant("LOGGER.COPY_FAILED"));
    }
  }

  public clear(): void {
    this.machine.clearLog();
  }
}
