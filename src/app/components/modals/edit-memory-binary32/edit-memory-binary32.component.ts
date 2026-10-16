import { UpperCasePipe } from "@angular/common";
import { ChangeDetectorRef, Component, inject, type OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DomSanitizer, type SafeHtml } from "@angular/platform-browser";
import { DEFAULT_HEXADECIMAL_08_DIGITS, MAX_VALUE_TYPE_DATA, REGEX_HEXADECIMAL_08 } from "@app/CONSTANTS";
import type { TypeData } from "@app/Types";
import { BYTES_OF_TYPE_DATA, valueToBinary } from "@core/DLX/typeDataValues";
import { logger } from "@core/logger/logger";
import { MachineService } from "@core/machine/machine.service";
import { bitsToFloat32, bitsToFloat64, bitsToHex, hexToBits, hexToNumber, isHex, toAddress } from "@core/numbers";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { PadStartFilterPipe } from "@shared/pipes/filter/LeftPadFilter.pipe";
import {
  Binary32ToASCIIPipe,
  Binary32ToBytesPipe,
  Binary32ToDecimal_IEEE754Pipe,
  Binary32ToHalfWordPipe,
  Binary64ToDecimal_IEEE754Pipe,
  BinaryByteToNumberPipe,
  NumberToBasePipe,
  NumberToHexadecimalPipe,
  PadStartPipe,
} from "@shared/pipes/numbers/numbers.pipes";
import { ToastrService } from "ngx-toastr";
import { firstValueFrom } from "rxjs";
import { ModalDismissDirective } from "../../../__shared/directives/bootstrap/modal.directive";

@Component({
  selector: "THUMDER-edit-memory-binary32",
  templateUrl: "./edit-memory-binary32.component.html",
  styleUrls: ["./edit-memory-binary32.component.scss"],
  imports: [
    ModalDismissDirective,
    FormsModule,
    UpperCasePipe,
    TranslatePipe,
    Binary32ToASCIIPipe,
    Binary32ToBytesPipe,
    Binary32ToHalfWordPipe,
    Binary32ToDecimal_IEEE754Pipe,
    Binary64ToDecimal_IEEE754Pipe,
    NumberToHexadecimalPipe,
    PadStartFilterPipe,
    NumberToBasePipe,
    BinaryByteToNumberPipe,
    PadStartPipe,
  ],
})
export class EditMemoryBinary32Component implements OnInit {
  machine = inject(MachineService);
  private translate = inject(TranslateService);
  private ref = inject(ChangeDetectorRef);
  private toastService = inject(ToastrService);
  private sanitized = inject(DomSanitizer);

  public readonly MAX_VALUE_TYPE_DATA = MAX_VALUE_TYPE_DATA;

  /**
   * addressMemoryModule === 0 ==> "00000000"
   * addressMemoryModule === 1 ==> "00000001"
   * addressMemoryModule === 2 ==> "00000010"
   * addressMemoryModule === 3 ==> "00000011"
   *
   * addressMemoryModule === 0 ==> "0000000000000001"
   * addressMemoryModule === 2 ==> "0000001000000011"
   */
  public addressMemoryModule: number = 0;
  // index in decimal value --> memory[addressMemoryToEdit] = new Int32
  // addressMemoryToEdit = addressMemoryDisplay % 4
  public addressIsValid: boolean = true;
  public typeDataSelected: TypeData = "Word";
  // Hexadecimal 8 digits
  private _hexadecimalAddressMemory: string = DEFAULT_HEXADECIMAL_08_DIGITS;

  // =================================================================================================================
  get displayAddressMemory(): string {
    return toAddress(hexToNumber(this._hexadecimalAddressMemory));
  }

  get displayAddressMemoryNext(): string {
    return toAddress(hexToNumber(this._hexadecimalAddressMemory) + 4);
  }

  get addressMemoryIndex(): number {
    return hexToNumber(this._hexadecimalAddressMemory);
  }

