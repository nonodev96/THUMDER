import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MAX_VALUE_TYPE_DATA } from '../../../CONSTAST';
import { STEP_TYPE_DATA } from '../../../CONSTAST';
import { Utils } from "../../../Utils";
import { MachineService } from "../../../__core/machine/machine.service";
import { TranslateService } from "@ngx-translate/core";
import { ToastrService } from "ngx-toastr";
import { TypeData } from "../../../types";

@Component({
  selector: 'THUMDER-edit-binary32',
  templateUrl: './edit-binary32.component.html',
  styleUrls: ['./edit-binary32.component.scss']
})
export class EditBinary32Component implements OnInit {

  readonly MAX_VALUE_TYPE_DATA = MAX_VALUE_TYPE_DATA;
  readonly STEP_TYPE_DATA = STEP_TYPE_DATA;

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
  valueInSection: string | number = 0
  typeDataSelected: TypeData = "word"


  constructor(public machine: MachineService,
              private translate: TranslateService,
              private ref: ChangeDetectorRef,
              private toastService: ToastrService) {
  }

  ngOnInit(): void {
  }

  /**
   * Comprueba la dirección de memoria que le llega, estando está en hexadecimal y comprobando si es multiplo del
   * tamaño del dato que debe alterar.
   *
   * @param target.value ==> addressMemoryDisplay
   */
  async changeAddressMemoryToEdit(target: EventTarget | any) {
    const regExp = new RegExp(/^[0-9a-fA-F]{8}$/);
    if (regExp.test(target.value)) {
      // Dirección que se muestra
      this.addressMemoryDisplay = Utils.hexadecimalToDecimal(target.value);
      // Este indica el inicio del bloque de 32 bits
      this.addressMemoryToEdit = Math.trunc(Utils.hexadecimalToDecimal(target.value) / 4);
      // Este indica la parte de los 32 bits que va a ser afectada
      this.addressMemoryModule = Utils.hexadecimalToDecimal(target.value) % 4;
      switch (this.typeDataSelected) {
        case "byte": // 8 bits
          break;
        case "h-word": // 16 bits
          if (this.addressMemoryModule % 2 !== 0) {
            await this.TOAST_ErrorAddress("module % 2 != 0");
            this.addressIsValid = false;
            return;
          }
          break;
        case "word": // 32 bits
          if (this.addressMemoryModule % 4 !== 0) {
            await this.TOAST_ErrorAddress("module % 4 != 0");
            this.addressIsValid = false;
            return;
          }
          break;
        case "s-f-point": // 32 bits
          if (this.addressMemoryModule % 4 !== 0) {
            await this.TOAST_ErrorAddress("module % 4 != 0");
            this.addressIsValid = false;
            return;
          }
          break;
        case "d-f-point": // 64 bits
          if (this.addressMemoryModule % 4 !== 0) {
            await this.TOAST_ErrorAddress("module % 4 != 0");
            this.addressIsValid = false;
            return;
          }
          break;
      }
      if (this.addressMemoryToEdit >= 0 && this.addressMemoryToEdit <= this.machine.memory.length) {
        this.addressIsValid = true;
        this.machine.defineMemory(this.addressMemoryToEdit);
      } else {
        this.addressIsValid = false;
        console.error("Address not valid, out of memory");
      }
    } else {
      await this.TOAST_ErrorRegex();
    }
  }

