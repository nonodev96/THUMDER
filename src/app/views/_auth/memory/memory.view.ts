import { UpperCasePipe } from "@angular/common";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, inject, untracked, ViewChild } from "@angular/core";
import type { TypeAddress, TypeDataDisplayColumn } from "@app/Types";
import { EditMemoryBinary32Component } from "@components/modals/edit-memory-binary32/edit-memory-binary32.component";
import { MachineService } from "@core/machine/machine.service";
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
import { ModalOpenDirective } from "../../../__shared/directives/bootstrap/modal.directive";
import { CardDirective, CardWidgetDirective } from "../../../__shared/directives/card/card.directive";

@Component({
  selector: "view-memory",
  templateUrl: "./memory.view.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: [],
  imports: [
    CardDirective,
    CardWidgetDirective,
    ModalOpenDirective,
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

  @ViewChild(EditMemoryBinary32Component)
  public editBinary32Component!: EditMemoryBinary32Component;

  // "Address-0", "Address-1", "Address-2", "Address-3"
  public displayedColumnsMemory: string[] = ["Address", "Hexadecimal", "Binary", "Word"];
  /** The rows: the index of each word of the memory */
  public dataSourceMemory: number[] = [];
  public typeDataSelected: TypeDataDisplayColumn = "Word";

  /** How the words of the memory can be shown */
  public readonly dataTypes: { key: TypeDataDisplayColumn; label: string; wide?: boolean }[] = [
    { key: "Byte", label: "MACHINE.TYPE_BYTES" },
    { key: "HalfWord", label: "MACHINE.TYPE_HALF_WORDS" },
    { key: "Word", label: "MACHINE.TYPE_WORD" },
    { key: "ASCII", label: "MACHINE.TYPE_ASCII" },
    { key: "Float", label: "MACHINE.TYPE_FLOAT" },
    { key: "Double", label: "MACHINE.TYPE_DOUBLE" },
    { key: "InstructionCode", label: "MACHINE.TYPE_INSTRUCTION", wide: true },
    { key: "Address-0-1-2-3", label: "MACHINE.TYPE_BYTES_BY_ADDRESS", wide: true },
    { key: "HalfWord-0-1", label: "MACHINE.TYPE_HALF_WORDS_BY_ADDRESS", wide: true },
  ];
  public maxHeightCard: string = "75vh";

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

  public refresh(): void {
    this.dataSourceMemory = [...this.dataSourceMemory];
    this.cdr.markForCheck();
  }

  /** The height of the table when its card unfolds, is restored or fills the screen (it measures itself: ViewportResizeDirective) */
  public resizeCard(height: string): void {
    this.maxHeightCard = height;
  }

  public getInstructionDLXFromIndex(index: number): string {
    const address: TypeAddress = `0x${index.toString(16).padStart(8, "0")}`;
    return this.machine.code.get(address)?.instruction ?? "";
  }
}
