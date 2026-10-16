import type { TypeDirectiveData, TypeInstructionsData, TypeMemory, TypeMemoryToUpdate } from "@app/Types";
import type { InterfaceMemory } from "@core/DLX/interfaces";
import { logger } from "@core/logger/logger";
import { hexToBits, hexToNumber } from "@core/numbers";
import { Int32 } from "@core/TypesData";

// Memoria big-endian direccionable por bytes: el byte 0 de una palabra es el más significativo
export class ManagerMemory implements InterfaceMemory {
  // Bytes
  public _memorySizeBytes: number;
  public _memoryInt8Array: Uint8Array;

  constructor(memorySizeBytes: number) {
    this._memorySizeBytes = memorySizeBytes;
    // 8 bytes de margen: un double que empiece en la última palabra no se sale del array
    this._memoryInt8Array = new Uint8Array(this._memorySizeBytes + 8);
  }

  get memorySizeBytes() {
    return this._memorySizeBytes;
  }

  set memorySizeBytes(memorySize: number) {
    this.setSize(memorySize);
  }

  public processResponseMachineDirectives(directives: TypeDirectiveData[]): void {
    for (const directive of directives) {
      switch (directive.directive) {
        case "DATA":
        case "GLOBAL":
        case "SPACE":
        case "ALIGN":
        case "ASCII":
        case "ASCIIZ":
        case "BYTE":
        case "FLOAT":
        case "DOUBLE":
        case "WORD":
        case "TEXT": {
          // THUMDER-server writes the data of the directives into its own memory and does not send it yet
          break;
        }
        default: {
          logger.warn("Error, type of directive not valid", directive);
          break;
        }
      }
    }
  }

  public processResponseMachineInstructions(instructions: TypeInstructionsData[]): void {
    for (const instruction of instructions) {
      const binary32 = hexToBits(instruction.code);
      this.setMemoryWordBinaryByAddress(instruction.address, binary32);
    }
  }

  public processMemoryToUpdateArray(response: TypeMemoryToUpdate[]): void {
    for (const memoryToUpdate of response) {
      const { typeData, address, value } = memoryToUpdate;
      switch (typeData) {
        case "Byte": {
          this.setMemoryByteBinaryByAddress(address, hexToBits(value, 8));
          break;
        }
        case "HalfWord": {
          this.setMemoryHalfWordBinaryByAddress(address, hexToBits(value, 16));
          break;
        }
        case "Word": {
          this.setMemoryWordBinaryByAddress(address, hexToBits(value, 32));
          break;
        }
        case "Float": {
          this.setMemoryFloatBinaryByAddress(address, hexToBits(value, 32));
          break;
        }
        case "Double": {
          this.setMemoryDoubleBinaryByAddress(address, hexToBits(value, 64));
          break;
        }
        case "ASCII": {
          break;
        }
        default: {
          logger.warn("Can't process memory", typeData, address, value);
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
    return this.getMemoryWordByIndex(hexToNumber(address));
  }

  public getMemoryWordBinaryByIndex(index: number): string {
    return this.readBinary(index, 4);
  }

  // WORD - SET
  public setMemoryWordByIndex(index: number, data: Int32) {
    this.setMemoryWordBinaryByIndex(index, data.binary);
  }

  public setMemoryWordByAddress(address: string, data: Int32): void {
    this.setMemoryWordBinaryByIndex(hexToNumber(address), data.binary);
  }

  public setMemoryWordBinaryByAddress(address: string, binary32: string): void {
    this.setMemoryWordBinaryByIndex(hexToNumber(address), binary32);
  }

  public setMemoryWordBinaryByIndex(index: number, binary32: string): void {
    this.writeBinary(index, binary32, 4);
  }

  // BYTE - GET
  public getMemoryByteBinaryByIndex(index: number): string {
    return this.readBinary(index, 1);
  }

  // BYTE - SET
  // A longer value keeps its low-order byte
  public setMemoryByteBinaryByIndex(index: number, binary: string): void {
    this.writeBinary(index, binary.length > 8 ? binary.slice(-8) : binary, 1);
  }

  public setMemoryByteBinaryByAddress(address: string, binary08: string): void {
    this.setMemoryByteBinaryByIndex(hexToNumber(address), binary08);
  }

  // HALF WORD - GET
  public getMemoryHalfWordBinaryByIndex(index: number): string {
    return this.readBinary(index, 2);
  }

  // HALF WORD - SET
  public setMemoryHalfWordBinaryByIndex(index: number, binary16: string): void {
    this.writeBinary(index, binary16.length > 16 ? binary16.slice(-16) : binary16, 2);
  }

  public setMemoryHalfWordBinaryByAddress(address: string, binary16: string): void {
    this.setMemoryHalfWordBinaryByIndex(hexToNumber(address), binary16);
  }

  // ANY WIDTH (1, 2, 4 or 8 bytes)
  public getMemoryBinaryByIndex(index: number, bytes: number): string {
    return this.readBinary(index, bytes);
  }

  public setMemoryBinaryByIndex(index: number, binary: string): void {
    this.writeBinary(index, binary, binary.length / 8);
  }

  /** Whether `bytes` bytes starting at `index` are inside the memory */
  public isInMemory(index: number, bytes: number): boolean {
    return Number.isInteger(index) && index >= 0 && index + bytes <= this._memorySizeBytes;
  }

  // FLOAT / DOUBLE - SET
  public setMemoryFloatBinaryByAddress(address: string, binary32: string): void {
    this.writeBinary(hexToNumber(address), binary32, 4);
  }

  public setMemoryDoubleBinaryByAddress(address: string, binary64: string): void {
    this.writeBinary(hexToNumber(address), binary64, 8);
  }

  // 0          1          2          3
  // 00000000 - 00000000 - 00000000 - 00000000
  public getAllMemoryWord(): Int32[] {
    return this.getAllIndexByWord().map((index) => this.getMemoryWordByIndex(index));
  }

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

  // Cambiar el tamaño vacía la memoria
  public setSize(memorySize: number) {
    this._memorySizeBytes = memorySize;
    this.reset();
  }

  // TODO
  // group by 4 steps
  public getAllMemory(): TypeMemory[] {
    return Array.from(this._memoryInt8Array).flatMap((v, index) => {
      if (v === 0) return [];
      return [
        {
          address: index.toString(16).padStart(2, "0"),
          value: v,
        } as TypeMemory,
      ];
    });
  }

  private checkRange(index: number, bytes: number) {
    if (!Number.isInteger(index) || index < 0 || index + bytes > this._memorySizeBytes + 8) {
      const address = Number.isInteger(index) && index >= 0 ? `0x${index.toString(16).toUpperCase().padStart(8, "0")}` : String(index);
      throw new RangeError(`Address ${address} is out of memory (${this._memorySizeBytes} bytes)`);
    }
  }

  private readBinary(index: number, bytes: number): string {
    this.checkRange(index, bytes);
    let binary = "";
    for (let i = 0; i < bytes; i++) {
      binary += this._memoryInt8Array[index + i].toString(2).padStart(8, "0");
    }
    return binary;
  }

  // Writes `bytes` bytes from `binary` (8 bits per byte, most significant byte first)
  private writeBinary(index: number, binary: string, bytes: number): void {
    if (binary.length !== bytes * 8 || !/^[01]+$/.test(binary)) {
      throw new Error(`Expected ${bytes * 8} bits, got "${binary}"`);
    }
    this.checkRange(index, bytes);
    for (let i = 0; i < bytes; i++) {
      this._memoryInt8Array[index + i] = parseInt(binary.slice(i * 8, i * 8 + 8), 2);
    }
  }
}
