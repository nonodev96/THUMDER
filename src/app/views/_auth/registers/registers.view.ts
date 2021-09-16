import { Component, OnInit, ViewChild } from '@angular/core';
import { MachineService } from "../../../__core/machine/machine.service";
import { Int32 } from 'app/__core/interfaces';
import { TableVirtualScrollDataSource } from "ng-table-virtual-scroll";
import { MatSort } from "@angular/material/sort";

export const MACHINE_REGISTERS = [
  "PC", "IMAR", "IR", "A", "AHI", "B", "BHI", "BTA", "ALU", "ALUHI", "FPSR", "DMAR", "SDR", "SDRHI", "LDR", "LDRHI"
]

export const MACHINE_REGISTERS_R = Array.from({length: 32}, (v, i) => (
  i
));
export const MACHINE_REGISTERS_F = Array.from({length: 32}, (v, i) => (
  i
));
export const MACHINE_REGISTERS_D = Array.from({length: 16}, (v, i) => (
  i
));


@Component({
  selector: 'app-registers',
  templateUrl: './registers.view.html',
  styleUrls: []
})
export class RegistersView implements OnInit {


  list_registers = MACHINE_REGISTERS

  displayedColumns = ['Register', 'Decimal', 'Hexadecimal', 'Binary'];
  dataSource = new TableVirtualScrollDataSource<string>(MACHINE_REGISTERS);
  dataSourceR = new TableVirtualScrollDataSource<number>(MACHINE_REGISTERS_R);
  dataSourceF = new TableVirtualScrollDataSource<number>(MACHINE_REGISTERS_F);
  dataSourceD = new TableVirtualScrollDataSource<number>(MACHINE_REGISTERS_D);

  @ViewChild(MatSort, {static: true}) sort: MatSort;

  constructor(public machine: MachineService) {
    machine.registers.R[12] = new Int32()
    machine.registers.R[12].value = 12002
  }

  ngOnInit(): void {
    this.dataSource.filter = null
    this.dataSource.sort = this.sort;
  }

  registerControl($event: Event) {
    document.getElementById('registerControlId')
  }

  refresh() {
    this.dataSource.filter = null;
  }

  test() {
    this.dataSource.data.push('PC')
    console.log(this.dataSource.data)
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
