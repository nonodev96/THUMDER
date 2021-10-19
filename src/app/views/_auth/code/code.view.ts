import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { TableVirtualScrollDataSource } from "ng-table-virtual-scroll";
import { MatSort } from "@angular/material/sort";
import { MachineService } from "../../../__core/machine/machine.service";
import { TypeCode, TypeStage, TypeTableCode } from "../../../types";
import { Utils } from "../../../Utils";


@Component({
  selector: 'app-code',
  templateUrl: './code.view.html',
  styleUrls: []
})
export class CodeView implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatSort, {static: true}) sort: MatSort;

  displayedColumnsMemory: string[] = ['Address', 'Text', 'Binary', 'Hexadecimal', 'Stage', 'Instruction'];
  dataSourceCode = new TableVirtualScrollDataSource<TypeTableCode>();

  private privateStep = 0;

  constructor(public machine: MachineService) {
    this.dataSourceCode.filter = null
    this.dataSourceCode.sort = this.sort;
  }

  ngOnInit(): void {
    this.dataSourceCode.data = this.machine.memory.map((value, index) => {
      return {
        text: "",
        address: Utils.decimalToHexString(index * 4),
        binary: value.binary,
        stage: "",
        instruction: ""
      }
    });

    this.machine.getStepObservable().subscribe((realStep) => {
      this.privateStep = realStep;
    });

    this.machine.getCodeSimulationObservable().subscribe((typeTableCode) => {
      for (const data_code of typeTableCode) {
        const index = Math.round(Utils.hexadecimalToDecimal(data_code.address) / 4);
        this.setRow(index, data_code);
      }
    });

    this.machine.getStepSimulationObservable().subscribe((stepSimulation) => {
      const list_elements = this.machine.getListStatusPipeline(stepSimulation);

      for (const element of list_elements) {
        if (element != undefined && element.address !== "") {
          const index = Math.round(Utils.hexadecimalToDecimal(element.address) / 4);
          const data_code = this.machine.code.get(element.address);
          this.setRow(index, data_code, element.stage);
        }
      }
    });
  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
  }


  /**
   * 'IF' 'ID' 'intEX' 'MEM' 'WB' 'trap'
   * faddEX   --> 8
   * fmultEX  --> 8
   * fdivEX   --> 8
   * max size array ==> 8 + 8 + 8 + 6 = 30
   *
   */

  refreshDataSourceCode() {
    this.dataSourceCode.filter = null;
    this.dataSourceCode.data = [...this.dataSourceCode.data];
  }

  setRow(index: number, tableCode: TypeCode, stage: TypeStage = "") {
    this.dataSourceCode.data[index] = {
      text: tableCode.text,
      address: tableCode.address,
      instruction: tableCode.instruction,
      binary: this.machine.getMemory(index).binary,
      stage: stage,
    };
    this.refreshDataSourceCode();
  }

  /**
   *
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
  test() {

    // i_clear = 0;
    // i_if = 0;
    // i_id = 0;
    // i_ex = 0;
    // i_me = 0;
    // i_wb = 0;

    // const step_test: { step: number, data: TypeTableCode[] }[]
    //   = [
    //   {
    //     step: 0,
    //     data: []
    //   },
    //   {
    //     step: 1,
    //     data: [
    //       {"address": 256, "stage": "IF", "text": "$TEXT", "instruction": "addi r1, r0, 0x00"}
    //     ]
    //   },
    //   {
    //     step: 2,
    //     data: [
    //       {"address": 256, "stage": "ID", "text": "$TEXT", "instruction": "addi r1, r0, 0x0"},
    //       {"address": 260, "stage": "IF", "text": "main+0x4", "instruction": "addi r1, r0, 0x2"}
    //     ]
    //   },
    //   {
    //     step: 3,
    //     data: [
    //       {"address": 256, "stage": "intEX", "text": "$TEXT", "instruction": "addi r1, r0, 0x0"},
    //       {"address": 260, "stage": "ID", "text": "main+0x4", "instruction": "addi r1, r0, 0x2"},
    //       {"address": 264, "stage": "IF", "text": "main+0x8", "instruction": "addi r16, r0, 0x10"}
    //     ]
    //   },
    //   {
    //     step: 4,
    //     data: [
    //       {"address": 256, "stage": "MEM", "text": "$TEXT", "instruction": "addi r1, r0, 0x0"},
    //       {"address": 260, "stage": "intEX", "text": "main+0x4", "instruction": "addi r1, r0, 0x2"},
    //       {"address": 264, "stage": "ID", "text": "main+0x8", "instruction": "addi r16, r0, 0x10"},
    //       {"address": 268, "stage": "IF", "text": "main+0xc", "instruction": "addi r18, r0, 0x8"}
    //     ]
    //   },
    //   {
    //     step: 5,
    //     data: [
    //       {"address": 256, "stage": "WB", "text": "$TEXT", "instruction": "addi r1, r0, 0x0"},
    //       {"address": 260, "stage": "MEM", "text": "main+0x4", "instruction": "addi r1, r0, 0x2"},
    //       {"address": 264, "stage": "intEX", "text": "main+0x8", "instruction": "addi r16, r0, 0x10"},
    //       {"address": 268, "stage": "ID", "text": "main+0xc", "instruction": "addi r18, r0, 0x8"},
    //       {"address": 272, "stage": "IF", "text": "NextValue", "instruction": "addi r3, r0, 0x0"}
    //     ]
    //   }
    // ];
    // const stages: TypeStage[] = ['', 'IF', 'ID', 'intEX', 'MEM', 'WB', 'trap'];
    // const stages_reverse: TypeStage[] = ['IF', 'ID', 'intEX', 'MEM', 'WB', ''];

    // this.array_test.push({line: 0, address: 0, code: 123, stage: stages[0], instruction: "add r2, r2, #0"})
    // this.array_test.push({line: 1, address: 1, code: 123, stage: stages[0], instruction: "add r2, r2, #0"})
    // this.array_test.push({line: 2, address: 2, code: 123, stage: stages[0], instruction: "add r2, r2, #0"})
    // this.array_test.push({line: 3, address: 3, code: 123, stage: stages[0], instruction: "add r2, r2, #0"})
    // this.array_test.push({line: 4, address: 4, code: 123, stage: stages[0], instruction: "add r2, r2, #0"})
    // this.array_test.push({line: 5, address: 5, code: 123, stage: stages[0], instruction: "add r2, r2, #0"})
    // this.array_test.push({line: 6, address: 6, code: 123, stage: stages[0], instruction: "add r2, r2, #0"})
    // this.array_test.push({line: 7, address: 7, code: 123, stage: stages[0], instruction: "add r2, r2, #0"})
    // this.array_test.push({line: 8, address: 8, code: 123, stage: stages[0], instruction: "add r2, r2, #0"})
    // this.array_test.push({line: 9, address: 9, code: 123, stage: stages[0], instruction: "trap"})

    // this.array_test[this.i_clear].stage = stages_reverse[5];
    // this.array_test[this.i_wb].stage = stages_reverse[4];
    // this.array_test[this.i_me].stage = stages_reverse[3];
    // this.array_test[this.i_ex].stage = stages_reverse[2];
    // this.array_test[this.i_id].stage = stages_reverse[1];
    // this.array_test[this.i_if].stage = stages_reverse[0];
    //
    // this.i_if = Utils.modNotNegative((this.i_if + 1), this.array_test.length);
    // this.i_wb = Utils.modNotNegative((this.i_if - 4), this.array_test.length);
    // this.i_me = Utils.modNotNegative((this.i_if - 3), this.array_test.length);
    // this.i_ex = Utils.modNotNegative((this.i_if - 2), this.array_test.length);
    // this.i_id = Utils.modNotNegative((this.i_if - 1), this.array_test.length);
    //
    // if (this.i_clear < this.array_test.length) {
    //   if (this.i_clear > 0) {
    //     this.i_clear = Utils.modNotNegative((this.i_clear + 1), this.array_test.length);
    //     this.i_if = Utils.modNotNegative((this.i_clear + 5), this.array_test.length);
    //     this.i_id = Utils.modNotNegative((this.i_clear + 4), this.array_test.length);
    //     this.i_ex = Utils.modNotNegative((this.i_clear + 3), this.array_test.length);
    //     this.i_me = Utils.modNotNegative((this.i_clear + 2), this.array_test.length);
    //     this.i_wb = Utils.modNotNegative((this.i_clear + 1), this.array_test.length);
    //   } else {
    //     this.i_clear = Utils.modNotNegative((this.i_if - 5), this.array_test.length);
    //   }
    // }
  }
}
