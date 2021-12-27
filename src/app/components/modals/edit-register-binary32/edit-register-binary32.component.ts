import { AfterViewInit, OnInit, Component, ChangeDetectorRef } from "@angular/core";
import { MachineService } from "../../../__core/machine/machine.service";
import { TypeRegister, TypeRegisterToEdit } from "../../../types";
import {
  MACHINE_REGISTERS_C,
  MACHINE_REGISTERS_D,
  MACHINE_REGISTERS_F,
  MACHINE_REGISTERS_R,
  REGISTERS_DATA,
  MACHINE_TYPE_REGISTERS, DEFAULT_BINARY_32_BITS, DEFAULT_BINARY_64_BITS
} from "../../../CONSTAST";
import { Utils } from "../../../Utils";
import { TranslateService } from "@ngx-translate/core";
import { ToastrService } from "ngx-toastr";

@Component({
  selector: "THUMDER-edit-register-binary32",
  templateUrl: "./edit-register-binary32.component.html",
  styleUrls: ["./edit-register-binary32.component.scss"]
})
export class EditRegisterBinary32Component implements OnInit, AfterViewInit {

  readonly MACHINE_TYPE_REGISTERS = MACHINE_TYPE_REGISTERS;
  readonly REGISTERS_DATA = REGISTERS_DATA;

  typeRegisterSelected: TypeRegister = "Control";
  registerToEdit: TypeRegisterToEdit = "PC";
  listRegisters: TypeRegisterToEdit[] = MACHINE_REGISTERS_C;
  aliasTypeRegister: string = "";

  maxLengthHexadecimal: number = 8;
  registerToEditHexadecimalValueIsValid: boolean = true;
  regExp_32bits_hex = new RegExp("\\b[0-9A-F]{8}\\b");
  regExp_64bits_hex = new RegExp("\\b[0-9A-F]{16}\\b");
  _registerToEdit_binary: string = DEFAULT_BINARY_32_BITS;

  get registerToEdit_Binary() {
    return this._registerToEdit_binary;
  }

  set registerToEdit_Binary(binary32: string) {
    this._registerToEdit_binary = binary32;
  }

  get registerToEdit_Word() {
    return parseInt(this._registerToEdit_binary, 2);
  }

  set registerToEdit_Word(word: number) {
    this._registerToEdit_binary = word.toString(2).padStart(32, "0");
  }

  get registerToEdit_Hexadecimal() {
    const maxLengthHexadecimal = this.typeRegisterSelected === "Double" ? 16 : 8;
    return parseInt(this._registerToEdit_binary, 2).toString(16).toUpperCase().padStart(maxLengthHexadecimal, "0");
  }

  set registerToEdit_Hexadecimal(hexadecimal: string) {
    this._registerToEdit_binary = parseInt(hexadecimal, 16).toString(2).padStart(32, "0");
  }

  get registerToEdit_Float() {
    const binary32 = this.registerToEdit_Binary;
    return Utils.convertIEEE754_Binary32Bits_To_Number(binary32);
  }

  set registerToEdit_Float(float32: number) {
    this._registerToEdit_binary = Utils.convertIEEE754_Number_To_Binary32Bits(float32);
  }

  get registerToEdit_Double() {
    const binary64 = this.registerToEdit_Binary;
    return Utils.convertIEEE754_Binary64Bits_To_Number(binary64);
  }

  set registerToEdit_Double(double: number) {
    this._registerToEdit_binary = Utils.convertIEEE754_Number_To_Binary64Bits(double);
  }

  constructor(public machine: MachineService,
              private translate: TranslateService,
              private toastService: ToastrService,
              private cdref: ChangeDetectorRef) {
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
  }

  ngAfterContentChecked() {
    this.cdref.detectChanges();
  }

