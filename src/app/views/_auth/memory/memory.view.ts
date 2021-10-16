import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { MachineService } from "../../../__core/machine/machine.service";
import { TableVirtualScrollDataSource } from "ng-table-virtual-scroll";
import { MatSort } from "@angular/material/sort";
import { ToastrService } from "ngx-toastr";
import { TranslateService } from "@ngx-translate/core";
import { EditBinary32Component } from "../../../components/modals/edit-binary32/edit-binary32.component";
import { TypeData } from "../../../types";


@Component({
  selector: 'app-memory',
  templateUrl: './memory.view.html',
  styleUrls: []
})
export class MemoryView implements OnInit, AfterViewInit {

  @ViewChild(MatSort, {static: true}) sort: MatSort;

  @ViewChild(EditBinary32Component) editBinary32Component: EditBinary32Component;

  // Word puede cambiar por --> Word, HalfWord, Float, Double, Bytes
  displayedColumnsMemory: string[] = ['Address', 'Hexadecimal', 'Binary', 'Address-0', 'Address-1', 'Address-2', 'Address-3', 'Word'];
  dataSourceMemory = new TableVirtualScrollDataSource<number>();

  btn__active: TypeData = "word";
  typeData: TypeData = "word"

  constructor(public machine: MachineService,
              private translate: TranslateService,
              private ref: ChangeDetectorRef,
              private toastService: ToastrService) {
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

  changeTypeDataInTable(typeData: TypeData) {
    // Word, HalfWord, Float, Double, Bytes
    this.btn__active = typeData;
    switch (typeData) {
      case "byte":
        this.displayedColumnsMemory[7] = "Bytes";
        this.displayedColumnsMemory[2] = "Binary";
        break;
      case "h-word":
        this.displayedColumnsMemory[7] = "HalfWord";
        this.displayedColumnsMemory[2] = "Binary";
        break;
      case "word":
        this.displayedColumnsMemory[7] = "Word";
        this.displayedColumnsMemory[2] = "Binary";
        break;
      case "ascii":
        this.displayedColumnsMemory[7] = "ASCII";
        this.displayedColumnsMemory[2] = "Binary";
        break;
      case "s-f-point":
        this.displayedColumnsMemory[7] = "Float";
        this.displayedColumnsMemory[2] = "BinaryFloat";
        break;
      case "d-f-point":
        this.displayedColumnsMemory[7] = "Double";
        this.displayedColumnsMemory[2] = "BinaryDouble";
        break;
    }
  }


}
