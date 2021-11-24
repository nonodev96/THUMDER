import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import {
  DEFAULT_BINARY_32_BITS, DEFAULT_HEXADECIMAL_08_DIGITS,
  MAX_VALUE_TYPE_DATA,
  REGEX_HEXADECIMAL_08,
} from '../../../CONSTAST';
import { Utils } from "../../../Utils";
import { MachineService } from "../../../__core/machine/machine.service";
import { TranslateService } from "@ngx-translate/core";
import { ToastrService } from "ngx-toastr";
import { TypeData } from "../../../types";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";

@Component({
  selector: 'THUMDER-edit-memory-binary32',
  templateUrl: './edit-memory-binary32.component.html',
  styleUrls: ['./edit-memory-binary32.component.scss']
})
export class EditMemoryBinary32Component implements OnInit {

  readonly MAX_VALUE_TYPE_DATA = MAX_VALUE_TYPE_DATA;

  //  Por como es la memoria "memory: Int32[]", debemos organizar de 32 bits en 32 bits,
  // por lo que para acceder a un char (8 bits) debemos acceder a una sección de la memoria,
  // ejemplo: memory[addressMemoryToEdit] es un decimal que lo mostramos en binario como:
  //                                      "00000000000000010000001000000011"
  // pero para acceder a un char ("00000000") no nos da la dirección correcta, por lo que usamos
  // addressMemoryModule = addressMemoryToEdit % 4; para un char []

  /**
   * addressMemoryModule === 0 ==> "00000000"
   * addressMemoryModule === 1 ==> "00000001"
   * addressMemoryModule === 2 ==> "00000010"
   * addressMemoryModule === 3 ==> "00000011"
   *
   * addressMemoryModule === 0 ==> "0000000000000001"
   * addressMemoryModule === 2 ==> "0000001000000011"
   */
  addressMemoryModule = 0;
  // index in decimal value --> memory[addressMemoryToEdit] = new Int32
  // addressMemoryToEdit = addressMemoryDisplay % 4
  addressIsValid = true;
  typeDataSelected: TypeData = "Word";
  // Binary
  _binaryValue: string = DEFAULT_BINARY_32_BITS;
  // Hexadecimal 8 digits
  _hexadecimalAddressMemory: string = DEFAULT_HEXADECIMAL_08_DIGITS;

  constructor(public machine: MachineService,
              private translate: TranslateService,
              private ref: ChangeDetectorRef,
              private toastService: ToastrService,
              private sanitized: DomSanitizer) {
  }

  // =================================================================================================================
  get displayAddressMemory() {
    return Utils.numberToHexadecimalString(Utils.hexadecimalToDecimal(this._hexadecimalAddressMemory));
  }

  get displayAddressMemoryNext() {
    return Utils.numberToHexadecimalString(Utils.hexadecimalToDecimal(this._hexadecimalAddressMemory) + 4);
  }

  get addressMemoryIndex() {
    return Utils.hexadecimalToDecimal(this._hexadecimalAddressMemory);
  }

  get addressMemory() {
    return this._hexadecimalAddressMemory.toUpperCase().padStart(8, '0');
  }

  set addressMemory(hexadecimalAddress: string) {
    if (REGEX_HEXADECIMAL_08.test(hexadecimalAddress)) {
      this._hexadecimalAddressMemory = hexadecimalAddress;
    } else {
      throw new Error('Error in address: ' + hexadecimalAddress.toString());
    }
  }

  get valueInSection_Hexadecimal() {
    const maxLength = this.typeDataSelected === 'Double' ? 16 : 8;
    const binary_32_64 = this.typeDataSelected === 'Double' ? this.memoryValueBinary64Display : this.memoryValueBinary32Display;
    return Utils.binaryToHexadecimal(binary_32_64, {maxLength: maxLength, fillString: '0'});
  }

  set valueInSection_Hexadecimal(hexadecimal: string) {
    const maxLength = this.typeDataSelected === 'Double' ? 64 : 32;
    this.binaryValue = Utils.hexadecimalToBinary(hexadecimal, {maxLength: maxLength, fillString: '0'});
  }

  // Address: 0x00000001
  //  Binary:   00000000 XXXXXXXX 00000000 00000000
  get valueInSection_Byte(): number {
    const binary32 = this.memoryValueBinary32Display;
    const binary8_byte = binary32.substr(8 * this.addressMemoryModule, 8);
    return parseInt(binary8_byte, 2);
  }

  set valueInSection_Byte(byte: number) {
    const binary32 = this.memoryValueBinary32Display;
    const binary8_byte = byte.toString(2).padStart(8, '0');
    this.binaryValue = Utils.binaryStringSwap(binary32, binary8_byte, 8 * this.addressMemoryModule);
  }