  public async changeTypeRegister(typeRegister: TypeRegister): Promise<void> {
    this.typeRegisterSelected = typeRegister;
    switch (this.typeRegisterSelected) {
      case "Control":
        this.registerToEdit = "PC";
        this.listRegisters = MACHINE_REGISTERS_C;
        this.aliasTypeRegister = "";
        this.maxLengthHexadecimal = 8;
        this.registerToEdit_Binary = DEFAULT_BINARY_32_BITS;
        break;
      case "Integer":
        this.registerToEdit = 0;
        this.listRegisters = MACHINE_REGISTERS_R;
        this.aliasTypeRegister = "R";
        this.maxLengthHexadecimal = 8;
        this.registerToEdit_Binary = DEFAULT_BINARY_32_BITS;
        break;
      case "Float":
        this.registerToEdit = 0;
        this.listRegisters = MACHINE_REGISTERS_F;
        this.aliasTypeRegister = "F";
        this.maxLengthHexadecimal = 8;
        this.registerToEdit_Binary = DEFAULT_BINARY_32_BITS;
        break;
      case "Double":
        this.registerToEdit = 0;
        this.listRegisters = MACHINE_REGISTERS_D;
        this.aliasTypeRegister = "F";
        this.maxLengthHexadecimal = 16;
        this.registerToEdit_Binary = DEFAULT_BINARY_64_BITS;
        break;
    }
    return Promise.resolve();
  }

  public changeRegisterToEdit(registerToEdit: TypeRegisterToEdit) {
    this.registerToEdit = registerToEdit;
  }

  private async changeRegisterToEditValue(hexadecimal: string): Promise<void> {
    try {
      let binary;
      if (this.typeRegisterSelected === "Integer" && this.registerToEdit === 0) {
        await this.TOAST_ErrorRegister();
        return;
      }
      switch (this.typeRegisterSelected) {
        case "Control": {
          this.registerToEditHexadecimalValueIsValid = this.regExp_32bits_hex.test(hexadecimal);
          binary = Utils.hexadecimalToBinary(hexadecimal);
          this.registerToEdit_Binary = binary;
          this.machine.registers[this.registerToEdit].binary = binary;
          break;
        }
        case "Integer": {
          this.registerToEditHexadecimalValueIsValid = this.regExp_32bits_hex.test(hexadecimal);
          binary = Utils.hexadecimalToBinary(hexadecimal);
          this.registerToEdit_Binary = binary;
          this.machine.registers.R[this.registerToEdit].binary = binary;
          break;
        }
        case "Float": {
          this.registerToEditHexadecimalValueIsValid = this.regExp_32bits_hex.test(hexadecimal);
          binary = Utils.hexadecimalToBinary(hexadecimal);
          this.registerToEdit_Binary = binary;
          this.machine.registers.F[this.registerToEdit].binary = binary;
          break;
        }
        case "Double": {
          this.registerToEditHexadecimalValueIsValid = this.regExp_64bits_hex.test(hexadecimal);
          binary = Utils.hexadecimalToBinary(hexadecimal, {maxLength: 64, fillString: "0"});
          this.registerToEdit_Binary = binary;
          const index = parseInt(this.registerToEdit.toString());
          this.machine.registers.F[index].binary = binary.substr(0, 32);
          this.machine.registers.F[index + 1].binary = binary.substr(32, 32);
          break;
        }
      }

      await this.machine.updateRegisterInServer([{
        register: this.registerToEdit,
        typeRegister: this.typeRegisterSelected,
        hexadecimalValue: Utils.binaryToHexadecimal(this.registerToEdit_Binary)
      }]);

      return Promise.resolve();
    } catch (e) {
      console.error(e);
      return Promise.reject();
    }
  }

  public async onRegisterToEditChangeHexadecimal(hexadecimal: string) {
    this.registerToEdit_Hexadecimal = hexadecimal;
    await this.changeRegisterToEditValue(hexadecimal);
  }

  public async onRegisterToEditChange_WordFloatDouble(value: number) {
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

  private async TOAST_ErrorRegister() {
    const title_error_address = await this.translate.get("TOAST.TITLE_ERROR_IN_REGISTER").toPromise();
    const message_error_address = await this.translate.get("TOAST.MESSAGE_ERROR_IN_VALUE_REGISTER").toPromise();
    this.toastService.info(message_error_address, title_error_address);
  }
}
