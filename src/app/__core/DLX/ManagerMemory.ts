import { InterfaceMemory } from "./interfaces";
import { Int32 } from "../typesData";
import { Utils } from "../../Utils";
import { TypeMemoryToUpdate } from "../../types";

export class ManagerMemory implements InterfaceMemory {
  // Bytes
  private _memorySizeBytes: number;
  // private _memory: Array<Int32>;
  private _memoryInt8Array: Uint8Array;

  constructor(memorySizeBytes: number) {
    this._memorySizeBytes = memorySizeBytes;
    this._memoryInt8Array = new Uint8Array(this._memorySizeBytes + 8);
    // this._memory = [...new Array(this._memorySize)].map((v, i, a) => new Int32())
  }

  get memorySizeBytes() {
    return this._memorySizeBytes * 4;
  }

  set memorySizeBytes(memorySize: number) {
    this._memorySizeBytes = memorySize;
    this._memoryInt8Array = new Uint8Array(this._memorySizeBytes + 8);
  }

  processResponse(response: TypeMemoryToUpdate[]) {
    for (const memoryToUpdate of response) {
      const {typeData, address, value} = memoryToUpdate;
      switch (typeData) {
        case "Byte": {
          const binary = Utils.hexadecimalToBinary(value);
          this.setMemoryByteBinaryByAddress(address, binary);
          break;
        }
        case "HalfWord": {
          const binary = Utils.hexadecimalToBinary(value);
          this.setMemoryHalfWordBinaryByAddress(address, binary);
          break;
        }
        case "Word": {
          const binary = Utils.hexadecimalToBinary(value);
          this.setMemoryWordBinaryByAddress(address, binary);
          break;
        }
        case "Float": {
          const binary = Utils.hexadecimalToBinary(value);
          this.setMemoryFloatBinaryByAddress(address, binary);
          break;
        }
        case "Double": {
          const binary = Utils.hexadecimalToBinary(value);
          this.setMemoryDoubleBinaryByAddress(address, binary);
          break;
        }
        case "ASCII": {
          break;
        }
        default: {
          console.warn("Can't process memory", typeData, address, value);
          break;
        }
      }
    }
  }

  // WORD - GET
  public getMemoryWordByIndex(index: number): Int32 {
    const data = new Int32();
    data.binary = this.getMemoryWordBinaryByIndex(index);
    return data;
  }

  public getMemoryWordByAddress(address: string): Int32 {
    const index = Utils.hexadecimalToDecimal(address);
    const data = new Int32();
    data.binary = this.getMemoryWordBinaryByIndex(index);
    return data;
  }

  public getMemoryWordBinaryByIndex(index: number): string {
    return "" +
      this._memoryInt8Array[index].toString(2).padStart(8, "0") +
      this._memoryInt8Array[index + 1].toString(2).padStart(8, "0") +
      this._memoryInt8Array[index + 2].toString(2).padStart(8, "0") +
      this._memoryInt8Array[index + 3].toString(2).padStart(8, "0");
  }

  // WORD - SET
  public setMemoryWordByIndex(index: number, data: Int32) {
    this.setMemoryWordBinaryByIndex(index, data.binary);
  }

  public setMemoryWordByAddress(address: string, data: Int32): void {
    const index = Utils.hexadecimalToDecimal(address);
    this.setMemoryWordBinaryByIndex(index, data.binary);
  }

  public setMemoryWordBinaryByAddress(address: string, binary32: string): void {
    const index = Utils.hexadecimalToDecimal(address);
    this.setMemoryWordBinaryByIndex(index, binary32);
  }

  public setMemoryWordBinaryByIndex(index: number, binary32: string): void {
    const p0 = binary32.substr(0, 8);
    const p1 = binary32.substr(8, 8);
    const p2 = binary32.substr(16, 8);
    const p3 = binary32.substr(24, 8);
    this._memoryInt8Array[index] = parseInt(p0, 2);
    this._memoryInt8Array[index + 1] = parseInt(p1, 2);
    this._memoryInt8Array[index + 2] = parseInt(p2, 2);
    this._memoryInt8Array[index + 3] = parseInt(p3, 2);
  }

  // BYTE - GET
  public getMemoryByteBinaryByIndex(index: number): string {
    return this._memoryInt8Array[index].toString(2).padStart(8, "0");
  }

  // BYTE - SET
  public setMemoryByteBinaryByIndex(index: number, binary: string): void {
    const p0 = binary.substr(0, 8);
    this._memoryInt8Array[index] = parseInt(p0, 2);
  }

  public setMemoryByteBinaryByAddress(address: string, binary08: string): void {
    const p0 = binary08.substr(0, 8);
    const index = Utils.hexadecimalToDecimal(address);
    this._memoryInt8Array[index] = parseInt(p0, 2);
  }

  // HALF WORD - GET
  public getMemoryHalfWordBinaryByIndex(index: number): string {
    return "" +
      this._memoryInt8Array[index].toString(2).padStart(8, "0") +
      this._memoryInt8Array[index + 1].toString(2).padStart(8, "0");
  }

  // HALF WORD - SET
  public setMemoryHalfWordBinaryByIndex(index: number, binary16: string): void {
    const p0 = binary16.substr(0, 8);
    const p1 = binary16.substr(8, 8);
    this._memoryInt8Array[index] = parseInt(p0, 2);
    this._memoryInt8Array[index + 1] = parseInt(p1, 2);
  }

  public setMemoryHalfWordBinaryByAddress(address: string, binary16: string): void {
    const index = Utils.hexadecimalToDecimal(address);
    const p0 = binary16.substr(0, 8);
    const p1 = binary16.substr(8, 8);
    this._memoryInt8Array[index] = parseInt(p0, 2);
    this._memoryInt8Array[index + 1] = parseInt(p1, 2);
  }


  // HALF WORD - SET
  public setMemoryFloatBinaryByAddress(address: string, binary32: string): void {
    const index = Utils.hexadecimalToDecimal(address);
    this.setMemory_stringBinary_ByIndex(index, binary32);
  }

  public setMemoryDoubleBinaryByAddress(address: string, binary64: string): void {
    const index = Utils.hexadecimalToDecimal(address);
    this.setMemory_stringBinary_ByIndex(index, binary64);
  }

  private setMemory_stringBinary_ByIndex(index: number, binary_08_16_32_64: string): void {
    for (let pos = 0; pos < binary_08_16_32_64.length; pos += 8) {
      const p0 = binary_08_16_32_64.substr(pos, 8);
      this._memoryInt8Array[index + (pos % 8)] = parseInt(p0, 2);
    }
  }

  // 0          1          2          3
  // 00000000 - 00000000 - 00000000 - 00000000
  // Page code.view
  public getAllMemoryWord(): Int32[] {
    const list = [];
    let data;
    for (let index = 0; index <= this._memorySizeBytes; index += 4) {
      data = new Int32();
      data.binary = this.getMemoryWordBinaryByIndex(index);
      list.push(data);
    }
    return list;
    // return this._memory.map((value, index) => {
    //   return value
    // })
  }

  // Page memory.view
  public getAllIndexByWord(): number[] {
    const list = [];
    for (let index = 0; index < this._memorySizeBytes; index += 4) {
      list.push(index);
    }
    return list;
  }

  public reset(): void {
    this._memoryInt8Array = new Uint8Array(this._memorySizeBytes + 8);
  }

  public setSize(memorySize: number) {
    this._memorySizeBytes = memorySize;
  }
}
