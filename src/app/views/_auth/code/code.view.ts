import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked, ViewChild } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import type { TypeAddress, TypeInstructionsData_Table } from "@app/Types";
import { Utils } from "@app/Utils";
import { type DescriptionLang, describeWord, type InstructionDescription } from "@core/engine/describe";
import { MachineService } from "@core/machine/machine.service";
import { bitsToHex, toAddress } from "@core/numbers";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { VirtualTableColumnDirective, VirtualTableComponent } from "@shared/components/virtual-table/virtual-table.component";
import { FromBaseToBasePipe } from "@shared/pipes/numbers/numbers.pipes";
import { mediaSignal, NARROW } from "@shared/utils/media";
import { map } from "rxjs";
import { CardDirective, CardWidgetDirective } from "../../../__shared/directives/card/card.directive";

@Component({
  selector: "view-code",
  templateUrl: "./code.view.html",
  styleUrls: ["./code.view.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardDirective, CardWidgetDirective, VirtualTableComponent, VirtualTableColumnDirective, TranslatePipe, FromBaseToBasePipe],
})
export class CodeView {
  machine = inject(MachineService);
  private translate = inject(TranslateService);

  @ViewChild(VirtualTableComponent) private table?: VirtualTableComponent<TypeInstructionsData_Table>;

  /** On a narrow screen, first what the instruction is and does, and the bits last */
  private readonly narrow = mediaSignal(NARROW);
  public readonly columns = computed(() =>
    this.narrow()
      ? ["Address", "Instruction", "Stage", "Description", "Text", "Hexadecimal", "Binary"]
      : ["Address", "Text", "Binary", "Hexadecimal", "Stage", "Instruction", "Description"],
  );
  public maxHeightCard: string = "75vh";

  /** Where each instruction is in this cycle (one Map for the whole table, instead of a search for each row) */
  public readonly stages = this.machine.state.stages;

  /** The button of the card reads the memory again (a word written by the user in the memory view, for example) */
  private readonly refreshes = signal(0);

  /**
   * The rows: every word of the memory with its instruction. They change when a program is loaded (in one go, not row by
   * row); the stages of the pipeline change every cycle and only touch the classes of the rows
   */
  public readonly rows = computed<TypeInstructionsData_Table[]>(() => {
    this.machine.state.loads();
    this.refreshes();
    const code = new Map(this.machine.state.code().map((instruction) => [instruction.address.toUpperCase(), instruction]));
    return untracked(() => this.machine.memory.getAllMemoryWord()).map((word, index) => {
      const address = toAddress(index * 4);
      const hexCode = `0x${bitsToHex(word.binary, 8)}`;
      const instruction = code.get(address.toUpperCase());
      return {
        index,
        row: index,
        address,
        code: instruction?.code ?? hexCode,
        text: instruction?.text ?? "",
        instruction:
          instruction?.instruction ?? (instruction ? Utils.convertHexCodeToTextMachineInstructionDLX(instruction.code, index * 4) : ""),
        stage: "",
      } as TypeInstructionsData_Table;
    });
  });

  public readonly trackByIndex = (index: number) => index;

  private readonly lang = toSignal(this.translate.onLangChange.pipe(map((event) => event.lang)), {
    initialValue: this.translate.getCurrentLang() ?? this.translate.getFallbackLang() ?? "es",
  });

  /** The labels of the program by address, to name the targets of the jumps and the data (the first label of each one) */
  private readonly labels = computed(() => {
    const labels = new Map<number, string>();
    for (const symbol of this.machine.state.symbols()) {
      const address = Number.parseInt(symbol.address, 16) >>> 0;
      if (!labels.has(address)) labels.set(address, symbol.name);
    }
    return labels;
  });

  /** The descriptions already made (the table only asks for the rows it draws); a new program or language empties it */
  private readonly descriptions = computed(() => {
    this.rows();
    this.labels();
    this.lang();
    return new Map<number, InstructionDescription | null>();
  });

  /** The row whose description is open in the footer of the card */
  public readonly selected = signal<number | null>(null);

  constructor() {
    // A new program closes the description
    effect(() => {
      this.machine.state.loads();
      untracked(() => this.selected.set(null));
    });
  }

  public readonly detail = computed(() => {
    const index = this.selected();
    const row = index === null ? undefined : this.rows()[index];
    const description = row ? this.describe(row) : null;
    return row && description ? { row, description } : null;
  });

  /** What an instruction does (null for the words that are not part of the code: the data) */
  public describe(row: TypeInstructionsData_Table): InstructionDescription | null {
    if (row.instruction === "") return null;
    const cache = this.descriptions();
    if (!cache.has(row.row)) {
      const lang: DescriptionLang = this.lang() === "en" ? "en" : "es";
      cache.set(row.row, describeWord(Number.parseInt(row.code, 16) >>> 0, { address: row.row * 4, labels: this.labels(), lang }));
    }
    return cache.get(row.row) ?? null;
  }

  public select(row: TypeInstructionsData_Table | null): void {
    this.selected.set(row === null || this.selected() === row.row ? null : row.row);
  }

  /** The button of the card: the table goes to main (or to the first instruction) and its description opens */
  public goToEntry(): void {
    const entry = this.machine.entry();
    if (entry === null) return;
    const index = Math.floor(entry.address / 4);
    this.table?.scrollToIndex(index);
    this.selected.set(index);
  }

  public readonly entryAddress = computed(() => {
    const entry = this.machine.entry();
    return entry === null ? "" : toAddress(entry.address);
  });

  /** The class of a row: the stage of its instruction */
  public readonly rowClass = (row: TypeInstructionsData_Table) => this.stageClass(row.address);

  public refresh(): void {
    this.refreshes.update((n) => n + 1);
  }

  /** The class of a row: the stage of its instruction (the floating point units, as intEX) */
  public stageClass(address: TypeAddress): string {
    const stage = this.stages().get(address);
    if (stage === undefined || stage === "") return "";
    return ["faddEX", "fmultEX", "fdivEX"].includes(stage) ? "stage-intEX" : `stage-${stage}`;
  }

  /** The colour of a stage in the description: the one of the pipeline (the floating point units, the first cycle) */
  public stageBadge(stage: string): string {
    return ["faddEX", "fmultEX", "fdivEX"].includes(stage) ? `${stage}_1` : stage === "EX" ? "stage-intEX" : `stage-${stage}`;
  }

  /** The height of the table when its card unfolds, is restored or fills the screen (it measures itself: ViewportResizeDirective) */
  public resizeCard(height: string): void {
    this.maxHeightCard = height;
  }
}
