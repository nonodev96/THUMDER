import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MachineService } from "../../../__core/machine/machine.service";
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
export class RegistersView implements OnInit, AfterViewInit {

  // items
  itemSelected = 0;
  registerToEditControl = 'PC';

  registerToEdit: 'R' | 'F' | 'D' = 'R';
  dataRegisters = {
    'R': {
      registers: 32,
      size: 32
    },
    'F': {
      registers: 32,
      size: 32
    },
    'D': {
      registers: 16,
      size: 64
    },
    DEFAULT: {
      registers: 32,
      size: 32
    }
  };

  list_REGISTERS = MACHINE_REGISTERS;
  displayedColumns = ['Register', 'Hexadecimal', 'Binary', 'Uint8Array', 'Word'];
  displayedColumnsR = ['Register', 'Hexadecimal', 'Binary', 'Uint8Array', 'Integer'];
  displayedColumnsF = ['Register', 'Hexadecimal', 'Binary', 'Uint8Array', 'Float'];
  displayedColumnsD = ['Register', 'Hexadecimal', 'Binary', 'Uint8Array', 'Double'];
  dataSource = new TableVirtualScrollDataSource<string>(MACHINE_REGISTERS);
  dataSourceR = new TableVirtualScrollDataSource<number>(MACHINE_REGISTERS_R);
  dataSourceF = new TableVirtualScrollDataSource<number>(MACHINE_REGISTERS_F);
  dataSourceD = new TableVirtualScrollDataSource<number>(MACHINE_REGISTERS_D);

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
  }

  refresh() {
    this.dataSource.filter = null;
  }

  test() {
    this.dataSource.data.push('PC')
    console.log(this.dataSource.data);
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  createRange(number: number) {
    return new Array(number);
  }

  prepareModal(registerToEdit: 'R' | 'F' | 'D') {
    this.itemSelected = 0;
    this.registerToEdit = registerToEdit;
  }

  selectOptionRegisterVector(target: any) {
    this.itemSelected = target.value;
  }

  selectOptionRegisterControl(target: any) {
    this.registerToEditControl = target.value;
  }

  changeRegister(target: any) {
    if (this.registerToEdit === 'R') {
      this.machine.registers[this.registerToEdit][this.itemSelected].value = parseInt(target.value);
    } else {
      this.machine.registers[this.registerToEdit][this.itemSelected].value = parseFloat(target.value);
    }
  }

  changeControlRegister(target: any) {
    this.machine.registers[this.registerToEditControl].value = parseInt(target.value);
  }
}
