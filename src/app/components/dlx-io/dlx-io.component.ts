import { ChangeDetectionStrategy, Component, computed, type ElementRef, effect, inject, signal, untracked, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MachineService } from "@core/machine/machine.service";
import { ToastService } from "@core/services/toast/toast.service";
import { StorageService } from "@core/storage/storage.service";
import { TranslateModule, TranslateService } from "@ngx-translate/core";

/** A line of the screen of the console: what the program wrote, or what was typed for it (after its prompt or not) */
type ScreenPiece = { kind: "out" | "in"; text: string; prompt: boolean };

/**
 * The console of the simulated program (the DLX-I/O window of WinDLX), as the terminal of an operating system: the
 * command that started the program, what it writes (traps 4 and 5), the lines typed for it (trap 3) after a prompt or
 * after what it asked, and how it ended. When the program waits for a line, the cursor is on the screen: Enter sends it
 * and the arrows bring back the lines sent before. It opens by itself when the program writes or waits for input.
 */
@Component({
  selector: "THUMDER-dlx-io",
  templateUrl: "./dlx-io.component.html",
  styleUrls: ["./dlx-io.component.scss"],
  imports: [FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DlxIoComponent {
  machine = inject(MachineService);
  private storage = inject(StorageService);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);

  @ViewChild("screenBox") private screenElement?: ElementRef<HTMLElement>;
  @ViewChild("lineInput") private lineElement?: ElementRef<HTMLInputElement>;

  public readonly open = signal(false);
  /** Folded: only its title bar */
  public readonly folded = signal(false);
  public line = "";
  /** The lines sent, for the arrows (as the history of a shell); -1: the one being written */
  private readonly sent: string[] = [];
  private back = -1;

  /** The file of the program (the command of the first line) */
  public readonly program = computed(() => {
    this.machine.state.loads();
    const item = untracked(() => this.storage.getItem("interfaceFileItem")) as { name?: string } | null;
    return item?.name ?? "programa.s";
  });

  /** The pieces of the screen: a line typed after what the program asked (without a new line) goes on its line */
  public readonly screen = computed<ScreenPiece[]>(() => {
    let atLineStart = true;
    return this.machine.state.console().map((chunk) => {
      const piece: ScreenPiece = { kind: chunk.kind, text: chunk.text, prompt: chunk.kind === "in" && atLineStart };
      atLineStart = chunk.kind === "in" || chunk.text.endsWith("\n");
      return piece;
    });
  });

  /** The cursor waits after what the program wrote: on its line if it did not end it */
  public readonly inputAtLineStart = computed(() => {
    const pieces = this.machine.state.console();
    const last = pieces[pieces.length - 1];
    return last === undefined || last.kind === "in" || last.text.endsWith("\n");
  });

  /** What the program is doing, for the title bar */
  public readonly state = computed<"input" | "running" | "done" | "paused">(() => {
    const state = this.machine.state;
    if (state.waitingForInput()) return "input";
    if (state.running()) return "running";
    if (state.complete()) return "done";
    return "paused";
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
      if (!this.machine.state.waitingForInput()) return;
      this.open.set(true);
      this.folded.set(false);
      this.scrollDown();
      setTimeout(() => this.lineElement?.nativeElement.focus());
    });
  }

  private scrollDown(): void {
    setTimeout(() => this.screenElement?.nativeElement.scrollTo({ top: this.screenElement.nativeElement.scrollHeight }));
  }

  /** A click on the screen (not to select text) puts the cursor in the line */
  public focusLine(): void {
    if (!window.getSelection()?.toString()) this.lineElement?.nativeElement.focus();
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

  public async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.machine.state.output());
      this.toast.success(this.translate.instant("IO.COPIED"));
    } catch {
      this.toast.error(this.translate.instant("IO.COPY_FAILED"));
    }
  }

  public clear(): void {
    this.machine.clearOutput();
  }
}