  /**
   *
   * @param target.value: string => decimal value
   */
  async changeMemory(target: EventTarget | any) {
    try {
      if (!this.addressIsValid) {
        await this.TOAST_ErrorInValueMemory();
        this.machine.setMemory(this.addressMemoryToEdit, 0);
        console.error("Address not valid");
        return;
      }
      if (parseFloat(target.value) > MAX_VALUE_TYPE_DATA[this.typeDataSelected]) {
        await this.TOAST_ErrorInValueMemory();
        this.machine.setMemory(this.addressMemoryToEdit, 0);
        console.error("Value not valid, data size error");
        return;
      }

      if (target.value === "") {
        target.value = 0;
      }
      // Ej:  "1." ---> 1.0
      let oldValueBinaryString = this.machine.getMemory(this.addressMemoryToEdit).binary.padStart(32, '0');

      switch (this.typeDataSelected) {
        case "byte":
          const newValue_byte = parseInt(target.value);
          this.valueInSection = newValue_byte;
          let newValueBinaryString_byte = oldValueBinaryString;
          const newValue_8bits = Utils.integer8ToBin(newValue_byte);
          if (this.addressMemoryModule === 0) {
            newValueBinaryString_byte = Utils.binaryStringSwap_module(oldValueBinaryString, newValue_8bits, 0, 8, 8);
          } else if (this.addressMemoryModule === 1) {
            newValueBinaryString_byte = Utils.binaryStringSwap_module(oldValueBinaryString, newValue_8bits, 8, 16, 8);
          } else if (this.addressMemoryModule === 2) {
            newValueBinaryString_byte = Utils.binaryStringSwap_module(oldValueBinaryString, newValue_8bits, 16, 24, 8);
          } else if (this.addressMemoryModule === 3) {
            newValueBinaryString_byte = Utils.binaryStringSwap_module(oldValueBinaryString, newValue_8bits, 24, 32, 8);
          }
          // Guardamos el binary como un decimal
          const value_byte = parseInt(newValueBinaryString_byte, 2);
          this.machine.setMemory(this.addressMemoryToEdit, value_byte, newValueBinaryString_byte);
          break;
        case "h-word":
          const newValue_h_word = parseInt(target.value);
          this.valueInSection = newValue_h_word;
          const newValue_16bits = Utils.integer16ToBin(newValue_h_word);
          let newValueBinaryString_h_word = oldValueBinaryString;
          if (this.addressMemoryModule === 0) {
            newValueBinaryString_h_word = Utils.binaryStringSwap_module(oldValueBinaryString, newValue_16bits, 0, 16, 16);
          } else if (this.addressMemoryModule === 2) {
            newValueBinaryString_h_word = Utils.binaryStringSwap_module(oldValueBinaryString, newValue_16bits, 16, 32, 16);
          }
          // Guardamos el binary como un decimal
          const value_h_word = parseInt(newValueBinaryString_h_word, 2);
          this.machine.setMemory(this.addressMemoryToEdit, value_h_word, newValueBinaryString_h_word);
          break;
        case "word":
          const newValue_word = parseInt(target.value);
          this.valueInSection = newValue_word;
          const newValue_32bits = Utils.integer32ToBin(newValue_word);
          // Guardamos el binary como un decimal
          const value_word = parseInt(newValue_32bits, 2);
          this.machine.setMemory(this.addressMemoryToEdit, value_word, newValue_32bits);
          break;
        case "s-f-point":
          const newValue_float = Utils.formatDecimalNumber(target.value);
          const newValue_float_s = Utils.formatDecimalString(newValue_float);
          this.valueInSection = newValue_float_s;
          const newValue_32bits_floating_point = Utils.float32ToBin(newValue_float);
          // Guardamos el binary como un flotante junto a su representación
          this.machine.setMemory(this.addressMemoryToEdit, newValue_float, newValue_32bits_floating_point);
          break;
        case "d-f-point":
          const newValue_double = Utils.formatDecimalNumber(target.value);
          const newValue_double_s = Utils.formatDecimalString(newValue_double);
          this.valueInSection = newValue_double_s;
          const newValue_64bits_floating_point = Utils.float64ToBin(newValue_double);
          // Guardamos el binary como dos cadenas de texto de 32 bits
          const part1 = newValue_64bits_floating_point.slice(0, 32);
          const part2 = newValue_64bits_floating_point.slice(32, 64);
          this.machine.setMemory(this.addressMemoryToEdit, newValue_double, part1);
          this.machine.setMemory(this.addressMemoryToEdit + 1, 0, part2);
          break;
      }
    } catch (e) {
      await this.TOAST_ErrorInValueMemory();
      this.machine.setMemory(this.addressMemoryToEdit, 0);
      console.error(e);
    }
  }

