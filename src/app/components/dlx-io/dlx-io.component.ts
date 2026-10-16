import { ChangeDetectionStrategy, Component, type ElementRef, effect, inject, signal, untracked, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MachineService } from "@core/machine/machine.service";
import { TranslateModule } from "@ngx-translate/core";

/**
 * The console of the simulated program (the DLX-I/O window of WinDLX): what it writes with traps 4 and 5 and, when it
 * reads with trap 3, a field for the line. It opens by itself when the program writes or waits for input.
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

  @ViewChild("output") private outputElement?: ElementRef<HTMLPreElement>;
  @ViewChild("lineInput") private lineElement?: ElementRef<HTMLInputElement>;

  public readonly open = signal(false);
  public line = "";

  constructor() {
    effect(() => {
      const text = this.machine.state.output();
      // Opens with the first output; empty (a new simulation, or cleared) and not waiting for input, it goes
      if (text !== "") this.open.set(true);
      else if (!untracked(this.machine.state.waitingForInput)) this.open.set(false);
      setTimeout(() => this.outputElement?.nativeElement.scrollTo({ top: this.outputElement.nativeElement.scrollHeight }));
    });
    effect(() => {
      if (!this.machine.state.waitingForInput()) return;
      this.open.set(true);
      setTimeout(() => this.lineElement?.nativeElement.focus());
    });
  }

  public async send(): Promise<void> {
    const line = this.line;
    this.line = "";
    await this.machine.provideInput(line);
    await this.machine.resume();
  }

  public clear(): void {
    this.machine.clearOutput();
  }
}
