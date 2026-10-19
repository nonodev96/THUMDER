import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, effect, inject, ViewChild } from "@angular/core";
import { MACHINE_REGISTERS_C, MACHINE_REGISTERS_D, MACHINE_REGISTERS_F, MACHINE_REGISTERS_R } from "@app/CONSTANTS";
import type { TypeData, TypeDataRepresentation, TypeRegister, TypeRegisterControl, TypeRegisterToEdit } from "@app/Types";
import { EditRegisterBinary32Component } from "@components/modals/edit-register-binary32/edit-register-binary32.component";
import { MachineService } from "@core/machine/machine.service";
import { EditRequestService } from "@core/services/edit/edit-request.service";
import { TranslatePipe } from "@ngx-translate/core";
import { VirtualTableColumnDirective, VirtualTableComponent } from "@shared/components/virtual-table/virtual-table.component";
import {
  Binary32ToASCIIPipe,
  Binary32ToBytesPipe,
  Binary32ToDecimal_IEEE754Pipe,
  Binary32ToHalfWordPipe,
  Binary32ToWordPipe,
  Binary64ToDecimal_IEEE754Pipe,
  BinaryByteToNumberPipe,
  BinaryGroupsPipe,
  BinaryToHexadecimal_FormatPipe,
  Uint_IEEE754_32_Pipe,
  Uint_IEEE754_64_Pipe,
} from "@shared/pipes/numbers/numbers.pipes";
import { CardDirective, CardWidgetDirective } from "../../../__shared/directives/card/card.directive";

/** The groups of registers, one tab each */
export type RegisterTab = "Control" | "R" | "F" | "D";

const TABS: { id: RegisterTab; label: string }[] = [
  { id: "Control", label: "MACHINE.TAB_CONTROL" },
  { id: "R", label: "MACHINE.TAB_INTEGER" },
  { id: "F", label: "MACHINE.TAB_FLOAT" },
  { id: "D", label: "MACHINE.TAB_DOUBLE" },
];

/** The kind of register of each tab, for the dialog that edits them */
const KIND_OF_TAB: Record<RegisterTab, TypeRegister> = { Control: "Control", R: "Integer", F: "Float", D: "Double" };

/** The tab chosen last (only this browser) */
const TAB_KEY = "registers_tab";

/** The width of a column of the table: `chars` characters of the monospace font, with the padding of the cell */
const width = (chars: number) => `calc(${chars}ch + 1rem)`;
/** The last column takes what is left of the card */
const last = (chars: number) => `minmax(${width(chars)}, 1fr)`;

/** How wide each representation is, in characters (core/numbers.ts: [000-000-000-000], [00000-00000]...) */
const CHARS: Record<string, number> = { Byte: 17, HalfWord: 13, Word: 12, ASCII: 17, Binary: 35, Uint8Array: 17 };

/**
 * The registers: one card with a tab for each group (control, integer, single and double precision), each one with its
 * table and the representations it can show. The tables are as wide as their values, and the name of each register stays
 * on the left when they scroll sideways.
 */
@Component({
  selector: "view-registers",
  templateUrl: "./registers.view.html",
  styleUrls: ["./registers.view.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CardDirective,
    CardWidgetDirective,
    TranslatePipe,
    Binary32ToASCIIPipe,
    Binary32ToBytesPipe,
    Binary32ToWordPipe,
    Binary32ToHalfWordPipe,
    Binary32ToDecimal_IEEE754Pipe,
    Binary64ToDecimal_IEEE754Pipe,
    BinaryToHexadecimal_FormatPipe,
    BinaryGroupsPipe,
    Uint_IEEE754_32_Pipe,
    Uint_IEEE754_64_Pipe,
    BinaryByteToNumberPipe,
    VirtualTableComponent,
    VirtualTableColumnDirective,
  ],
})
export class RegistersView {
  machine = inject(MachineService);
  private cdr = inject(ChangeDetectorRef);
  private editRequests = inject(EditRequestService);

  /** The registers written in the last cycle: their rows are lit (what each instruction changed, at a glance) */
  private readonly written = computed(
    () => new Set((this.machine.state.cycle()?.registers ?? []).map((change) => String(change.register))),
  );
  public readonly controlRowClass = (name: string) => (this.written().has(name) ? "row-written" : "");
  public readonly integerRowClass = (index: number) => (this.written().has(`R${index}`) ? "row-written" : "");
  public readonly floatRowClass = (index: number) => (this.written().has(`F${index}`) ? "row-written" : "");
  public readonly doubleRowClass = (index: number) =>
    this.written().has(`F${index}`) || this.written().has(`F${index + 1}`) ? "row-written" : "";

  @ViewChild(EditRegisterBinary32Component)
  public editRegisterBinary32Component!: EditRegisterBinary32Component;

  public readonly tabs = TABS;
  public tab: RegisterTab = RegistersView.savedTab();

