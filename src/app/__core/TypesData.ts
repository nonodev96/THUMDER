import { Utils } from "../Utils";

export class Int32 {
  // Se almacena en cadena de texto binaria, siempra
  private _value: number = 0;

  get binary(): string {
    return this._value.toString(2).padStart(32, "0");
  }

  set binary(newBinary: string) {
    this._value = parseInt(newBinary, 2);
  }

  get hexValue(): string {
    return this._value.toString(16).padStart(8, "0");
  }

  set hexValue(newHexCode) {
    this._value = parseInt(newHexCode, 16);
  }
}

export class Float32 {
  private _value: number = 0;

  get binary(): string {
    return Utils.convertIEEE754_Number_To_Binary32Bits(this._value);
  }

  set binary(newBinary: string) {
    this._value = Utils.convertIEEE754_Binary32Bits_To_Number(newBinary);
  }

  get hexValue(): string {
    return this._value.toString(16).padStart(8, "0");
  }

  set hexValue(newHexCode) {
    this._value = parseInt(newHexCode, 16);
  }
}

export class Double64 {
  private _value: number = 0;

  get binary(): string {
    return Utils.convertIEEE754_Number_To_Binary64Bits(this._value);
  }

  set binary(newBinary: string) {
    this._value = Utils.convertIEEE754_Binary64Bits_To_Number(newBinary);
  }

  get hexValue(): string {
    return this._value.toString(16).padStart(16, "0");
  }

  set hexValue(newHexCode) {
    this._value = parseInt(newHexCode, 16);
  }
}
