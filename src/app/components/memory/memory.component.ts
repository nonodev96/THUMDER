import { Component, OnInit } from '@angular/core';
import { MachineService } from "../../__core/machine/machine.service";
import { TableVirtualScrollDataSource } from "ng-table-virtual-scroll";

const DATA = Array.from({length: 1000}, (v, i) => ({
  id: i + 1,
  decimal: `Element #${i + 1}`,
  hexadecimal: `Element #${i + 1}`
}));

@Component({
  selector: 'thumder-memory',
  templateUrl: './memory.component.html',
  styleUrls: ['./memory.component.scss']
})
export class MemoryComponent implements OnInit {

  displayedColumns = ['id', 'decimal', 'hexadecimal'];

  dataSource = new TableVirtualScrollDataSource(DATA);

  constructor(public machine: MachineService) {
  }

  ngOnInit(): void {
  }

}
