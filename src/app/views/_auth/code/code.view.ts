import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { TableVirtualScrollDataSource } from "ng-table-virtual-scroll";
import { MatSort } from "@angular/material/sort";
import { MachineService } from "../../../__core/machine/machine.service";
import { Utils } from "../../../Utils";

const stages: TypeStage[] = ['', 'IF', 'ID', 'EX', 'MEM', 'WB', 'trap'];
const stages_reverse: TypeStage[] = ['IF', 'ID', 'EX', 'MEM', 'WB', ''];

export type TypeStage = '' | 'IF' | 'ID' | 'EX' | 'MEM' | 'WB' | 'trap'
export type TypeTableCode = {
  line: number,
  address: number,
  code: number,
  stage: TypeStage;
  instruction: string
}

@Component({
  selector: 'app-code',
  templateUrl: './code.view.html',
  styleUrls: []
})
export class CodeView implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatSort, {static: true}) sort: MatSort;

  displayedColumnsMemory: string[] = ['Line', 'Address', 'Code', 'Stage', 'Instruction'];
  dataSourceMemory = new TableVirtualScrollDataSource<TypeTableCode>();
  array_test: TypeTableCode[] = []
  i_clear = 0;
  i_if = 0;
  i_id = 0;
  i_ex = 0;
  i_me = 0;
  i_wb = 0;
  arr = [];

  constructor(public machine: MachineService) {
    this.dataSourceMemory.filter = null
    this.dataSourceMemory.sort = this.sort;

    this.array_test.push({line: 0, address: 123, code: 123, stage: stages[0], instruction: "add r2, r2, #0"})
    this.array_test.push({line: 1, address: 123, code: 123, stage: stages[0], instruction: "add r2, r2, #0"})
    this.array_test.push({line: 2, address: 123, code: 123, stage: stages[0], instruction: "add r2, r2, #0"})
    this.array_test.push({line: 3, address: 123, code: 123, stage: stages[0], instruction: "add r2, r2, #0"})
    this.array_test.push({line: 4, address: 123, code: 123, stage: stages[0], instruction: "add r2, r2, #0"})
    this.array_test.push({line: 5, address: 123, code: 123, stage: stages[0], instruction: "add r2, r2, #0"})
    this.array_test.push({line: 6, address: 123, code: 123, stage: stages[0], instruction: "add r2, r2, #0"})
    this.array_test.push({line: 7, address: 123, code: 123, stage: stages[0], instruction: "add r2, r2, #0"})
    this.array_test.push({line: 8, address: 123, code: 123, stage: stages[0], instruction: "add r2, r2, #0"})
    this.array_test.push({line: 9, address: 123, code: 123, stage: stages[0], instruction: "add r2, r2, #0"})
    this.array_test.push({line: 9, address: 123, code: 123, stage: stages[0], instruction: "trap"})
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.dataSourceMemory.data = this.array_test
  }

  ngOnDestroy(): void {
  }


  /**
   ["IF", "--", "--", "--", "--", "--", "--", "--", "--", "--", "--"]
   ["ID", "IF", "--", "--", "--", "--", "--", "--", "--", "--", "--"]
   ["EX", "ID", "IF", "--", "--", "--", "--", "--", "--", "--", "--"]
   ["ME", "EX", "ID", "IF", "--", "--", "--", "--", "--", "--", "--"]
   ["WB", "ME", "EX", "ID", "IF", "--", "--", "--", "--", "--", "--"]
   ["--", "WB", "ME", "EX", "ID", "IF", "--", "--", "--", "--", "--"]
   ["--", "--", "WB", "ME", "EX", "ID", "IF", "--", "--", "--", "--"]
   ["--", "--", "--", "WB", "ME", "EX", "ID", "IF", "--", "--", "--"]
   ["--", "--", "--", "--", "WB", "ME", "EX", "ID", "IF", "--", "--"]
   ["--", "--", "--", "--", "--", "WB", "ME", "EX", "ID", "IF", "--"]
   ["--", "--", "--", "--", "--", "xx", "WB", "ME", "EX", "ID", "IF"]
   ["IF", "--", "--", "--", "--", "--", "--", "WB", "ME", "EX", "ID"]
   ["ID", "IF", "--", "--", "--", "--", "--", "--", "WB", "ME", "EX"]
   ["EX", "ID", "IF", "--", "--", "--", "--", "--", "--", "WB", "ME"]
   ["ME", "EX", "ID", "IF", "--", "--", "--", "--", "--", "--", "WB"]
   ["WB", "ME", "EX", "ID", "IF", "--", "--", "--", "--", "--", "--"]
   */
  next() {
    this.array_test[this.i_clear].stage = stages_reverse[5];
    this.array_test[this.i_wb].stage = stages_reverse[4];
    this.array_test[this.i_me].stage = stages_reverse[3];
    this.array_test[this.i_ex].stage = stages_reverse[2];
    this.array_test[this.i_id].stage = stages_reverse[1];
    this.array_test[this.i_if].stage = stages_reverse[0];

    this.i_if = Utils.modNotNegative((this.i_if + 1), this.array_test.length);
    this.i_wb = Utils.modNotNegative((this.i_if - 4), this.array_test.length);
    this.i_me = Utils.modNotNegative((this.i_if - 3), this.array_test.length);
    this.i_ex = Utils.modNotNegative((this.i_if - 2), this.array_test.length);
    this.i_id = Utils.modNotNegative((this.i_if - 1), this.array_test.length);

    if (this.i_clear < this.array_test.length) {
      if (this.i_clear > 0) {
        this.i_clear = Utils.modNotNegative((this.i_clear + 1), this.array_test.length);
        this.i_if = Utils.modNotNegative((this.i_clear + 5), this.array_test.length);
        this.i_id = Utils.modNotNegative((this.i_clear + 4), this.array_test.length);
        this.i_ex = Utils.modNotNegative((this.i_clear + 3), this.array_test.length);
        this.i_me = Utils.modNotNegative((this.i_clear + 2), this.array_test.length);
        this.i_wb = Utils.modNotNegative((this.i_clear + 1), this.array_test.length);
      } else {
        this.i_clear = Utils.modNotNegative((this.i_if - 5), this.array_test.length);
      }
    }
  }
}
