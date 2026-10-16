import { UpperCasePipe } from "@angular/common";
import { Component, inject, type OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  DEFAULT_BINARY_32_BITS,
  DEFAULT_BINARY_64_BITS,
  MACHINE_REGISTERS_C,
  MACHINE_REGISTERS_D,
  MACHINE_REGISTERS_F,
  MACHINE_REGISTERS_R,
  MACHINE_TYPE_REGISTERS,
} from "@app/CONSTANTS";
import type { TypeRegister, TypeRegisterToEdit } from "@app/Types";
import { logger } from "@core/logger/logger";
import { MachineService } from "@core/machine/machine.service";
import { bitsToFloat32, bitsToFloat64, bitsToHex, float32ToBits, float64ToBits, hexToBits, int32ToBits, isHex } from "@core/numbers";
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
  selector: "THUMDER-edit-register-binary32",
  templateUrl: "./edit-register-binary32.component.html",
  styleUrls: ["./edit-register-binary32.component.scss"],
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
export class EditRegisterBinary32Component implements OnInit {
  machine = inject(MachineService);
  private translate = inject(TranslateService);
  private toastService = inject(ToastrService);

  readonly MACHINE_TYPE_REGISTERS = MACHINE_TYPE_REGISTERS;

  public aliasTypeRegister: string = "";
  public typeRegisterSelected: TypeRegister = "Control";
  public listRegisters: TypeRegisterToEdit[] = MACHINE_REGISTERS_C;
  public maxLengthHexadecimal: number = 8;
  public registerToEditHexadecimalValueIsValid: boolean = true;
  public lang_SELECT_REGISTER = "MACHINE.SELECT_REGISTER";
  private regExp_32bits_hex: RegExp = /^(0x)?[0-9A-F]{8}$/i;
  private regExp_64bits_hex: RegExp = /^(0x)?[0-9A-F]{16}$/i;
  private _registerToEdit_binary: string = DEFAULT_BINARY_32_BITS;
  private registerToEdit: TypeRegisterToEdit = "PC";

  get registerToEdit_Binary(): string {
    return this._registerToEdit_binary;
  }

  set registerToEdit_Binary(binary32: string) {
    this._registerToEdit_binary = binary32;
  }

  get registerToEdit_Word(): number {
    return parseInt(this._registerToEdit_binary, 2);
  }

  set registerToEdit_Word(word: number) {
    this._registerToEdit_binary = int32ToBits(word);
  }

  // Through BigInt: a double (64 bits) does not fit in a Number without losing its low bits
  get registerToEdit_Hexadecimal(): string {
    const maxLengthHexadecimal = this.typeRegisterSelected === "Double" ? 16 : 8;
    return bitsToHex(this._registerToEdit_binary, maxLengthHexadecimal);
  }

  set registerToEdit_Hexadecimal(hexadecimal: string) {
    if (!isHex(hexadecimal)) return;
    const maxLength = this.typeRegisterSelected === "Double" ? 64 : 32;
    this._registerToEdit_binary = hexToBits(hexadecimal, maxLength);
  }

  get registerToEdit_Float(): number {
    const binary32 = this.registerToEdit_Binary;
    return bitsToFloat32(binary32);
  }

  set registerToEdit_Float(float32: number) {
    this._registerToEdit_binary = float32ToBits(float32);
  }

  get registerToEdit_Double(): number {
    const binary64 = this.registerToEdit_Binary;
    return bitsToFloat64(binary64);
  }

  set registerToEdit_Double(double: number) {
    this._registerToEdit_binary = float64ToBits(double);
  }

  ngOnInit(): void {}

  public changeRegisterToEdit(registerToEdit: TypeRegisterToEdit): void {
    this.registerToEdit = registerToEdit;
  }