  public maxHeightCard: string = "60vh";
  public typeDataSelected: TypeData = "Byte";
  public typeDataSelectedFloat: TypeDataRepresentation = "Binary";
  public typeDataSelectedDouble: TypeDataRepresentation = "Binary";
  public readonly controlTypes: { key: TypeData; label: string }[] = [
    { key: "Byte", label: "MACHINE.TYPE_BYTES" },
    { key: "HalfWord", label: "MACHINE.TYPE_HALF_WORDS" },
    { key: "Word", label: "MACHINE.TYPE_WORD" },
    { key: "ASCII", label: "MACHINE.ASCII" },
  ];
  public readonly floatTypes: { key: TypeDataRepresentation; label: string }[] = [
    { key: "Binary", label: "MACHINE.BINARY" },
    { key: "Uint8Array", label: "MACHINE.UINT8ARRAY" },
  ];
  public dataSource: TypeRegisterControl[] = [...(MACHINE_REGISTERS_C as TypeRegisterControl[])];
  public dataSourceR: number[] = [...(MACHINE_REGISTERS_R as number[])];
  public dataSourceF: number[] = [...(MACHINE_REGISTERS_F as number[])];
  public dataSourceD: number[] = [...(MACHINE_REGISTERS_D as number[])];
  public displayedColumns: string[] = ["Register", "Hexadecimal", "Binary", "Byte"];
  public displayedColumnsR: string[] = ["Register", "Hexadecimal", "Binary", "Integer"];
  public displayedColumnsF: string[] = ["Register", "Hexadecimal", "Binary" /*Binary or Uint8Array*/, "Float"];
  public displayedColumnsD: string[] = ["Register", "Hexadecimal", "Binary" /*Binary or Uint8Array*/, "Double"];

  /** The widths of the columns, as wide as their values */
  public readonly widths = {
    register: width(9),
    integerRegister: width(9),
    doubleRegister: width(9),
    hex: width(12),
    hex64: width(18),
    binary: width(CHARS.Binary),
    binary64: width(71),
    uint8: width(CHARS.Uint8Array),
    uint8_64: width(33),
    control: (type: string) => last(CHARS[type] ?? 17),
    integer: last(10),
    float: last(22),
    double: last(24),
  };

  constructor() {
    // The tables read the registers of MachineService: they are drawn again when the values change (a cycle, an edit)
    effect(() => {
      this.machine.state.values();
      this.machine.state.loads();
      this.cdr.markForCheck();
    });
  }

  private static savedTab(): RegisterTab {
    try {
      const saved = localStorage.getItem(TAB_KEY);
      return TABS.some((tab) => tab.id === saved) ? (saved as RegisterTab) : "Control";
    } catch {
      return "Control";
    }
  }

  /** The table as wide as its columns (it scrolls sideways in a narrower card) */
  public minWidth(columns: string[]): string {
    return `calc(${columns.map((column) => column.replace(/^minmax\(([^,]+),.*$/, "$1")).join(" + ")})`;
  }

  public get controlWidths(): string[] {
    return [this.widths.register, this.widths.hex, this.widths.binary, this.widths.control(this.typeDataSelected)];
  }

  public get integerWidths(): string[] {
    return [this.widths.integerRegister, this.widths.hex, this.widths.binary, this.widths.integer];
  }

  public get floatWidths(): string[] {
    const middle = this.typeDataSelectedFloat === "Binary" ? this.widths.binary : this.widths.uint8;
    return [this.widths.integerRegister, this.widths.hex, middle, this.widths.float];
  }

  public get doubleWidths(): string[] {
    const middle = this.typeDataSelectedDouble === "Binary" ? this.widths.binary64 : this.widths.uint8_64;
    return [this.widths.doubleRegister, this.widths.hex64, middle, this.widths.double];
  }

  public select(tab: RegisterTab): void {
    this.tab = tab;
    try {
      localStorage.setItem(TAB_KEY, tab);
    } catch {
      // Without storage the tab is the first one the next time
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
    queueMicrotask(() => list?.querySelector<HTMLElement>(`#registersTab-${tab.id}`)?.focus());
  }

  // A new array of columns: the table only sees a change of the array, not of one of its items
  public changeTypeDataInTableRegisters(typeData: TypeData): void {
    this.typeDataSelected = typeData;
    this.displayedColumns = ["Register", "Hexadecimal", "Binary", typeData.toString()];
  }

  public changeTypeDataInTableFloatRegisters(typeData: TypeDataRepresentation): void {
    this.typeDataSelectedFloat = typeData;
    this.displayedColumnsF = ["Register", "Hexadecimal", typeData.toString(), "Float"];
  }

  public changeTypeDataInTableDoubleRegisters(typeData: TypeDataRepresentation): void {
    this.typeDataSelectedDouble = typeData;
    this.displayedColumnsD = ["Register", "Hexadecimal", typeData.toString(), "Double"];
  }

  /** Opens the dialog that edits the registers on the kind of the tab: on a register (its row) or on the last one chosen */
  public edit(register: TypeRegisterToEdit | null, event: Event): void {
    const kind = KIND_OF_TAB[this.tab];
    this.editRequests.editRegister(register === null ? { kind } : { kind, register }, event.currentTarget as HTMLElement);
  }

  public refresh(): void {
    this.dataSource = [...this.dataSource];
    this.dataSourceR = [...this.dataSourceR];
    this.dataSourceF = [...this.dataSourceF];
    this.dataSourceD = [...this.dataSourceD];
    this.cdr.markForCheck();
  }

  /** The height of the table when its card unfolds, is restored or fills the screen (it measures itself: ViewportResizeDirective) */
  public resizeCards(height: string): void {
    this.maxHeightCard = height;
  }
}
