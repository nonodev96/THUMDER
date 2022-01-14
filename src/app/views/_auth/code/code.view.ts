import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { TableVirtualScrollDataSource } from "ng-table-virtual-scroll";
import { MatSort } from "@angular/material/sort";
import { MachineService } from "../../../__core/machine/machine.service";
import { TypeInstructionsData, TypeStage, TypeInstructionsData_Table, TypeAddress } from "../../../Types";
import { Utils } from "../../../Utils";
import { Subscription } from "rxjs";


@Component({
  selector:    "view-code",
  templateUrl: "./code.view.html",
  styleUrls:   []
})
export class CodeView implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  public displayedColumnsMemory: string[] = [ "Address", "Text", "Binary", "Hexadecimal", "Stage", "Instruction" ];
  public dataSourceCode = new TableVirtualScrollDataSource<TypeInstructionsData_Table>();

  public listRowActives: { address: TypeAddress, stage: TypeStage }[] = [];
  private privateStep = 0;
  private stepSubscription: Subscription = new Subscription();
  private stepSimulationSubscription: Subscription = new Subscription();
  private codeSimulationSubscription: Subscription = new Subscription();
  private resetSimulationSubscription: Subscription = new Subscription();
  public maxHeightCard = "75vh";

  constructor(public machine: MachineService) {
    this.dataSourceCode.filter = null;
    this.dataSourceCode.sort = this.sort;
  }

  ngOnInit(): void {
    this.dataSourceCode.data = this.machine.memory.getAllMemoryWord().map((value, index) => {
      const hexCode = Utils.binaryToHexadecimal(value.binary);
      const address = Utils.indexToAddress(index * 4);
      // FIX
      // const instructionGeneratedByHexCode = Utils.convertHexCodeToTextMachineInstructionDLX(hexCode);
      return {
        index:       index,
        instruction: "",//instructionGeneratedByHexCode,
        address:     address,
        code:        `0x${ hexCode }`,
        text:        "",
        stage:       ""
      } as TypeInstructionsData_Table;
    });
    this.codeSimulationSubscription = this.machine.getCodeSimulationObservable().subscribe((typeTableCode) => {
      for (const data_code of typeTableCode) {
        const index = Math.round(Utils.hexadecimalToDecimal(data_code.address) / 4);
        this.setRow(index, data_code);
      }
    });
    this.stepSimulationSubscription = this.machine.getStepSimulationObservable().subscribe((_stepSimulation) => {
      this.listRowActives = [];
      const stepSimulationPipeline = this.machine.getListStatusPipeline();
      for (const step of stepSimulationPipeline) {
        this.listRowActives.push({ address: step.address, stage: step.stage });
      }
    });
    this.resetSimulationSubscription = this.machine.getResetObservable().subscribe(() => {
      this.listRowActives = [];
    });
    this.stepSubscription = this.machine.getStepObservable().subscribe((step) => {
      this.privateStep = step;
    });
  }

  ngAfterViewInit(): void {
    const array = Utils.MapToArray(this.machine.code.getMap());
    for (const code_memory of array) {
      const index = Utils.addressToIndex(code_memory.value.address);
      const code: TypeInstructionsData = {
        address:     code_memory.value.address,
        instruction: code_memory.value.instruction,
        code:        code_memory.value.code,
        text:        code_memory.value.text
      };

      this.setRow(index, code);
    }

    window.jQuery("#Code-card").on("expanded.lte.cardwidget", (/*$event*/) => {
      this.resizeCard("75vh");
    });
    window.jQuery("#Code-card").on("minimized.lte.cardwidget", () => {
      this.resizeCard("75vh");
    });
    window.jQuery("#Code-card").on("maximized.lte.cardwidget", () => {
      this.resizeCard("100%");
    });
  }

  ngOnDestroy(): void {
    this.stepSubscription.unsubscribe();
    this.codeSimulationSubscription.unsubscribe();
    this.stepSimulationSubscription.unsubscribe();
    this.resetSimulationSubscription.unsubscribe();
  }


  refresh(): void {
    this.dataSourceCode.filter = null;
    this.dataSourceCode.data = [ ...this.dataSourceCode.data ];

    window.dispatchEvent(new Event("resize"));
  }

  /**
   * 'IF' 'ID' 'intEX' 'MEM' 'WB'
   * faddEX   --> 8
   * fmultEX  --> 8
   * fdivEX   --> 8
   * max size array ==> 8 + 8 + 8 + 5 = 29
   *
   */
  setRow(index: number, tableCode: TypeInstructionsData, stage: TypeStage = ""): void {
    this.dataSourceCode.data[index] = {
      text:        tableCode.text,
      address:     tableCode.address,
      instruction: tableCode.instruction ?? Utils.convertHexCodeToTextMachineInstructionDLX(tableCode.code),
      code:        tableCode.code,
      stage:       stage,
      // binary: this.machine.getMemory(index).binary,
      index: index,
      row:   0
    };
    this.refresh();
  }

  checkIfContains(address: TypeAddress, stages: TypeStage[]): boolean {
    return this.listRowActives.some((v) => {
      return v.address === address && stages.includes(v.stage);
    });
  }

  checkElementStage(address: TypeAddress): TypeStage {
    const elements = this.listRowActives.filter(v => v.address === address);
    if (elements.length > 0) return elements[0].stage;
    return "";
  }

  private resizeCard(height: string) {
    this.maxHeightCard = height;
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 500);
  }
}
