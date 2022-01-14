import { AfterViewInit, Component, OnInit, ViewChild } from "@angular/core";
import { MachineService } from "../../../__core/machine/machine.service";
import { TableVirtualScrollDataSource } from "ng-table-virtual-scroll";
import { MatSort } from "@angular/material/sort";
import { TranslateService } from "@ngx-translate/core";
import {
  EditMemoryBinary32Component
} from "../../../components/modals/edit-memory-binary32/edit-memory-binary32.component";
import { TypeAddress, TypeData } from "../../../Types";
import { StorageService } from "../../../__core/storage/storage.service";

@Component({
  selector:    "view-memory",
  templateUrl: "./memory.view.html",
  styleUrls:   []
})
export class MemoryView implements OnInit, AfterViewInit {

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  @ViewChild(EditMemoryBinary32Component) editBinary32Component: EditMemoryBinary32Component;

  // Word puede cambiar por --> Word, HalfWord, Float, Double, Bytes
  public displayedColumnsMemory: string[] = [ "Address", "Hexadecimal", "Binary", "Address-0", "Address-1", "Address-2", "Address-3", "Word" ];
  public dataSourceMemory = new TableVirtualScrollDataSource<number>();

  public typeDataSelected: TypeData | "InstructionCode" = "Word";
  public maxHeightCard = "75vh";

  constructor(public machine: MachineService,
              private translate: TranslateService,
              private storage: StorageService
              /* private toastService: ToastrService */) {
    this.dataSourceMemory.filter = null;
    this.dataSourceMemory.sort = this.sort;
  }

  ngOnInit(): void {
    this.storage.watchStorage().subscribe((key) => {
      switch (key) {
        case "memory_size":
          this.dataSourceMemory.data = this.machine.memory.getAllIndexByWord();
          break;
      }
    });
  }

  ngAfterViewInit(): void {
    this.dataSourceMemory.data = this.machine.memory.getAllIndexByWord();

    window.jQuery("#Memory-card").on("expanded.lte.cardwidget", (/*$event*/) => {
      this.resizeCard("75vh");
    });
    window.jQuery("#Memory-card").on("minimized.lte.cardwidget", () => {
      this.resizeCard("75vh");
    });
    window.jQuery("#Memory-card").on("maximized.lte.cardwidget", () => {
      this.resizeCard("100%");
    });
  }

  changeTypeDataInTable(typeData: TypeData | "InstructionCode"): void {
    // Word, HalfWord, Float, Double, Bytes
    this.typeDataSelected = typeData;
    switch (typeData) {
      case "Byte":
        this.displayedColumnsMemory = [ "Address", "Hexadecimal", "Binary", "Address-0", "Address-1", "Address-2", "Address-3", "Bytes" ];
        break;
      case "HalfWord":
        this.displayedColumnsMemory = [ "Address", "Hexadecimal", "Binary", "HalfWord-0", "HalfWord-1", "HalfWord" ];
        break;
      case "Word":
        this.displayedColumnsMemory = [ "Address", "Hexadecimal", "Binary", "Address-0", "Address-1", "Address-2", "Address-3", "Word" ];
        break;
      case "ASCII":
        this.displayedColumnsMemory = [ "Address", "Hexadecimal", "Binary", "Address-0", "Address-1", "Address-2", "Address-3", "ASCII" ];
        break;
      case "Float":
        this.displayedColumnsMemory = [ "Address", "Hexadecimal", "BinaryFloat", "Address-0", "Address-1", "Address-2", "Address-3", "Float" ];
        break;
      case "Double":
        this.displayedColumnsMemory = [ "Address", "Hexadecimal", "BinaryDouble", "Address-0", "Address-1", "Address-2", "Address-3", "Double" ];
        break;
      case "InstructionCode":
        this.displayedColumnsMemory = [ "Address", "Hexadecimal", "Binary", "InstructionCode" ];
        break;
    }
  }

  refresh(): void {
    this.dataSourceMemory.filter = null;
    this.dataSourceMemory.data = [ ...this.dataSourceMemory.data ];

    window.dispatchEvent(new Event("resize"));
  }

  private resizeCard(height: string) {
    this.maxHeightCard = height;
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 500);
  }

  getInstructionDLXFromIndex(index: number) {
    const address: TypeAddress = `0x${ index.toString(16).padStart(8, "0") }`;
    return this.machine.code.has(address) ? this.machine.code.get(address).instruction : "";
  }
}
