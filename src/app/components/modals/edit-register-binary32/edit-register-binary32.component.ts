import { AfterViewInit, OnInit, Component, ChangeDetectorRef } from '@angular/core';
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

@Component({
  selector: 'THUMDER-edit-register-binary32',
  templateUrl: './edit-register-binary32.component.html',
  styleUrls: ['./edit-register-binary32.component.scss']
})
export class EditRegisterBinary32Component implements OnInit, AfterViewInit {

  readonly MACHINE_TYPE_REGISTERS = MACHINE_TYPE_REGISTERS;
  readonly REGISTERS_DATA = REGISTERS_DATA;

  registerSelected: TypeRegister = "Control";
  registerToEdit: TypeRegisterToEdit = "PC";
  listRegisters: TypeRegisterToEdit[] = MACHINE_REGISTERS_C;
  aliasTypeRegister: string = "";

  maxLengthHexadecimal: number = 8;
  registerToEditValueIsValid: boolean = true;
  regExp_32bits_hex = new RegExp('\\b[0-9A-F]{8}\\b')
  regExp_64bits_hex = new RegExp('\\b[0-9A-F]{16}\\b')
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
    this._registerToEdit_binary = word.toString(2).padStart(32, '0');
  }

  get registerToEdit_Hexadecimal() {
    const maxLengthHexadecimal = this.registerSelected === 'Double' ? 16 : 8;
    return parseInt(this._registerToEdit_binary, 2).toString(16).toUpperCase().padStart(maxLengthHexadecimal, '0')
  }

  set registerToEdit_Hexadecimal(hexadecimal: string) {
    this._registerToEdit_binary = parseInt(hexadecimal, 16).toString(2).padStart(32, '0');
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
              private cdref: ChangeDetectorRef) {
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
  }

  ngAfterContentChecked() {
    this.cdref.detectChanges();
  }

  changeTypeRegister(typeRegister: TypeRegister) {
    this.registerSelected = typeRegister;
    switch (this.registerSelected) {
      case "Control":
        this.registerToEdit = "PC"
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
        this.aliasTypeRegister = "D";
        this.maxLengthHexadecimal = 16;
        this.registerToEdit_Binary = DEFAULT_BINARY_64_BITS;
        break;
    }
  }

  changeRegisterToEdit(registerToEdit: TypeRegisterToEdit) {
    this.registerToEdit = registerToEdit;
  }

  private changeRegisterToEditValue(hexadecimal: string) {
    try {
      let binary;
      switch (this.registerSelected) {
        case "Control":
          this.registerToEditValueIsValid = this.regExp_32bits_hex.test(hexadecimal);
          binary = Utils.hexadecimalToBinary(hexadecimal);
          this.registerToEdit_Binary = binary;
          this.machine.registers[this.registerToEdit].binary = binary;
          break;
        case "Integer":
          this.registerToEditValueIsValid = this.regExp_32bits_hex.test(hexadecimal);
          binary = Utils.hexadecimalToBinary(hexadecimal);
          this.registerToEdit_Binary = binary;
          this.machine.registers.R[this.registerToEdit].binary = binary;
          break;
        case "Float":
          this.registerToEditValueIsValid = this.regExp_32bits_hex.test(hexadecimal);
          binary = Utils.hexadecimalToBinary(hexadecimal);
          this.registerToEdit_Binary = binary;
          this.machine.registers.F[this.registerToEdit].binary = binary;
          break;
        case "Double":
          this.registerToEditValueIsValid = this.regExp_64bits_hex.test(hexadecimal);
          binary = Utils.hexadecimalToBinary(hexadecimal, {maxLength: 64, fillString: '0'});
          this.registerToEdit_Binary = binary;
          this.machine.registers.D[this.registerToEdit].binary = binary;
          break;
      }
    } catch (e) {
      console.error(e)
    }
  }

  onRegisterToEditChangeHexadecimal(hexadecimal: string) {
    this.registerToEdit_Hexadecimal = hexadecimal;
    this.changeRegisterToEditValue(hexadecimal)
  }

  onRegisterToEditChange_WordFloatDouble(value: number) {
    switch (this.registerSelected) {
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
    this.changeRegisterToEditValue(this.registerToEdit_Hexadecimal)
  }
}
