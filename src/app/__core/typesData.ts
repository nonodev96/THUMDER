import { Utils } from "../Utils";

export class Int32 {
  // Se almacena en cadena de texto binaria, siempra
  private _value: number = 0;
  // private _binary: string = "";

  // get value(): number {
  //   return this._value;
  // }
  //
  // set value(newValue: number) {
  //   // if (newValue < 0 || newValue > 4294967295 || Math.round(newValue) !== newValue) throw new Error("Rango no permitido");
  //   this._value = newValue;
  //   this._binary = newValue.toString(2).padStart(32, '0');
  // }

  get binary(): string {
    return this._value.toString(2).padStart(32, '0');
    // return this._binary.padStart(32, '0');
  }

  set binary(newBinary: string) {
    // this._binary = newBinary;
    this._value = parseInt(newBinary, 2);
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
}

export class Double64 {
  private _value: number = 0;

  get binary(): string {
    return Utils.convertIEEE754_Number_To_Binary64Bits(this._value);
  }

  set binary(newBinary: string) {
    this._value = Utils.convertIEEE754_Binary64Bits_To_Number(newBinary);
  }
}