  get valueInSection_HalfWord(): number {
    const binary32 = this.memoryValueBinary32Display;
    const binary16_halfword = binary32.substr(8 * this.addressMemoryModule, 16);
    return parseInt(binary16_halfword, 2);
  }

  set valueInSection_HalfWord(halfword_number: number) {
    const binary32 = this.memoryValueBinary32Display;
    const binary16_halfword = halfword_number.toString(2).padStart(16, '0');
    this.binaryValue = Utils.binaryStringSwap(binary32, binary16_halfword, 8 * this.addressMemoryModule);
  }

  get valueInSection_Word(): number {
    const binary32 = this.memoryValueBinary32Display;
    return parseInt(binary32, 2);
  }

  set valueInSection_Word(word: number) {
    this.binaryValue = word.toString(2).padStart(32, '0');
  }

  get valueInSection_Float_Binary32_IEEE754(): number {
    const binary32 = this.memoryValueBinary32Display;
    return Utils.convertIEEE754_Binary32Bits_To_Number(binary32);
  }

  set valueInSection_Float_Binary32_IEEE754(float32: number) {
    this.binaryValue = Utils.convertIEEE754_Number_To_Binary32Bits(float32);
  }

  get valueInSection_Double_Binary64_IEEE754(): number {
    const binary64 = this.memoryValueBinary64Display;
    return Utils.convertIEEE754_Binary64Bits_To_Number(binary64);
  }

  set valueInSection_Double_Binary64_IEEE754(double: number) {
    this.binaryValue = Utils.convertIEEE754_Number_To_Binary64Bits(double);
  }

  // ======

  private set binaryValue(binary: string) {
    if (binary.length === 32) {
      this._binaryValue = binary;
    } else if (binary.length === 64) {
      this._binaryValue = binary;
    } else {
      throw new Error("Binary length error: " + binary.length.toString());
    }
  }

  get memoryValueBinary32Display() {
    return this._binaryValue.padStart(32, '0');
  }

  get memoryValueBinary64Display() {
    return this._binaryValue.padStart(64, '0');
  }


  // =================================================================================================================

  ngOnInit(): void {
  }

  /**
   * Comprueba la dirección de memoria que le llega, estando en hexadecimal y comprobando si es multiplo del
   * tamaño del dato que debe alterar.
   *
   * @param target.value ==> addressMemoryDisplay
   */
  async changeAddressMemoryToEdit(target: EventTarget | any) {
    if (REGEX_HEXADECIMAL_08.test(target.value)) {
      // Dirección que se muestra
      // Este indica el inicio del bloque de 32 bits
      this.addressMemory = target.value;
      // Este indica la parte de los 32 bits que va a ser afectada
      this.addressMemoryModule = Utils.hexadecimalToDecimal(target.value) % 4;

      switch (this.typeDataSelected) {
        case "Byte": // 8 bits
          break;
        case "HalfWord": // 16 bits
          if (this.addressMemoryModule % 2 !== 0) {
            await this.TOAST_ErrorAddress("module % 2 != 0");
            this.addressIsValid = false;
            return;
          }
          break;
        case "Word": // 32 bits
          if (this.addressMemoryModule % 4 !== 0) {
            await this.TOAST_ErrorAddress("module % 4 != 0");
            this.addressIsValid = false;
            return;
          }
          break;
        case "Float": // 32 bits
          if (this.addressMemoryModule % 4 !== 0) {
            await this.TOAST_ErrorAddress("module % 4 != 0");
            this.addressIsValid = false;
            return;
          }
          break;
        case "Double": // 64 bits
          if (this.addressMemoryModule % 4 !== 0) {
            await this.TOAST_ErrorAddress("module % 4 != 0");
            this.addressIsValid = false;
            return;
          }
          break;
      }

      if (parseInt(this.addressMemory, 16) >= 0 && parseInt(this.addressMemory, 16) <= this.machine.memory.memorySizeBytes) {
        this.addressIsValid = true;
        // Recuperamos el dato anterior
        switch (this.typeDataSelected) {
          case "Byte":
            this.valueInSection_Byte = parseInt(this.machine.memory.getMemoryByteBinaryByIndex(this.addressMemoryIndex), 2);
            break;
          case "HalfWord":
            this.valueInSection_HalfWord = parseInt(this.machine.memory.getMemoryWordBinaryByIndex(this.addressMemoryIndex), 2);
            break;
          case "Word":
            this.valueInSection_Word = parseInt(this.machine.memory.getMemoryWordBinaryByIndex(this.addressMemoryIndex), 2);
            break;
          case "Float":
            this.valueInSection_Float_Binary32_IEEE754 = 0;
            break;
          case "Double":
            this.valueInSection_Double_Binary64_IEEE754 = 0;
            break;
        }
      } else {
        this.addressIsValid = false;
        console.error("Address not valid, out of memory");
        await this.TOAST_ErrorInAddressMemory();
      }
    } else {
      await this.TOAST_ErrorRegex();
    }
  }