  get addressMemory(): string {
    return this._hexadecimalAddressMemory.toUpperCase().padStart(8, "0");
  }

  set addressMemory(hexadecimalAddress: string) {
    if (REGEX_HEXADECIMAL_08.test(hexadecimalAddress)) {
      this._hexadecimalAddressMemory = hexadecimalAddress;
    } else {
      throw new Error(`Error in address: ${hexadecimalAddress.toString()}`);
    }
  }

  // The value of the selected type at the address, read from memory every time (zeros if the address is not valid)
  get valueInSection_Hexadecimal(): string {
    return bitsToHex(this.valueBinary, this.bytes * 2);
  }

  get valueInSection_Byte(): number {
    return parseInt(this.readMemory(this.addressMemoryIndex, 1), 2);
  }

  get valueInSection_HalfWord(): number {
    return parseInt(this.readMemory(this.addressMemoryIndex, 2), 2);
  }

  get valueInSection_Word(): number {
    return parseInt(this.readMemory(this.addressMemoryIndex, 4), 2);
  }

  get valueInSection_Float_Binary32_IEEE754(): number {
    return bitsToFloat32(this.readMemory(this.addressMemoryIndex, 4));
  }

  get valueInSection_Double_Binary64_IEEE754(): number {
    return bitsToFloat64(this.readMemory(this.addressMemoryIndex, 8));
  }

  // The word that contains the address (and the next one, for a double), for the views in binary, bytes, ASCII...
  get memoryValueBinary32Display(): string {
    return this.readMemory(this.addressMemoryIndex - this.addressMemoryModule, 4);
  }

  get memoryValueBinary64Display(): string {
    return this.readMemory(this.addressMemoryIndex - this.addressMemoryModule, 8);
  }

  private get bytes(): number {
    return BYTES_OF_TYPE_DATA[this.typeDataSelected];
  }

  private get valueBinary(): string {
    return this.readMemory(this.addressMemoryIndex, this.bytes);
  }

  private readMemory(index: number, bytes: number): string {
    if (!this.addressIsValid || !this.machine.memory.isInMemory(index, bytes)) return "".padStart(bytes * 8, "0");
    return this.machine.memory.getMemoryBinaryByIndex(index, bytes);
  }

  // =================================================================================================================

  ngOnInit(): void {}

  public async changeAddressMemoryToEdit(target: EventTarget | any): Promise<void> {
    if (!REGEX_HEXADECIMAL_08.test(target.value)) {
      this.addressIsValid = false;
      await this.TOAST_ErrorRegex();
      return;
    }
    this.addressMemory = target.value;
    this.addressMemoryModule = hexToNumber(target.value) % 4;
    await this.checkAddress();
  }

  // The address must be a multiple of the size of the data (of 4 for a double) and the data must fit in memory
  private async checkAddress(): Promise<void> {
    const alignment = Math.min(this.bytes, 4);
    if (this.addressMemoryIndex % alignment !== 0) {
      this.addressIsValid = false;
      await this.TOAST_ErrorAddress(`module % ${alignment} != 0`);
      return;
    }
    if (!this.machine.memory.isInMemory(this.addressMemoryIndex, this.bytes)) {
      this.addressIsValid = false;
      logger.error("Address not valid, out of memory");
      await this.TOAST_ErrorInAddressMemory();
      return;
    }
    this.addressIsValid = true;
  }

  // Writes the bits of the selected type at the address, here and in THUMDER-server
  private async writeMemory(binary: string): Promise<void> {
    if (!this.addressIsValid) {
      await this.TOAST_ErrorInValueMemory();
      logger.error("Address not valid");
      return;
    }
    try {
      this.machine.memory.setMemoryBinaryByIndex(this.addressMemoryIndex, binary);
      await this.machine.updateMemory([
        {
          typeData: this.typeDataSelected,
          address: `0x${this.addressMemory}`,
          value: bitsToHex(binary, this.bytes * 2),
        },
      ]);
    } catch (e) {
      await this.TOAST_ErrorInValueMemory();
      logger.error(e);
    }
  }