  public async changeTypeRegister(typeRegister: TypeRegister): Promise<void> {
    this.typeRegisterSelected = typeRegister;
    switch (this.typeRegisterSelected) {
      case "Control":
        this.lang_SELECT_REGISTER = "MACHINE.SELECT_REGISTER";
        this.registerToEdit = "PC";
        this.listRegisters = MACHINE_REGISTERS_C;
        this.aliasTypeRegister = "";
        this.maxLengthHexadecimal = 8;
        this.registerToEdit_Binary = DEFAULT_BINARY_32_BITS;
        break;
      case "Integer":
        this.lang_SELECT_REGISTER = "MACHINE.SELECT_REGISTER_R";
        this.registerToEdit = 0;
        this.listRegisters = MACHINE_REGISTERS_R;
        this.aliasTypeRegister = "R";
        this.maxLengthHexadecimal = 8;
        this.registerToEdit_Binary = DEFAULT_BINARY_32_BITS;
        break;
      case "Float":
        this.lang_SELECT_REGISTER = "MACHINE.SELECT_REGISTER_F";
        this.registerToEdit = 0;
        this.listRegisters = MACHINE_REGISTERS_F;
        this.aliasTypeRegister = "F";
        this.maxLengthHexadecimal = 8;
        this.registerToEdit_Binary = DEFAULT_BINARY_32_BITS;
        break;
      case "Double":
        this.lang_SELECT_REGISTER = "MACHINE.SELECT_REGISTER_D";
        this.registerToEdit = 0;
        this.listRegisters = MACHINE_REGISTERS_D;
        this.aliasTypeRegister = "F";
        this.maxLengthHexadecimal = 16;
        this.registerToEdit_Binary = DEFAULT_BINARY_64_BITS;
        break;
    }
    return Promise.resolve();
  }

  private async changeRegisterToEditValue(hexadecimal: string): Promise<void> {
    try {
      let binary: string | undefined;
      if (this.typeRegisterSelected === "Integer" && this.registerToEdit === 0) {
        await this.TOAST_ErrorRegister();
        return;
      }
      const regExp = this.typeRegisterSelected === "Double" ? this.regExp_64bits_hex : this.regExp_32bits_hex;
      this.registerToEditHexadecimalValueIsValid = regExp.test(hexadecimal);
      // While the value is being typed it is not valid yet: nothing changes
      if (!this.registerToEditHexadecimalValueIsValid) return;
      switch (this.typeRegisterSelected) {
        case "Control": {
          binary = hexToBits(hexadecimal);
          this.registerToEdit_Binary = binary;
          (this.machine.registers as any)[this.registerToEdit].binary = binary;
          break;
        }
        case "Integer": {
          binary = hexToBits(hexadecimal);
          this.registerToEdit_Binary = binary;
          this.machine.registers.R[parseInt(this.registerToEdit.toString(), 10)].binary = binary;
          break;
        }
        case "Float": {
          binary = hexToBits(hexadecimal);
          this.registerToEdit_Binary = binary;
          this.machine.registers.F[parseInt(this.registerToEdit.toString(), 10)].binary = binary;
          break;
        }
        case "Double": {
          binary = hexToBits(hexadecimal, 64);
          this.registerToEdit_Binary = binary;
          this.machine.registers.setRegisterDoubleWithBinary(parseInt(this.registerToEdit.toString(), 10), binary);
          break;
        }
      }

      await this.machine.updateRegisters([
        {
          register: this.registerToEdit,
          typeRegister: this.typeRegisterSelected,
          hexadecimalValue: this.registerToEdit_Hexadecimal,
        },
      ]);
    } catch (e) {
      logger.error(e);
      await this.TOAST_ErrorRegister();
    }
  }

  public async onRegisterToEditChangeHexadecimal(hexadecimal: string): Promise<void> {
    this.registerToEdit_Hexadecimal = hexadecimal;
    await this.changeRegisterToEditValue(hexadecimal);
  }

  public async onRegisterToEditChange_WordFloatDouble(value: number): Promise<void> {
    switch (this.typeRegisterSelected) {
      case "Control":
        this.registerToEdit_Word = value;
        break;
      case "Integer":
        this.registerToEdit_Word = value;
        break;
      case "Float":
        this.registerToEdit_Float = value;
        break;
      case "Double":
        this.registerToEdit_Double = value;
        break;
    }
    await this.changeRegisterToEditValue(this.registerToEdit_Hexadecimal);
  }

  private async TOAST_ErrorRegister(): Promise<void> {
    const title_error_address = await firstValueFrom(this.translate.get("TOAST.TITLE_ERROR_IN_REGISTER"));
    const message_error_address = await firstValueFrom(this.translate.get("TOAST.MESSAGE_ERROR_IN_VALUE_REGISTER"));
    this.toastService.info(message_error_address, title_error_address);
  }
}
