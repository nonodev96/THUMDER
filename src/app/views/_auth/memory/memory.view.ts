import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MachineService } from "../../../__core/machine/machine.service";
import { TableVirtualScrollDataSource } from "ng-table-virtual-scroll";
import { MatSort } from "@angular/material/sort";


@Component({
  selector: 'app-memory',
  templateUrl: './memory.view.html',
  styleUrls: []
})
export class MemoryView implements OnInit, AfterViewInit {

  @ViewChild(MatSort, {static: true}) sort: MatSort;

  displayedColumnsMemory: string[] = ['Register', 'Decimal', 'Hexadecimal', 'Binary'];
  dataSourceMemory = new TableVirtualScrollDataSource<number>();

  constructor(public machine: MachineService) {
    this.dataSourceMemory.filter = null
    this.dataSourceMemory.sort = this.sort;
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.dataSourceMemory.data = this.machine.memory.map((value, index) => {
      return index
    })
  }

  change() {
  }

}