  /**
   *
   * @param value: string => decimal value
   */
  private async changeMemory(value: number) {
    try {
      if (!this.addressIsValid) {
        await this.TOAST_ErrorInValueMemory();
        this.machine.memory.setMemoryWordBinaryByIndex(this.addressMemoryIndex, DEFAULT_BINARY_32_BITS);
        console.error("Address not valid");
        return;
      }

      // Ej:  "1." ---> 1.0
      // let oldValueBinaryString = this.machine.getMemory(this.addressMemoryIndex).binary.padStart(32, '0');
      switch (this.typeDataSelected) {
        case "Byte": {
          const newValue_byte = value;
          const newValue_8bits = Utils.integer8ToBin(newValue_byte);
          this.valueInSection_Byte = newValue_byte;
          this.machine.memory.setMemoryByteBinaryByIndex(this.addressMemoryIndex, newValue_8bits);
          break;
        }
        case "HalfWord": {
          const newValue_h_word = value;
          const newValue_16bits = Utils.integer16ToBin(newValue_h_word);
          this.valueInSection_HalfWord = newValue_h_word;
          this.machine.memory.setMemoryHalfWordBinaryByIndex(this.addressMemoryIndex, newValue_16bits);
          break;
        }
        case "Word": {
          const newValue_word = value;
          const newValue_32bits = Utils.integer32ToBin(newValue_word);
          this.valueInSection_Word = newValue_word;
          this.machine.memory.setMemoryWordBinaryByIndex(this.addressMemoryIndex, newValue_32bits);
          break;
        }
        case "Float": {
          const newValue_float = Utils.formatDecimalNumber(value);
          const newValue_float_s = Utils.formatDecimalString(newValue_float);
          const newValue_32bits_floating_point = Utils.convertIEEE754_Number_To_Binary32Bits(newValue_float);
          this.valueInSection_Float_Binary32_IEEE754 = newValue_float_s;
          this.machine.memory.setMemoryWordBinaryByIndex(this.addressMemoryIndex, newValue_32bits_floating_point);
          break;
        }
        case "Double": {
          const newValue_double = Utils.formatDecimalNumber(value);
          const newValue_double_s = Utils.formatDecimalString(newValue_double);
          const newValue_64bits_floating_point = Utils.convertIEEE754_Number_To_Binary64Bits(newValue_double);
          const part1 = newValue_64bits_floating_point.slice(0, 32);
          const part2 = newValue_64bits_floating_point.slice(32, 64);
          this.valueInSection_Double_Binary64_IEEE754 = newValue_double_s;
          this.machine.memory.setMemoryWordBinaryByIndex(this.addressMemoryIndex, part1);
          this.machine.memory.setMemoryWordBinaryByIndex(this.addressMemoryIndex + 4, part2);
          break;
        }
      }
    } catch (e) {
      await this.TOAST_ErrorInValueMemory();
      this.machine.memory.setMemoryWordBinaryByIndex(this.addressMemoryIndex, DEFAULT_BINARY_32_BITS);
      console.error(e);
    }
  }

  changeTypeData(typeData: TypeData) {
    this.typeDataSelected = typeData;
    this.addressIsValid = true;
    this.addressMemoryModule = 0;
    this._hexadecimalAddressMemory = DEFAULT_HEXADECIMAL_08_DIGITS;
    this._binaryValue = this.machine.memory.getMemoryWordByIndex(0).binary;
    switch (this.typeDataSelected) {
      case "Word":
        this.machine.memory.setMemoryWordBinaryByIndex(this.addressMemoryIndex, DEFAULT_BINARY_32_BITS);
        break;
      case "Float":
        this.machine.memory.setMemoryWordBinaryByIndex(this.addressMemoryIndex, DEFAULT_BINARY_32_BITS);
        break;
      case "Double":
        this.machine.memory.setMemoryWordBinaryByIndex(this.addressMemoryIndex, DEFAULT_BINARY_32_BITS);
        this.machine.memory.setMemoryWordBinaryByIndex(this.addressMemoryIndex + 4, DEFAULT_BINARY_32_BITS);
        break;
    }
    this.ref.detectChanges();
  }

