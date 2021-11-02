import { InterfaceMemory } from "./interfaces";
import { Int32 } from "../typesData";
import { Utils } from "../../Utils";

export class Memory implements InterfaceMemory {
  // Bytes
  private _memorySize: number;
  // private _memory: Array<Int32>;
  private _memoryInt8Array: Uint8Array;

  constructor(memorySize: number) {
    this._memorySize = memorySize;
    this._memoryInt8Array = new Uint8Array(this._memorySize);
    // this._memory = [...new Array(this._memorySize)].map((v, i, a) => new Int32())
  }

  get memorySize() {
    return this._memorySize * 4;
  }

  set memorySize(memorySize: number) {
    this._memorySize = memorySize;
    this._memoryInt8Array = new Uint8Array(this._memorySize);
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
      this._memoryInt8Array[index].toString(2).padStart(8, '0') +
      this._memoryInt8Array[index + 1].toString(2).padStart(8, '0') +
      this._memoryInt8Array[index + 2].toString(2).padStart(8, '0') +
      this._memoryInt8Array[index + 3].toString(2).padStart(8, '0')
  }

  // WORD - SET
  public setMemoryWordByIndex(index: number, data: Int32) {
    this.setMemoryWordBinaryByIndex(index, data.binary)
  }

  public setMemoryWordByAddress(address: string, data: Int32): void {
    const index = Utils.hexadecimalToDecimal(address);
    this.setMemoryWordBinaryByIndex(index, data.binary);
  }

  public setMemoryWordBinaryByIndex(index: number, binary: string): void {
    const p0 = binary.substr(0, 8);
    const p1 = binary.substr(8, 8);
    const p2 = binary.substr(16, 8);
    const p3 = binary.substr(24, 8);
    this._memoryInt8Array[index] = parseInt(p0, 2);
    this._memoryInt8Array[index + 1] = parseInt(p1, 2);
    this._memoryInt8Array[index + 2] = parseInt(p2, 2);
    this._memoryInt8Array[index + 3] = parseInt(p3, 2);
  }

  // BYTE - GET
  public getMemoryByteBinaryByIndex(index: number): string {
    return this._memoryInt8Array[index].toString(2).padStart(8, '0');
  }

  // BYTE - SET
  public setMemoryByteBinaryByIndex(index: number, binary: string): void {
    const p0 = binary.substr(0, 8);
    this._memoryInt8Array[index] = parseInt(p0, 2);
  }

  // HALF WORD - GET
  public getMemoryHalfWordBinaryByIndex(index: number): string {
    return "" +
      this._memoryInt8Array[index].toString(2).padStart(8, '0') +
      this._memoryInt8Array[index + 1].toString(2).padStart(8, '0');
  }

  // HALF WORD - SET
  public setMemoryHalfWordBinaryByIndex(index: number, binary: string): void {
    const p0 = binary.substr(0, 8);
    const p1 = binary.substr(8, 8);
    this._memoryInt8Array[index] = parseInt(p0, 2);
    this._memoryInt8Array[index + 1] = parseInt(p1, 2);
  }

  // 0          1          2          3
  // 00000000 - 00000000 - 00000000 - 00000000
  public getAllMemoryWord(): Int32[] {
    const list = [];
    let data;
    for (let index = 0; index < this._memoryInt8Array.length; index += 4) {
      data = new Int32();
      data.binary = this.getMemoryWordBinaryByIndex(index);
      list.push(data);
    }
    return list;
    // return this._memory.map((value, index) => {
    //   return value
    // })
  }

  public getAllIndexByWord(): number[] {
    const list = [];
    for (let index = 0; index < this._memoryInt8Array.length; index += 4) {
      list.push(index)
    }
    return list;
  }
}
