import { AfterViewInit, Component, OnInit, ViewChild } from "@angular/core";
import { MachineService } from "../../../__core/machine/machine.service";
import { TableVirtualScrollDataSource } from "ng-table-virtual-scroll";
import { MatSort } from "@angular/material/sort";
import { TypeData, TypeDataRepresentation } from "../../../Types";
import {
  EditRegisterBinary32Component
} from "../../../components/modals/edit-register-binary32/edit-register-binary32.component";
import { MACHINE_REGISTERS_C, MACHINE_REGISTERS_F, MACHINE_REGISTERS_R, MACHINE_REGISTERS_D } from "../../../CONSTANTS";

@Component({
  selector:    "view-registers",
  templateUrl: "./registers.view.html",
  styleUrls:   []
})
export class RegistersView implements OnInit, AfterViewInit {

  @ViewChild(MatSort, { static: true })
  public sort: MatSort;

  @ViewChild(EditRegisterBinary32Component)
  public editRegisterBinary32Component: EditRegisterBinary32Component;

  public maxHeightCard: string = "60vh";
  public typeDataSelected: TypeData = "Byte";
  public typeDataSelectedFloat: TypeDataRepresentation = "Binary";
  public typeDataSelectedDouble: TypeDataRepresentation = "Binary";
  public dataSource = new TableVirtualScrollDataSource<string>(MACHINE_REGISTERS_C as string[]);
  public dataSourceR = new TableVirtualScrollDataSource<number>(MACHINE_REGISTERS_R as number[]);
  public dataSourceF = new TableVirtualScrollDataSource<number>(MACHINE_REGISTERS_F as number[]);
  public dataSourceD = new TableVirtualScrollDataSource<number>(MACHINE_REGISTERS_D as number[]);
  public displayedColumns: string[] = [ "Register", "Hexadecimal", "Binary", "Byte" ];
  public displayedColumnsR: string[] = [ "Register", "Hexadecimal", "Binary", "Integer" ];
  public displayedColumnsF: string[] = [ "Register", "Hexadecimal", "Binary" /*Binary or Uint8Array*/, "Float" ];
  public displayedColumnsD: string[] = [ "Register", "Hexadecimal", "Binary" /*Binary or Uint8Array*/, "Double" ];


  constructor(public machine: MachineService) {
  }

  ngOnInit(): void {
    this.dataSource.filter = null;
    this.dataSource.sort = this.sort;
  }

  ngAfterViewInit(): void {
    const list_cards = [ "registers_R_id", "registers_F_id", "registers_D_id" ];
    for (const card_id of list_cards) {
      window.jQuery("#" + card_id).CardWidget("collapse");
    }

    window.jQuery("#registers_Control_id, #registers_R_id, #registers_F_id, #registers_D_id")
      .on("expanded.lte.cardwidget", (/*$event*/) => {
        this.resizeCards("60vh");
      });
    window.jQuery("#registers_Control_id, #registers_R_id, #registers_F_id, #registers_D_id")
      .on("minimized.lte.cardwidget", (/*$event*/) => {
        this.resizeCards("60vh");
      });
    window.jQuery("#registers_Control_id, #registers_R_id, #registers_F_id, #registers_D_id")
      .on("maximized.lte.cardwidget", (/*$event*/) => {
        this.resizeCards("100%");
      });
  }

  public changeTypeDataInTableRegisters(typeData: TypeData): void {
    this.typeDataSelected = typeData;
    this.displayedColumns[3] = typeData.toString();
  }

  public changeTypeDataInTableFloatRegisters(typeData: TypeDataRepresentation): void {
    this.typeDataSelectedFloat = typeData;
    this.displayedColumnsF[2] = typeData.toString();
  }

  public changeTypeDataInTableDoubleRegisters(typeData: TypeDataRepresentation): void {
    this.typeDataSelectedDouble = typeData;
    this.displayedColumnsD[2] = typeData.toString();
  }

  public refresh(): void {
    this.dataSource.filter = null;
    this.dataSource.data = [ ...this.dataSource.data ];

    this.dataSourceR.filter = null;
    this.dataSourceR.data = [ ...this.dataSourceR.data ];

    this.dataSourceF.filter = null;
    this.dataSourceF.data = [ ...this.dataSourceF.data ];

    this.dataSourceD.filter = null;
    this.dataSourceD.data = [ ...this.dataSourceD.data ];

    window.dispatchEvent(new Event("resize"));
  }

  // test(): void {
  //   this.dataSource.data.push('PC');
  //   console.log(this.dataSource.data);
  // }
  // applyFilter(filterValue: string): void {
  //   this.dataSource.filter = filterValue.trim().toLowerCase();
  // }

  private resizeCards(height: string): void {
    this.maxHeightCard = height;
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 500);
  }
}