  changeTypeData(target: EventTarget | any) {
    console.log(target.value);
    this.typeDataSelected = target.value;
    this.addressIsValid = true;
    this.addressMemoryToEdit = 0;
    this.addressMemoryModule = 0;
    this.addressMemoryDisplay = 0;
    this.valueInSection = 0;
    this.ref.detectChanges();
  }


  /***
   *      00000000 00000000 00000000 00000000
   *
   * if ( typeDataSelectedIs_Byte && address % 4 === 0 )
   *      00000000 00000000 00000000 00000000
   *      --------
   * if ( typeDataSelectedIs_Byte && address % 4 === 1 )
   *      00000000 00000000 00000000 00000000
   *               --------
   * if ( typeDataSelectedIs_Byte && address % 4 === 2 )
   *      00000000 00000000 00000000 00000000
   *                        --------
   * if ( typeDataSelectedIs_Byte && address % 4 === 3 )
   *      00000000 00000000 00000000 00000000
   *                                 --------
   *
   * if ( typeDataSelectedIs_H_WORD && address % 4 === 0 )
   *      00000000 00000000 00000000 00000000
   *      -------- --------
   * if ( typeDataSelectedIs_H_WORD && address % 4 === 2 )
   *      00000000 00000000 00000000 00000000
   *                        -------- --------
   *
   *  if ( typeDataSelectedIs_WORD)
   *      00000000 00000000 00000000 00000000
   *      -------- -------- -------- --------
   * @param addressMemoryToEdit
   */
  drawDigitsToChangeByTypeData(addressMemoryToEdit): string {
    const string32bits = this.machine.getMemory(addressMemoryToEdit).binary.padStart(32, '0');
    const string32bits_next_address = this.machine.getMemory(addressMemoryToEdit + 1).binary.padStart(32, '0');
    let module = this.addressMemoryModule;
    let partToChange_init = 0;
    let partToChange_end = partToChange_init;
    let partToChange_next_address_init = 0;
    let partToChange_next_address_end = 0;
    switch (this.typeDataSelected) {
      case "byte":
        if (module === 0) {
          partToChange_init = 0;
          partToChange_end = 8;
        } else if (module === 1) {
          partToChange_init = 8;
          partToChange_end = 16;
        } else if (module === 2) {
          partToChange_init = 16;
          partToChange_end = 24;
        } else if (module === 3) {
          partToChange_init = 24;
          partToChange_end = 32;
        }
        partToChange_next_address_init = 0;
        partToChange_next_address_end = 0;
        break;
      case "h-word":
        if (module === 0) {
          partToChange_init = 0;
          partToChange_end = 16;
        } else if (module === 1) {
          this.addressIsValid = false;
          console.error("Address not valid, module === 1");
        } else if (module === 2) {
          partToChange_init = 16;
          partToChange_end = 32;
        } else if (module === 3) {
          this.addressIsValid = false;
          console.error("Address not valid, module === 3");
        }
        partToChange_next_address_init = 0;
        partToChange_next_address_end = 0;
        break;
      case "word":
        partToChange_init = 0;
        partToChange_end = 32;
        partToChange_next_address_init = 0;
        partToChange_next_address_end = 0;
        break;
      case "s-f-point":
        partToChange_init = 0;
        partToChange_end = 32;
        partToChange_next_address_init = 0;
        partToChange_next_address_end = 0;
        break;
      case "d-f-point":
        partToChange_init = 0;
        partToChange_end = 32;
        partToChange_next_address_init = 0;
        partToChange_next_address_end = 32;
        break;
    }
    // 0x 00000000 00000000 00000000 00000000
    // 0x 00000000 00000000 00000000 000000
    // 0x 00000000 00000000 00000000 0000000
    // let text_init = string32bits.slice(0, partToChange_init + 2)
    // let text_mid = string32bits.slice(partToChange_init + 2, partToChange_end + 2)
    // let text_end = string32bits.slice(partToChange_end + 2, 32 + 2)
    //
    // let text_init_next_address = string32bits_next_address.slice(0, partToChange_next_address_init + 2)
    // let text_mid_next_address = string32bits_next_address.slice(partToChange_next_address_init + 2, partToChange_next_address_end + 2)
    // let text_end_next_address = string32bits_next_address.slice(partToChange_next_address_end + 2, 32 + 2)

    let text_init = string32bits.slice(0, partToChange_init);
    let text_mid = string32bits.slice(partToChange_init, partToChange_end);
    let text_end = string32bits.slice(partToChange_end, 32);
    let text_init_next_address = string32bits_next_address.slice(0, partToChange_next_address_init);
    let text_mid_next_address = string32bits_next_address.slice(partToChange_next_address_init, partToChange_next_address_end);
    let text_end_next_address = string32bits_next_address.slice(partToChange_next_address_end, 32);
    let result = "";
    result += '<p class="binValue">' + text_init + '<span class="underline-text" data-subscript-line="address">' + text_mid + "</span>" + text_end + "</p>";
    result += '<p class="binValue">' + text_init_next_address + '<span class="underline-text" data-subscript-line="address">' + text_mid_next_address + "</span>" + text_end_next_address + "</p>";
    return result;
  }


