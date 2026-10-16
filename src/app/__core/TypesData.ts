import { bitsToFloat32, bitsToFloat64, bitsToHex, hexToBits } from "@core/numbers";

export class Int32 {
  // Se almacena como entero sin signo de 32 bits
  private _value: number = 0;

  get binary(): string {
    return this._value.toString(2).padStart(32, "0");
  }

  set binary(newBinary: string) {
    this._value = parseInt(newBinary, 2) >>> 0;
  }

  get hexValue(): string {
    return this._value.toString(16).padStart(8, "0");
  }

  set hexValue(newHexCode) {
    this._value = parseInt(newHexCode, 16) >>> 0;
  }
}

// Los números en coma flotante se guardan como su patrón de bits IEEE 754 (y no como un Number), para que valores
// como un NaN con carga útil no cambien al leerlos y volver a escribirlos
export class Float32 {
  private _binary: string = "".padStart(32, "0");

  get binary(): string {
    return this._binary;
  }

  set binary(newBinary: string) {
    if (!/^[01]{32}$/.test(newBinary)) throw new Error("Binary cannot be converted because the length is not 32.");
    this._binary = newBinary;
  }

  get value(): number {
    return bitsToFloat32(this._binary);
  }

  get hexValue(): string {
    return bitsToHex(this._binary, 8);
  }

  set hexValue(newHexCode) {
    this.binary = hexToBits(newHexCode, 32);
  }
}

export class Double64 {
  private _binary: string = "".padStart(64, "0");

  get binary(): string {
    return this._binary;
  }

  set binary(newBinary: string) {
    if (!/^[01]{64}$/.test(newBinary)) throw new Error("Binary cannot be converted because the length is not 64.");
    this._binary = newBinary;
  }

  get value(): number {
    return bitsToFloat64(this._binary);
  }

  get hexValue(): string {
    return bitsToHex(this._binary, 16);
  }

  set hexValue(newHexCode) {
    this.binary = hexToBits(newHexCode, 64);
  }
}