  public changeTypeData(typeData: TypeData): void {
    this.typeDataSelected = typeData;
    this.addressIsValid = true;
    this.addressMemoryModule = 0;
    this._hexadecimalAddressMemory = DEFAULT_HEXADECIMAL_08_DIGITS;
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
  public drawDigitsToChangeByTypeData(): SafeHtml {
    // restart the position to de first element of 4 binaries
    const initIndex = this.addressMemoryIndex - this.addressMemoryModule;
    const string32bits = this.readMemory(initIndex, 4);
    const string32bits_next_address = this.readMemory(initIndex + 4, 4);
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
            logger.error("Address not valid, module === 1");
            break;
          case 2:
            partToChange_init = 16;
            partToChange_end = 32;
            break;
          case 3:
            this.addressIsValid = false;
            logger.error("Address not valid, module === 3");
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
    html +=
      '<p class="binValue" data-id="binary-address+0">' +
      text_init +
      '<span class="underline-text" data-subscript-line="address">' +
      text_mid +
      "</span>" +
      text_end +
      "</p>";
    html +=
      '<p class="binValue" data-id="binary-address+4">' +
      text_init_next_address +
      '<span class="underline-text" data-subscript-line="address">' +
      text_mid_next_address +
      "</span>" +
      text_end_next_address +
      "</p>";
    return this.sanitized.bypassSecurityTrustHtml(html);
  }

  // =================================================================================================================

  private async TOAST_ErrorAddress(args: string): Promise<void> {
    const title_error_address = await firstValueFrom(this.translate.get("TOAST.TITLE_ERROR_IN_ADDRESS"));
    const message_error_address = await firstValueFrom(
      this.translate.get("TOAST.MESSAGE_THE_ADDRESS_MUST_BE_A_MULTIPLE_OF_DATA_SIZE", { text: args }),
    );
    this.toastService.info(message_error_address, title_error_address);
  }

  private async TOAST_ErrorRegex(): Promise<void> {
    const title_error_regex = await firstValueFrom(this.translate.get("TOAST.TITLE_ERROR_REGEX"));
    const message_error_regex_memory = await firstValueFrom(this.translate.get("TOAST.MESSAGE_ERROR_REGEX_MEMORY"));
    this.toastService.info(message_error_regex_memory, title_error_regex);
  }

  private async TOAST_ErrorInValueMemory(): Promise<void> {
    const title = await firstValueFrom(this.translate.get("TOAST.TITLE_ERROR_IN_VALUE_MEMORY"));
    const message = await firstValueFrom(this.translate.get("TOAST.MESSAGE_ERROR_IN_VALUE_MEMORY"));
    this.toastService.info(message, title);
  }

  private async TOAST_ErrorInAddressMemory(): Promise<void> {
    const title = await firstValueFrom(this.translate.get("TOAST.TITLE_ERROR_IN_ADDRESS_MEMORY"));
    const message = await firstValueFrom(this.translate.get("TOAST.MESSAGE_ERROR_IN_ADDRESS_MEMORY"));
    this.toastService.info(message, title);
  }

  // =================================================================================================================

  public async ngModelChange_ValueInSection_Hexadecimal(hexadecimal: string): Promise<void> {
    const digits = hexadecimal.trim().replace(/^0x/i, "");
    if (!isHex(hexadecimal) || digits.length > this.bytes * 2) {
      // Still being typed, or too long for the type: nothing is written
      return;
    }
    await this.writeMemory(hexToBits(digits, this.bytes * 8));
  }

  public async ngModelChange_ValueInSection_Decimal(value: number): Promise<void> {
    if (typeof value !== "number" || Number.isNaN(value)) return;
    const binary = valueToBinary(this.typeDataSelected, value);
    if (binary === null) {
      await this.TOAST_ErrorInValueMemory();
      logger.error("Value not valid, data size error");
      return;
    }
    await this.writeMemory(binary);
  }
}
