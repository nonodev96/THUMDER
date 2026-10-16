import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, inject, ViewChild } from "@angular/core";
import { MACHINE_REGISTERS_C, MACHINE_REGISTERS_D, MACHINE_REGISTERS_F, MACHINE_REGISTERS_R } from "@app/CONSTANTS";
import type { TypeData, TypeDataRepresentation, TypeRegisterControl } from "@app/Types";
import { EditRegisterBinary32Component } from "@components/modals/edit-register-binary32/edit-register-binary32.component";
import { MachineService } from "@core/machine/machine.service";
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
  BinaryToHexadecimal_FormatPipe,
  Uint_IEEE754_32_Pipe,
  Uint_IEEE754_64_Pipe,
} from "@shared/pipes/numbers/numbers.pipes";
import { ModalOpenDirective } from "../../../__shared/directives/bootstrap/modal.directive";
import { CardDirective, CardWidgetDirective } from "../../../__shared/directives/card/card.directive";

@Component({
  selector: "view-registers",
  templateUrl: "./registers.view.html",
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CardDirective,
    CardWidgetDirective,
    ModalOpenDirective,
    TranslatePipe,
    Binary32ToASCIIPipe,
    Binary32ToBytesPipe,
    Binary32ToWordPipe,
    Binary32ToHalfWordPipe,
    Binary32ToDecimal_IEEE754Pipe,
    Binary64ToDecimal_IEEE754Pipe,
    BinaryToHexadecimal_FormatPipe,
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

  @ViewChild(EditRegisterBinary32Component)
  public editRegisterBinary32Component!: EditRegisterBinary32Component;

  public maxHeightCard: string = "60vh";
  public typeDataSelected: TypeData = "Byte";
  public typeDataSelectedFloat: TypeDataRepresentation = "Binary";
  public typeDataSelectedDouble: TypeDataRepresentation = "Binary";
  public dataSource: TypeRegisterControl[] = [...(MACHINE_REGISTERS_C as TypeRegisterControl[])];
  public dataSourceR: number[] = [...(MACHINE_REGISTERS_R as number[])];
  public dataSourceF: number[] = [...(MACHINE_REGISTERS_F as number[])];
  public dataSourceD: number[] = [...(MACHINE_REGISTERS_D as number[])];
  public displayedColumns: string[] = ["Register", "Hexadecimal", "Binary", "Byte"];
  public displayedColumnsR: string[] = ["Register", "Hexadecimal", "Binary", "Integer"];
  public displayedColumnsF: string[] = ["Register", "Hexadecimal", "Binary" /*Binary or Uint8Array*/, "Float"];
  public displayedColumnsD: string[] = ["Register", "Hexadecimal", "Binary" /*Binary or Uint8Array*/, "Double"];

  constructor() {
    // The tables read the registers of MachineService: they are drawn again when the values change (a cycle, an edit)
    effect(() => {
      this.machine.state.values();
      this.machine.state.loads();
      this.cdr.markForCheck();
    });
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

  public refresh(): void {
    this.dataSource = [...this.dataSource];
    this.dataSourceR = [...this.dataSourceR];
    this.dataSourceF = [...this.dataSourceF];
    this.dataSourceD = [...this.dataSourceD];
    this.cdr.markForCheck();
  }

  // applyFilter(filterValue: string): void {
  //   this.dataSource.filter = filterValue.trim().toLowerCase();
  // }

  /** The height of the table when its card unfolds, is restored or fills the screen (it measures itself: ViewportResizeDirective) */
  public resizeCards(height: string): void {
    this.maxHeightCard = height;
  }
}
