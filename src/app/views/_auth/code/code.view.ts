import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { TableVirtualScrollDataSource } from "ng-table-virtual-scroll";
import { MatSort } from "@angular/material/sort";
import { MachineService } from "../../../__core/machine/machine.service";
import { TypeCode, TypeStage, TypeTableCode } from "../../../types";
import { Utils } from "../../../Utils";

@Component({
  selector: 'view-code',
  templateUrl: './code.view.html',
  styleUrls: []
})
export class CodeView implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatSort, {static: true}) sort: MatSort;

  displayedColumnsMemory: string[] = ['Address', 'Text', 'Binary', 'Hexadecimal', 'Stage', 'Instruction'];
  dataSourceCode = new TableVirtualScrollDataSource<TypeTableCode>();

  private privateStep = 0;

  constructor(public machine: MachineService) {
    this.dataSourceCode.filter = null;
    this.dataSourceCode.sort = this.sort;
  }

  ngOnInit(): void {
    this.dataSourceCode.data = this.machine.memory.getAllMemoryWord().map((value, index) => {
      return {
        text: "",
        index: index,
        address: Utils.numberToHexadecimalString(index * 4),
        stage: "",
        instruction: "NOP",
        code: "0x00000000"
      };
    });

    this.machine.getStepObservable().subscribe((step) => {
      this.privateStep = step;
    });

    this.machine.getCodeSimulationObservable().subscribe((typeTableCode) => {
      for (const data_code of typeTableCode) {
        const index = Math.round(Utils.hexadecimalToDecimal(data_code.address) / 4);
        this.setRow(index, data_code);
      }
    });

    // TODO
    this.machine.getStepSimulationObservable().subscribe((stepSimulation) => {
      const stepSimulationPipeline = this.machine.getListStatusPipeline(stepSimulation);

      for (const element of stepSimulationPipeline) {
        if (element != undefined && element.address !== "") {
          const index = Math.round(Utils.hexadecimalToDecimal(element.address) / 4);
          const data_code = this.machine.code.get(element.address);
          this.setRow(index, data_code, element.stage);
        }
      }
    });
  }

  ngAfterViewInit(): void {
    const array = Utils.MapToArray(this.machine.code);
    for (const code_memory of array) {
      const index = Utils.addressToIndex(code_memory.value.address);
      const stage = code_memory.value.stage;
      const code: TypeCode = {
        address: code_memory.value.address,
        instruction: code_memory.value.instruction,
        code: code_memory.value.code,
        text: code_memory.value.text
      };

      this.setRow(index, code, stage);
    }
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

  refreshDataSourceCode(): void {
    this.dataSourceCode.filter = null;
    this.dataSourceCode.data = [...this.dataSourceCode.data];
  }

  setRow(index: number, tableCode: TypeCode, stage: TypeStage = ""): void {
    this.dataSourceCode.data[index] = {
      text: tableCode.text,
      address: tableCode.address,
      instruction: Utils.convertHexCodeToTextMachineInstructionDLX(tableCode.code),
      code: tableCode.code,
      stage: stage,
      // binary: this.machine.getMemory(index).binary,
      index: index,
    };
    this.refreshDataSourceCode();
  }

}
