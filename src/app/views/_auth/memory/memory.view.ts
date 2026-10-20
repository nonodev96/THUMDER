import { UpperCasePipe } from "@angular/common";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, effect, inject, untracked, ViewChild } from "@angular/core";
import type { TypeDataDisplayColumn } from "@app/Types";
import { EditMemoryBinary32Component } from "@components/modals/edit-memory-binary32/edit-memory-binary32.component";
import { MachineService } from "@core/machine/machine.service";
import { toAddress } from "@core/numbers";
import { EditRequestService, type MemoryTypeData } from "@core/services/edit/edit-request.service";
import { TranslatePipe } from "@ngx-translate/core";
import { VirtualTableColumnDirective, VirtualTableComponent } from "@shared/components/virtual-table/virtual-table.component";
import { PadStartFilterPipe } from "@shared/pipes/filter/LeftPadFilter.pipe";
import {
  Binary32ToASCIIPipe,
  Binary32ToBytesPipe,
  Binary32ToDecimal_IEEE754Pipe,
  Binary32ToHalfWordPipe,
  Binary64ToDecimal_IEEE754Pipe,
  BinaryByteToNumberPipe,
  BinaryToHexadecimal_FormatPipe,
  NumberToHexadecimalPipe,
  PadStartPipe,
} from "@shared/pipes/numbers/numbers.pipes";
import { mediaSignal, NARROW } from "@shared/utils/media";

/** The bytes of a value of each type */
const BYTES: Record<string, number> = { Byte: 1, ASCII: 1, HalfWord: 2, Word: 4, Float: 4, Double: 8 };

import { CardDirective, CardWidgetDirective } from "../../../__shared/directives/card/card.directive";
import { DetailsDirective } from "../../../__shared/directives/details/details.directive";

/**
 * The width of each column, in characters of the font of the table (monospace): what its values take and the padding of
 * the cell. The value columns (the last ones) can grow to fill the card; the table scrolls sideways only when the
 * columns shown do not fit, with the address fixed on the left
 */
const COLUMN_WIDTHS: Record<string, { ch: number; grow?: boolean }> = {
  Address: { ch: 13 },
  Hexadecimal: { ch: 13 },
  Binary: { ch: 35 },
  BinaryFloat: { ch: 35 },
  BinaryDouble: { ch: 35 },
  "Address-0": { ch: 13, grow: true },
  "Address-1": { ch: 13, grow: true },
  "Address-2": { ch: 13, grow: true },
  "Address-3": { ch: 13, grow: true },
  "HalfWord-0": { ch: 19, grow: true },
  "HalfWord-1": { ch: 19, grow: true },
  Bytes: { ch: 20, grow: true },
  HalfWord: { ch: 16, grow: true },
  Word: { ch: 14, grow: true },
  ASCII: { ch: 20, grow: true },
  Float: { ch: 26, grow: true },
  Double: { ch: 26, grow: true },
  InstructionCode: { ch: 28, grow: true },
};

/** The type of data the dialog that edits the memory opens with, from how the table shows the words */
const EDIT_TYPE: Partial<Record<TypeDataDisplayColumn, MemoryTypeData>> = {
  Byte: "Byte",
  "Address-0-1-2-3": "Byte",
  HalfWord: "HalfWord",
  "HalfWord-0-1": "HalfWord",
  Float: "Float",
  Double: "Double",
};

@Component({
  selector: "view-memory",
  templateUrl: "./memory.view.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ["./memory.view.scss"],
  imports: [
    CardDirective,
    CardWidgetDirective,
    DetailsDirective,
    UpperCasePipe,
    TranslatePipe,
    Binary32ToASCIIPipe,
    Binary32ToBytesPipe,
    Binary32ToHalfWordPipe,
    Binary32ToDecimal_IEEE754Pipe,
    Binary64ToDecimal_IEEE754Pipe,
    NumberToHexadecimalPipe,
    PadStartFilterPipe,
    BinaryToHexadecimal_FormatPipe,
    BinaryByteToNumberPipe,
    PadStartPipe,
    VirtualTableComponent,
    VirtualTableColumnDirective,
  ],
})
export class MemoryView {
  machine = inject(MachineService);
  private cdr = inject(ChangeDetectorRef);
  private editRequests = inject(EditRequestService);

  /** The words written and read in the last cycle (by the address of the word): their rows are lit */
  private readonly touched = computed(() => {
    const cycle = this.machine.state.cycle();
    const words = (address: number, bytes: number) =>
      Array.from({ length: Math.ceil(((address % 4) + bytes) / 4) }, (_, i) => (address - (address % 4) + i * 4) >>> 0);
    const written = new Set(
      (cycle?.memory ?? []).flatMap((store) => words(Number.parseInt(store.address, 16), BYTES[store.typeData] ?? 4)),
    );
    const read = new Set((cycle?.reads ?? []).flatMap((load) => words(load.address, load.bytes)));
    return { written, read };
  });
  public readonly rowClass = (index: number) => {
    const { written, read } = this.touched();
    return written.has(index) ? "row-written" : read.has(index) ? "row-read" : "";
  };

  @ViewChild(VirtualTableComponent) private table?: VirtualTableComponent<number>;

  @ViewChild(EditMemoryBinary32Component)
  public editBinary32Component!: EditMemoryBinary32Component;

  // "Address-0", "Address-1", "Address-2", "Address-3"
  public displayedColumnsMemory: string[] = ["Address", "Hexadecimal", "Binary", "Word"];
  /** The rows: the index of each word of the memory */
  public dataSourceMemory: number[] = [];
  public typeDataSelected: TypeDataDisplayColumn = "Word";

