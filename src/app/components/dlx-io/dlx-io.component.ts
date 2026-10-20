import { ChangeDetectionStrategy, Component, computed, type ElementRef, effect, inject, signal, untracked, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MachineService } from "@core/machine/machine.service";
import { ToastService } from "@core/services/toast/toast.service";
import { StorageService } from "@core/storage/storage.service";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { DetailsDirective } from "../../__shared/directives/details/details.directive";
import { ResizableDirective } from "../../__shared/directives/resizable/resizable.directive";

/** The names of the traps, as the C functions they are (WinDLX) */
const CALLS: Record<number, string> = { 0: "halt", 1: "open", 2: "close", 3: "read", 4: "write", 5: "printf" };
const DESCRIPTORS = ["stdin", "stdout", "stderr"] as const;

/** The rows of the list of the traps drawn, the last ones */
const SHOWN_TRAPS = 500;

/** A row of the list of the traps: what one read or wrote, in which cycle and on which descriptor */
type TrapRow = { cycle: number; trap: number; call: string; descriptor: number; device: string; bytes: number; data: string };

/**
 * The console of the simulated program (the DLX-I/O window of WinDLX) as the device it is for the processor: a screen
 * that only shows the bytes the traps write (1, the output, and 2, the errors) and the lines typed for the trap 3, and
 * the list of those traps, cycle by cycle, with their descriptor, their bytes and their data. A light says what the
 * program is doing. When the program waits for a line, the cursor is on the screen: Enter sends it and the arrows bring
 * back the lines sent before. It opens by itself when the program writes or waits for input, and it is resized from its
 * free edges (the top and the left).
 */
@Component({
  selector: "THUMDER-dlx-io",
  templateUrl: "./dlx-io.component.html",
  styleUrls: ["./dlx-io.component.scss"],
  imports: [FormsModule, TranslateModule, ResizableDirective, DetailsDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DlxIoComponent {
  machine = inject(MachineService);
  private storage = inject(StorageService);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);

  @ViewChild("bodyBox") private bodyElement?: ElementRef<HTMLElement>;
  @ViewChild("lineInput") private lineElement?: ElementRef<HTMLInputElement>;

  public readonly open = signal(false);
  /** Folded: only its title bar */
  public readonly folded = signal(false);
  /** What it shows: the screen of the program or the list of the traps */
  public readonly view = signal<"screen" | "traps">("screen");
  public line = "";
  /** The lines sent, for the arrows (as the history of a shell); -1: the one being written */
  private readonly sent: string[] = [];
  private back = -1;

  /** The file of the program */
  public readonly program = computed(() => {
    this.machine.state.loads();
    const item = untracked(() => this.storage.getItem("interfaceFileItem")) as { name?: string } | null;
    return item?.name ?? "programa.s";
  });

  /** What the program is doing, for its light */
  public readonly state = computed<"input" | "running" | "done" | "paused">(() => {
    const state = this.machine.state;
    if (state.waitingForInput()) return "input";
    if (state.running()) return "running";
    if (state.complete()) return "done";
    return "paused";
  });

  /** The traps that read and wrote, the last ones */
  public readonly traps = computed(() => {
    const all = this.machine.state.traps();
    const rows = all.slice(-SHOWN_TRAPS).map<TrapRow>((record) => ({
      cycle: record.cycle,
      trap: record.trap,
      call: CALLS[record.trap] ?? "?",
      descriptor: record.descriptor,
      device: DESCRIPTORS[record.descriptor],
      bytes: record.text.length,
      // The bytes as they are: the new lines, the tabs and the control characters with their escape
      data: JSON.stringify(record.text),
    }));
    return { total: all.length, rows };
  });

  /** The bytes read and written on each descriptor */
  public readonly bytes = computed(() => {
    const bytes = [0, 0, 0];
    for (const record of this.machine.state.traps()) bytes[record.descriptor] += record.text.length;
    return DESCRIPTORS.map((device, descriptor) => ({ descriptor, device, bytes: bytes[descriptor] }));
  });

  constructor() {
    effect(() => {
      const text = this.machine.state.output();
      // Opens with the first output; empty (a new simulation, or cleared) and not waiting for input, it goes
      if (text !== "") this.open.set(true);
      else if (!untracked(this.machine.state.waitingForInput)) this.open.set(false);
      this.scrollDown();
    });
    effect(() => {
      this.machine.state.traps();
      this.scrollDown();
    });
    effect(() => {
      if (!this.machine.state.waitingForInput()) return;
      this.open.set(true);
      this.folded.set(false);
      this.view.set("screen");
      this.scrollDown();
      setTimeout(() => this.lineElement?.nativeElement.focus());
    });
  }

  public show(view: "screen" | "traps"): void {
    this.view.set(view);
    this.scrollDown();
    if (view === "screen") setTimeout(() => this.lineElement?.nativeElement.focus());
  }

  private scrollDown(): void {
    setTimeout(() => this.bodyElement?.nativeElement.scrollTo({ top: this.bodyElement.nativeElement.scrollHeight }));
  }

  /** A click on the screen (not to select text) puts the cursor in the line */
  public focusLine(): void {
    if (this.view() === "screen" && !window.getSelection()?.toString()) this.lineElement?.nativeElement.focus();
  }

  public async send(): Promise<void> {
    const line = this.line;
    this.line = "";
    this.back = -1;
    if (line !== "" && this.sent[this.sent.length - 1] !== line) this.sent.push(line);
    await this.machine.provideInput(line);
    await this.machine.resume();
  }

  /** The arrows bring back the lines sent before, as in a shell */
  public onKeydown(event: KeyboardEvent): void {
    if ((event.key !== "ArrowUp" && event.key !== "ArrowDown") || this.sent.length === 0) return;
    event.preventDefault();
    if (event.key === "ArrowUp") this.back = this.back === -1 ? this.sent.length - 1 : Math.max(0, this.back - 1);
    else this.back = this.back === -1 || this.back === this.sent.length - 1 ? -1 : this.back + 1;
    this.line = this.back === -1 ? "" : this.sent[this.back];
  }

  /** Copies what it shows: the screen, or the list of the traps (by tabs) */
  public async copy(): Promise<void> {
    const traps = this.view() === "traps";
    const text = traps
      ? this.traps()
          .rows.map((row) => [row.cycle, row.trap, row.call, row.descriptor, row.bytes, row.data].join("\t"))
          .join("\n")
      : this.machine.state.output();
    try {
      await navigator.clipboard.writeText(text);
      this.toast.success(this.translate.instant(traps ? "IO.COPIED_TRAPS" : "IO.COPIED"));
    } catch {
      this.toast.error(this.translate.instant("IO.COPY_FAILED"));
    }
  }

  public clear(): void {
    this.machine.clearOutput();
  }
}
