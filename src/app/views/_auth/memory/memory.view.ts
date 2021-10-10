import { ChangeDetectorRef } from '@angular/core';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MachineService } from "../../../__core/machine/machine.service";
import { TableVirtualScrollDataSource } from "ng-table-virtual-scroll";
import { MatSort } from "@angular/material/sort";
import { ToastrService } from "ngx-toastr";
import { TranslateService } from "@ngx-translate/core";
import { Utils } from "../../../Utils";

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

  displayedColumnsMemory: string[] = ['Address', 'Decimal', 'Hexadecimal', 'Binary', 'Address-0', 'Address-1', 'Address-2', 'Address-3'];
  dataSourceMemory = new TableVirtualScrollDataSource<number>();

  typeData: "byte" | "h-word" | "word" | "s-f-point" | "d-f-point" = "word"
  maxValueTypeData = {
    "byte": 255,
    "h-word": 65535,
    "word": 4294967295,
    "s-f-point": 4294967295,
    "d-f-point": 18446744073709551615
  }

  //  Por como es la memoria "memory: Int32[]", debemos organizar de 32 bits en 32 bits,
  // por lo que para acceder a un char (8 bits) debemos acceder a una sección de la memoria,
  // ejemplo: memory[addressMemoryToEdit] es un decimal que lo mostramos en binario como:
  //                                      "00000000000000010000001000000011"
  // pero para acceder a un char ("00000000") no nos da la dirección correcta, por lo que usamos
  // addressMemoryModule = addressMemoryToEdit % 4; para un char []
  // addressMemoryModule === 0 ==> "00000000"
  // addressMemoryModule === 1 ==> "00000001"
  // addressMemoryModule === 2 ==> "00000010"
  // addressMemoryModule === 3 ==> "00000011"

  // addressMemoryModule = addressMemoryToEdit % 2; para un half-word
  // addressMemoryModule === 0 ==> "0000000000000001"
  // addressMemoryModule === 1 ==> "0000001000000011"

  // addressMemoryModule = addressMemoryToEdit; para un word
  // addressMemoryModule === 0 ==> "00000000000000010000001000000011"
  addressMemoryModule = 0
  // index in decimal value --> memory[addressMemoryToEdit] = new Int32
  // addressMemoryToEdit = addressMemoryDisplay % 4
  addressMemoryToEdit = 0
  addressMemoryDisplay = 0
  addressIsValid = true
  valueInSection = 0

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

  change(value = 10) {
    this.machine.memory[this.addressMemoryToEdit].value = value
    console.log(this.machine.memory[this.addressMemoryToEdit])
  }

  /**
   * Comprueba la dirección de memoria que le llega, estando está en hexadecimal y comprobando si es multiplo del
   * tamaño del dato que debe alterar.
   *
   * @param target.value ==> addressMemoryDisplay
   */
  async changeAddressMemoryToEdit(target: EventTargetExtend | any) {
    const regExp = new RegExp(/^[0-9a-fA-F]{8}$/)
    if (regExp.test(target.value)) {

      // Dirección que se muestra
      this.addressMemoryDisplay = Utils.hexadecimalToDecimal(target.value)
      // Este indica el inicio del bloque de 32 bits
      this.addressMemoryToEdit = Math.trunc(Utils.hexadecimalToDecimal(target.value) / 4)
      // Este indica la parte de los 32 bits que va a ser afectada
      this.addressMemoryModule = Utils.hexadecimalToDecimal(target.value) % 4

      switch (this.typeData) {
        case "byte": // 8 bits
          break
        case "h-word": // 16 bits
          if (this.addressMemoryModule % 2 !== 0) {
            await this.TOAST_ErrorAddress("module % 2 != 0")
            this.addressIsValid = false
            return;
          }
          break
        case "word": // 32 bits
          if (this.addressMemoryModule % 4 !== 0) {
            await this.TOAST_ErrorAddress("module % 4 != 0")
            this.addressIsValid = false
            return;
          }
          break
        case "s-f-point": // 32 bits
          if (this.addressMemoryModule % 4 !== 0) {
            await this.TOAST_ErrorAddress("module % 4 != 0")
            this.addressIsValid = false
            return;
          }
          break
        case "d-f-point": // 64 bits

          break
      }

      if (this.addressMemoryToEdit >= 0 && this.addressMemoryToEdit <= this.machine.memory.length) {
        this.addressIsValid = true
        this.machine.defineMemory(this.addressMemoryToEdit)
      } else {
        this.addressIsValid = false
        console.error("Address not valid, out of memory")
      }

    } else {
      await this.TOAST_ErrorRegex()
    }
  }

  /**
   *
   * @param target.value: string => decimal value
   */
  async changeMemory(target: EventTargetExtend | any) {
    try {
      if (target.value === "") {
        target.value = 0
      }
      this.valueInSection = 0
      let oldValue = this.machine.getMemory(this.addressMemoryToEdit).value
      let oldValueBinaryString: string = this.binaryTransform_STRING_(oldValue)

      let value = parseInt(target.value)
      if (value > this.maxValueTypeData[this.typeData]) {
        await this.TOAST_ErrorInValueMemory()
        value = this.maxValueTypeData[this.typeData]
      }
      this.valueInSection = value
      let newValue = value
      let newValueBinaryString = oldValueBinaryString

      switch (this.typeData) {
        case "byte":
          const newValue_8bits = Math.abs(newValue).toString(2).padStart(8, '0')
          if (this.addressMemoryModule === 0) {
            newValueBinaryString = MemoryView.binaryStringSwap_module(oldValueBinaryString, newValue_8bits, 0, 8, 8)
          } else if (this.addressMemoryModule === 1) {
            newValueBinaryString = MemoryView.binaryStringSwap_module(oldValueBinaryString, newValue_8bits, 8, 16, 8)
          } else if (this.addressMemoryModule === 2) {
            newValueBinaryString = MemoryView.binaryStringSwap_module(oldValueBinaryString, newValue_8bits, 16, 24, 8)
          } else if (this.addressMemoryModule === 3) {
            newValueBinaryString = MemoryView.binaryStringSwap_module(oldValueBinaryString, newValue_8bits, 24, 32, 8)
          }
          break
        case "h-word":
          const newValue_16bits = Math.abs(newValue).toString(2).padStart(16, '0')
          if (this.addressMemoryModule === 0) {
            newValueBinaryString = MemoryView.binaryStringSwap_module(oldValueBinaryString, newValue_16bits, 0, 16, 16)
          } else if (this.addressMemoryModule === 2) {
            newValueBinaryString = MemoryView.binaryStringSwap_module(oldValueBinaryString, newValue_16bits, 16, 32, 16)
          }
          break
        case "word":
          const newValue_32bits = Math.abs(newValue).toString(2).padStart(32, '0')
          if (this.addressMemoryModule === 0) {
            newValueBinaryString = MemoryView.binaryStringSwap_module(oldValueBinaryString, newValue_32bits, 0, 32, 32)
          }
          break
        case "s-f-point":
          break
        case "d-f-point":
          break
      }

      if (this.addressIsValid) {
        // Guardamos el binary como un decimal
        const value = parseInt(newValueBinaryString, 2)
        this.machine.setMemory(this.addressMemoryToEdit, value)
      } else {
        await this.TOAST_ErrorInValueMemory()
        this.machine.setMemory(this.addressMemoryToEdit, 0)
        console.error("Address not valid")
      }
    } catch (e) {
      await this.TOAST_ErrorInValueMemory()
      this.machine.setMemory(this.addressMemoryToEdit, 0)
      console.error(e)
    }
  }

  changeTypeData(target: EventTargetExtend | any) {
    console.log(target.value)
    this.typeData = target.value;
    this.addressIsValid = true
    this.addressMemoryToEdit = 0
    this.addressMemoryModule = 0
    this.addressMemoryDisplay = 0
    this.valueInSection = 0
    this.ref.detectChanges()
  }


  /***
   *      00000000 00000000 00000000 00000000
   *
   * if ( typeDataIs_Byte && address % 4 === 0 )
   *      00000000 00000000 00000000 00000000
   *      --------
   * if ( typeDataIs_Byte && address % 4 === 1 )
   *      00000000 00000000 00000000 00000000
   *               --------
   * if ( typeDataIs_Byte && address % 4 === 2 )
   *      00000000 00000000 00000000 00000000
   *                        --------
   * if ( typeDataIs_Byte && address % 4 === 3 )
   *      00000000 00000000 00000000 00000000
   *                                 --------
   *
   * if ( typeDataIs_H_WORD && address % 4 === 0 )
   *      00000000 00000000 00000000 00000000
   *      -------- --------
   * if ( typeDataIs_H_WORD && address % 4 === 2 )
   *      00000000 00000000 00000000 00000000
   *                        -------- --------
   *
   *  if ( typeDataIs_WORD)
   *      00000000 00000000 00000000 00000000
   *      -------- -------- -------- --------
   * @param addressMemoryToEdit
   */
  drawDigitsToChangeByTypeData(addressMemoryToEdit): string {
    const string32bits = this.binaryTransform(this.machine.getMemory(addressMemoryToEdit).value, 32)
    const string32bits_next_address = this.binaryTransform(this.machine.getMemory(addressMemoryToEdit + 1).value, 32)

    let module = this.addressMemoryModule
    let partToChange_init = 0
    let partToChange_end = partToChange_init

    let partToChange_next_address_init = 0
    let partToChange_next_address_end = 0

    switch (this.typeData) {
      case "byte":
        if (module === 0) {
          partToChange_init = 0
          partToChange_end = 8
        } else if (module === 1) {
          partToChange_init = 8
          partToChange_end = 16
        } else if (module === 2) {
          partToChange_init = 16
          partToChange_end = 24
        } else if (module === 3) {
          partToChange_init = 24
          partToChange_end = 32
        }

        partToChange_next_address_init = 0
        partToChange_next_address_end = 0
        break
      case "h-word":
        if (module === 0) {
          partToChange_init = 0
          partToChange_end = 16
        } else if (module === 1) {
          this.addressIsValid = false
          console.error("Address not valid, module === 1")
        } else if (module === 2) {
          partToChange_init = 16
          partToChange_end = 32
        } else if (module === 3) {
          this.addressIsValid = false
          console.error("Address not valid, module === 3")
        }

        partToChange_next_address_init = 0
        partToChange_next_address_end = 0
        break
      case "word":
        partToChange_init = 0
        partToChange_end = 32

        partToChange_next_address_init = 0
        partToChange_next_address_end = 0
        break
      case "s-f-point":
        partToChange_init = 0
        partToChange_end = 32

        partToChange_next_address_init = 0
        partToChange_next_address_end = 0
        break
      case "d-f-point":
        partToChange_init = 0
        partToChange_end = 32

        partToChange_next_address_init = 0
        partToChange_next_address_end = 32
        break
    }
    // 0x 00000000 00000000 00000000 00000000
    // 0x 00000000 00000000 00000000 000000
    // 0x 00000000 00000000 00000000 0000000
    let text_init = string32bits.slice(0, partToChange_init + 2)
    let text_mid = string32bits.slice(partToChange_init + 2, partToChange_end + 2)
    let text_end = string32bits.slice(partToChange_end + 2, 32 + 2)

    let text_init_next_address = string32bits_next_address.slice(0, partToChange_next_address_init + 2)
    let text_mid_next_address = string32bits_next_address.slice(partToChange_next_address_init + 2, partToChange_next_address_end + 2)
    let text_end_next_address = string32bits_next_address.slice(partToChange_next_address_end + 2, 32 + 2)

    let result = ""
    result += '<p class="binValue">' + text_init + '<span class="underline-text" data-subscript-line="address">' + text_mid + "</span>" + text_end + "</p>"
    result += '<p class="binValue">' + text_init_next_address + '<span class="underline-text" data-subscript-line="address">' + text_mid_next_address + "</span>" + text_end_next_address + "</p>"

    return result
  }

  binaryTransform(value: number, ...args: unknown[]): string {
    const toReturn = value >= 0 ? '0x' : '1x';
    return toReturn + Math.abs(value).toString(2).padStart(<number>args[0], '0');
  }

  binaryTransform_STRING_(value: number): string {
    return Math.abs(value).toString(2).padStart(32, '0');
  }

  private async TOAST_ErrorAddress(args: string) {
    const title_error_address = await this.translate.get('TOAST.TITLE_ERROR_IN_ADDRESS').toPromise();
    const message_error_address = await this.translate.get('TOAST.MESSAGE_THE_ADDRESS_MUST_BE_A_MULTIPLE_OF_DATA_SIZE', {text: args}).toPromise();
    this.toastService.info(message_error_address, title_error_address)
  }

  private async TOAST_ErrorRegex() {
    const title_error_regex = await this.translate.get('TOAST.TITLE_ERROR_REGEX').toPromise();
    const message_error_regex_memory = await this.translate.get('TOAST.MESSAGE_ERROR_REGEX_MEMORY').toPromise();
    this.toastService.info(message_error_regex_memory, title_error_regex)
  }

  private async TOAST_ErrorInValueMemory() {
    const title = await this.translate.get('TOAST.TITLE_ERROR_IN_VALUE_MEMORY').toPromise();
    const message = await this.translate.get('TOAST.MESSAGE_ERROR_IN_VALUE_MEMORY').toPromise();
    this.toastService.info(message, title)
  }

  private static binaryStringSwap_module(oldValueBinaryString: string, newValuePart: string, start: number, end: number, module: number) {
    let result = oldValueBinaryString.split('')
    for (let i = 0; i < 32; i++) {
      if (i >= start && i < end) {
        result[i] = newValuePart[i % module]
      }
    }
    return result.join('');
  }

  getBinaryMemory(address: number, module: number): string {
    const value = this.machine.getMemory(address).value
    const binary = value.toString(2).padStart(32, '0');
    let result = "00000000"
    result = binary.substr(8 * module, 8);
    return result
  }
}
