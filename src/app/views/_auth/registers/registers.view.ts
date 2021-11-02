import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MachineService } from "../../../__core/machine/machine.service";
import { TableVirtualScrollDataSource } from "ng-table-virtual-scroll";
import { MatSort } from "@angular/material/sort";
import { TypeData } from "../../../types";
import { EditRegisterBinary32Component } from "../../../components/modals/edit-register-binary32/edit-register-binary32.component";
import { MACHINE_REGISTERS_C, MACHINE_REGISTERS_F, MACHINE_REGISTERS_R, MACHINE_REGISTERS_D } from "../../../CONSTAST";

@Component({
  selector: 'view-registers',
  templateUrl: './registers.view.html',
  styleUrls: []
})
export class RegistersView implements OnInit, AfterViewInit {

  public maxHeightCard: number = 60;

  @ViewChild(EditRegisterBinary32Component) editRegisterBinary32Component: EditRegisterBinary32Component;

  typeDataSelected: TypeData = 'Byte';
  displayedColumns = ['Register', 'Hexadecimal', 'Binary', 'Byte'];
  dataSource = new TableVirtualScrollDataSource<string>(MACHINE_REGISTERS_C as string[]);

  dataSourceR = new TableVirtualScrollDataSource<number>(MACHINE_REGISTERS_R as number[]);
  dataSourceF = new TableVirtualScrollDataSource<number>(MACHINE_REGISTERS_F as number[]);
  dataSourceD = new TableVirtualScrollDataSource<number>(MACHINE_REGISTERS_D as number[]);

  displayedColumnsR = ['Register', 'Hexadecimal', 'Binary', 'Integer'];
  displayedColumnsF = ['Register', 'Hexadecimal', 'Binary', 'Uint8Array', 'Float'];
  displayedColumnsD = ['Register', 'Hexadecimal', 'Binary', 'Uint8Array', 'Double'];

  @ViewChild(MatSort, {static: true}) sort: MatSort;

  constructor(public machine: MachineService) {
  }

  ngOnInit(): void {
    this.dataSource.filter = null;
    this.dataSource.sort = this.sort;
  }

  ngAfterViewInit(): void {
    const list_cards = ['registers_R_id', 'registers_F_id', 'registers_D_id'];
    for (const card_id of list_cards) {
      window.jQuery('#' + card_id).CardWidget('collapse');
    }

    window.jQuery('#registers_Control_id, #registers_R_id, #registers_F_id, #registers_D_id')
      .on('expanded.lte.cardwidget', ($event) => {
        this.resizeCards(60);
      })
    window.jQuery('#registers_Control_id, #registers_R_id, #registers_F_id, #registers_D_id')
      .on('minimized.lte.cardwidget', ($event) => {
        this.resizeCards(60);
      })
    window.jQuery('#registers_Control_id, #registers_R_id, #registers_F_id, #registers_D_id')
      .on('maximized.lte.cardwidget', ($event) => {
        this.resizeCards(80);
      })
  }

  changeTypeDataInTableRegisters(typeData: TypeData) {
    this.typeDataSelected = typeData;
    this.displayedColumns[3] = typeData.toString();
  }

  refresh() {
    this.dataSource.filter = null;
    this.dataSource.data = [...this.dataSource.data];

    this.dataSourceR.filter = null;
    this.dataSourceR.data = [...this.dataSourceR.data];

    this.dataSourceF.filter = null;
    this.dataSourceF.data = [...this.dataSourceF.data];

    this.dataSourceD.filter = null;
    this.dataSourceD.data = [...this.dataSourceD.data];
  }

  test() {
    this.dataSource.data.push('PC')
    console.log(this.dataSource.data);
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  private resizeCards(newHeightCard) {
    this.maxHeightCard = newHeightCard;
  }
}