  private async TOAST_ErrorAddress(args: string) {
    const title_error_address = await this.translate.get('TOAST.TITLE_ERROR_IN_ADDRESS').toPromise();
    const message_error_address = await this.translate.get('TOAST.MESSAGE_THE_ADDRESS_MUST_BE_A_MULTIPLE_OF_DATA_SIZE', {text: args}).toPromise();
    this.toastService.info(message_error_address, title_error_address);
  }

  private async TOAST_ErrorRegex() {
    const title_error_regex = await this.translate.get('TOAST.TITLE_ERROR_REGEX').toPromise();
    const message_error_regex_memory = await this.translate.get('TOAST.MESSAGE_ERROR_REGEX_MEMORY').toPromise();
    this.toastService.info(message_error_regex_memory, title_error_regex);
  }

  private async TOAST_ErrorInValueMemory() {
    const title = await this.translate.get('TOAST.TITLE_ERROR_IN_VALUE_MEMORY').toPromise();
    const message = await this.translate.get('TOAST.MESSAGE_ERROR_IN_VALUE_MEMORY').toPromise();
    this.toastService.info(message, title);
  }

  getBinaryOfMemory_Byte(address: number, module: 0 | 1 | 2 | 3): string {
    return this.machine.getBinaryOfMemory_Byte(address, module);
  }

  getBinaryOfMemory_HalfWord(address: number, module: 0 | 1): string {
    return this.machine.getBinaryOfMemory_HalfWord(address, module);
  }

  getBinaryOfMemory_Word(address: number): string {
    return this.machine.getBinaryOfMemory_Word(address);
  }

  getBinaryOfMemory_Float(address: number): string {
    return this.machine.getBinaryOfMemory_Float(address);
  }

  getBinaryOfMemory_Double(address: number): string {
    return this.machine.getBinaryOfMemory_Double(address);
  }

  byteToNumber(byteAsBinary: string): number {
    return parseInt(byteAsBinary, 2);
  }

  halfWordToNumber(halfWordAsBinary: string): number {
    return parseInt(halfWordAsBinary, 2);
  }

  wordToNumber(WordAsBinary: string): number {
    return parseInt(WordAsBinary, 2);
  }
}
