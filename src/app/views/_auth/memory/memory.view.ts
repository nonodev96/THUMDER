import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MachineService } from "../../../__core/machine/machine.service";
import { TableVirtualScrollDataSource } from "ng-table-virtual-scroll";
import { MatSort } from "@angular/material/sort";
import { Int32 } from "../../../__core/interfaces";

interface EventTargetExtend extends EventTarget {
  value: string
}

@Component({
  selector: 'app-memory',
  templateUrl: './memory.view.html',
  styleUrls: []
})
export class MemoryView implements OnInit, AfterViewInit {

  @ViewChild(MatSort, {static: true}) sort: MatSort;

  displayedColumnsMemory: string[] = ['Register', 'Decimal', 'Hexadecimal', 'Binary'];
  dataSourceMemory = new TableVirtualScrollDataSource<number>();

  registerMemoryToEdit = 0

  constructor(public machine: MachineService) {
    this.dataSourceMemory.filter = null
    this.dataSourceMemory.sort = this.sort;

    this.machine.memory[this.registerMemoryToEdit] = new Int32()
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.dataSourceMemory.data = this.machine.memory.map((value, index) => {
      return index
    })
  }

  change() {
    this.machine.memory[0].value = 10
    console.log(this.machine.memory)
  }

  changeRegisterMemoryID(target: EventTargetExtend | any) {
    const index = parseInt(target.value)
    if (index >= 0 && index <= this.machine.memory.length) {
      this.registerMemoryToEdit = index;
      this.machine.memory[this.registerMemoryToEdit] = new Int32()
    }
  }

  changeMemory(target: EventTargetExtend | any) {
    try {
      this.machine.memory[this.registerMemoryToEdit].value = parseInt(target.value)
    } catch (e) {
      this.machine.memory[this.registerMemoryToEdit].value = 0
    }
  }
}