  // =================================================================================================================

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
   */
  drawDigitsToChangeByTypeData(): SafeHtml {
    // restart the position to de first element of 4 binaries
    const initIndex = this.addressMemoryIndex - this.addressMemoryModule;
    const string32bits = this.machine.memory.getMemoryWordBinaryByIndex(initIndex);
    const string32bits_next_address = this.machine.memory.getMemoryWordBinaryByIndex(initIndex + 4);
    const module = this.addressMemoryModule;
    let partToChange_init = 0;
    let partToChange_end = 32;
    let partToChange_next_address_init = 0;
    let partToChange_next_address_end = 0;
    switch (this.typeDataSelected) {
      case "Byte":
        switch (module) {
          case 0:
            partToChange_init = 0;
            partToChange_end = 8;
            break;
          case 1:
            partToChange_init = 8;
            partToChange_end = 16;
            break;
          case 2:
            partToChange_init = 16;
            partToChange_end = 24;
            break;
          case 3:
            partToChange_init = 24;
            partToChange_end = 32;
            break;
        }
        break;
      case "HalfWord":
        switch (module) {
          case 0:
            partToChange_init = 0;
            partToChange_end = 16;
            break;
          case 1:
            this.addressIsValid = false;
            console.error("Address not valid, module === 1");
            break;
          case 2:
            partToChange_init = 16;
            partToChange_end = 32;
            break;
          case 3:
            this.addressIsValid = false;
            console.error("Address not valid, module === 3");
            break;
        }
        break;
      case "Word":
        partToChange_init = 0;
        partToChange_end = 32;
        break;
      case "Float":
        partToChange_init = 0;
        partToChange_end = 32;
        break;
      case "Double":
        partToChange_init = 0;
        partToChange_end = 32;
        partToChange_next_address_init = 0;
        partToChange_next_address_end = 32;
        break;
    }

    const text_init = string32bits.slice(0, partToChange_init);
    const text_mid = string32bits.slice(partToChange_init, partToChange_end);
    const text_end = string32bits.slice(partToChange_end, 32);
    const text_init_next_address = string32bits_next_address.slice(0, partToChange_next_address_init);
    const text_mid_next_address = string32bits_next_address.slice(partToChange_next_address_init, partToChange_next_address_end);
    const text_end_next_address = string32bits_next_address.slice(partToChange_next_address_end, 32);
    let html = "";
    html += '<p class="binValue" data-id="binary-address+0">' + text_init + '<span class="underline-text" data-subscript-line="address">' + text_mid + "</span>" + text_end + "</p>";
    html += '<p class="binValue" data-id="binary-address+4">' + text_init_next_address + '<span class="underline-text" data-subscript-line="address">' + text_mid_next_address + "</span>" + text_end_next_address + "</p>";
    return this.sanitized.bypassSecurityTrustHtml(html);
  }

  // =================================================================================================================

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

  private async TOAST_ErrorInAddressMemory() {
    const title = await this.translate.get('TOAST.TITLE_ERROR_IN_ADDRESS_MEMORY').toPromise();
    const message = await this.translate.get('TOAST.MESSAGE_ERROR_IN_ADDRESS_MEMORY').toPromise();
    this.toastService.info(message, title);
  }

  // =================================================================================================================

  async ngModelChange_ValueInSection_Hexadecimal(hexadecimal: string): Promise<void> {
    this.valueInSection_Hexadecimal = hexadecimal;
    await this.changeMemory(this.valueInSection_Word);
    return Promise.resolve();
  }

  async ngModelChange_ValueInSection_Decimal(value: number): Promise<void> {
    if (typeof value === "string") {
      value = 0;
      console.error('Should be a number', value);
    }
    if (value === undefined || value === null) {
      value = 0;
    }
    if (value > MAX_VALUE_TYPE_DATA[this.typeDataSelected]) {
      await this.TOAST_ErrorInValueMemory();
      this.machine.memory.setMemoryWordBinaryByIndex(this.addressMemoryIndex, DEFAULT_BINARY_32_BITS);
      console.error("Value not valid, data size error");
      return;
    }

    switch (this.typeDataSelected) {
      case "Byte":
        this.valueInSection_Byte = value;
        await this.changeMemory(value);
        break;
      case "HalfWord":
        this.valueInSection_HalfWord = value;
        await this.changeMemory(value);
        break;
      case "Word":
        this.valueInSection_Word = value;
        await this.changeMemory(value);
        break;
      case "Float":
        this.valueInSection_Float_Binary32_IEEE754 = value;
        await this.changeMemory(value);
        break;
      case "Double":
        this.valueInSection_Double_Binary64_IEEE754 = value;
        await this.changeMemory(value);
        break;
    }

    return Promise.resolve();
  }
}