  /** How the words of the memory can be shown */
  public readonly dataTypes: { key: TypeDataDisplayColumn; label: string }[] = [
    { key: "Byte", label: "MACHINE.TYPE_BYTES" },
    { key: "HalfWord", label: "MACHINE.TYPE_HALF_WORDS" },
    { key: "Word", label: "MACHINE.TYPE_WORD" },
    { key: "ASCII", label: "MACHINE.TYPE_ASCII" },
    { key: "Float", label: "MACHINE.TYPE_FLOAT" },
    { key: "Double", label: "MACHINE.TYPE_DOUBLE" },
    { key: "InstructionCode", label: "MACHINE.TYPE_INSTRUCTION" },
    { key: "Address-0-1-2-3", label: "MACHINE.TYPE_BYTES_BY_ADDRESS" },
    { key: "HalfWord-0-1", label: "MACHINE.TYPE_HALF_WORDS_BY_ADDRESS" },
  ];
  /**
   * The height of the table in its card: what is left of the screen under what goes above it and over its footer and
   * the footer of the page (so its last rows are not under it), at least 16rem; filling the screen, all of it
   */
  public readonly tableHeight = "max(16rem, calc(100vh - 22rem - var(--thumder-footer-height)))";
  public maxHeightCard: string = this.tableHeight;

  constructor() {
    // The rows (an index per word): again when a program is loaded, since the configuration can change the size
    effect(() => {
      this.machine.state.loads();
      this.dataSourceMemory = untracked(() => this.machine.memory.getAllIndexByWord());
    });
    // The table reads the memory of MachineService: it is drawn again when the values change (a cycle, an edit)
    effect(() => {
      this.machine.state.values();
      this.machine.state.loads();
      this.cdr.markForCheck();
    });
  }

  public changeTypeDataInTable(typeData: TypeDataDisplayColumn): void {
    // Word, HalfWord, Float, Double, Bytes
    this.typeDataSelected = typeData;
    switch (typeData) {
      case "Byte":
        this.displayedColumnsMemory = ["Address", "Hexadecimal", "Binary", "Bytes"];
        break;
      case "HalfWord":
        this.displayedColumnsMemory = ["Address", "Hexadecimal", "Binary", "HalfWord"];
        break;
      case "Word":
        this.displayedColumnsMemory = ["Address", "Hexadecimal", "Binary", "Word"];
        break;
      case "ASCII":
        this.displayedColumnsMemory = ["Address", "Hexadecimal", "Binary", "ASCII"];
        break;
      case "Float":
        this.displayedColumnsMemory = ["Address", "Hexadecimal", "BinaryFloat", "Float"];
        break;
      case "Double":
        this.displayedColumnsMemory = ["Address", "Hexadecimal", "BinaryDouble", "Double"];
        break;
      case "InstructionCode":
        this.displayedColumnsMemory = ["Address", "Hexadecimal", "Binary", "InstructionCode"];
        break;
      case "Address-0-1-2-3":
        this.displayedColumnsMemory = ["Address", "Hexadecimal", "Address-0", "Address-1", "Address-2", "Address-3"];
        break;
      case "HalfWord-0-1":
        this.displayedColumnsMemory = ["Address", "Hexadecimal", "HalfWord-0", "HalfWord-1"];
        break;
    }
  }

  /** On a narrow screen the value goes next to the address, and the hexadecimal and the bits after it */
  private readonly narrow = mediaSignal(NARROW);
  public get columns(): string[] {
    if (!this.narrow()) return this.displayedColumnsMemory;
    const last = ["Hexadecimal", "Binary", "BinaryFloat", "BinaryDouble"];
    return [
      ...this.displayedColumnsMemory.filter((key) => !last.includes(key)),
      ...this.displayedColumnsMemory.filter((key) => last.includes(key)),
    ];
  }

  /** The width of a column (a size of the CSS grid) */
  public width(key: string): string {
    const column = COLUMN_WIDTHS[key] ?? { ch: 16, grow: true };
    return column.grow ? `minmax(${column.ch}ch, 1fr)` : `${column.ch}ch`;
  }

  /** The width under which the table scrolls sideways: the one of the columns shown */
  public get minWidth(): string {
    return `${this.displayedColumnsMemory.reduce((total, key) => total + (COLUMN_WIDTHS[key]?.ch ?? 16), 0)}ch`;
  }

  /** The button of the card: the table goes to the word of main (or of the first instruction) */
  public goToEntry(): void {
    const entry = this.machine.entry();
    if (entry !== null) this.table?.scrollToIndex(Math.floor(entry.address / 4));
  }

  public entryAddress(): string {
    const entry = this.machine.entry();
    return entry === null ? "" : toAddress(entry.address);
  }

  /** Opens the dialog that edits the memory: on the word of a row (as the table shows it), or where it was */
  public edit(index: number | null, event: Event): void {
    const opener = event.currentTarget as HTMLElement;
    if (index === null) this.editRequests.editMemory({}, opener);
    else this.editRequests.editMemory({ address: index, typeData: EDIT_TYPE[this.typeDataSelected] ?? "Word" }, opener);
  }

  public refresh(): void {
    this.dataSourceMemory = [...this.dataSourceMemory];
    this.cdr.markForCheck();
  }

  /** The height of the table when its card unfolds, is restored or fills the screen (it measures itself: ViewportResizeDirective) */
  public resizeCard(height: string): void {
    this.maxHeightCard = height;
  }

  public getInstructionDLXFromIndex(index: number): string {
    // The addresses of the code are in capitals (toAddress)
    return this.machine.code.get(toAddress(index))?.instruction ?? "";
  }
}
