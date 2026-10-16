import { MACHINE_ALL_REGISTER_CONTROL } from "@app/CONSTANTS";
import type { TypeRegisterControl, TypeRegisterToUpdate } from "@app/Types";
import { Utils } from "@app/Utils";
import type { InterfaceRegisters } from "@core/DLX/interfaces";
import { logger } from "@core/logger/logger";
import { hexToBits } from "@core/numbers";
import { Float32, Int32 } from "@core/TypesData";

export class ManagerRegisters implements InterfaceRegisters {
  PC: Int32;
  IMAR: Int32;
  IR: Int32;
  A: Int32;
  AHI: Int32;
  B: Int32;
  BHI: Int32;
  BTA: Int32;
  ALU: Int32;
  ALUHI: Int32;
  FPSR: Int32;
  DMAR: Int32;
  SDR: Int32;
  SDRHI: Int32;
  LDR: Int32;
  LDRHI: Int32;
  R: Int32[];
  F: Float32[];

  // $TEXT+0x00 - $TEXT+0xfc
  // 0x00000200 - 0x00007ffc
  // code = Array<Int32>(32764)
  // memory = Array<Int32>(32736)
  constructor() {
    this.PC = new Int32();
    this.IMAR = new Int32();
    this.IR = new Int32();
    this.A = new Int32();
    this.AHI = new Int32();
    this.B = new Int32();
    this.BHI = new Int32();
    this.BTA = new Int32();
    this.ALU = new Int32();
    this.ALUHI = new Int32();
    this.FPSR = new Int32();
    this.DMAR = new Int32();
    this.SDR = new Int32();
    this.SDRHI = new Int32();
    this.LDR = new Int32();
    this.LDRHI = new Int32();

    this.R = Array<Int32>(32);
    this.F = Array<Float32>(32);
    for (let i = 0; i < 32; i++) {
      this.R[i] = new Int32();
      this.F[i] = new Float32();
    }
  }

  public processRegisterToUpdateArray(response: TypeRegisterToUpdate[]): void {
    for (const registerToUpdate of response) {
      const { typeRegister, register, hexadecimalValue } = registerToUpdate;
      switch (typeRegister) {
        case "Control": {
          this.setRegisterControlWithHexadecimal(register as TypeRegisterControl, hexadecimalValue);
          break;
        }
        case "Integer": {
          this.setRegisterIntegerWithHexadecimal(Utils.getRegisterNumber(register), hexadecimalValue);
          break;
        }
        case "Float": {
          this.setRegisterFloatWithHexadecimal(Utils.getRegisterNumber(register), hexadecimalValue);
          break;
        }
        case "Double": {
          const index = Utils.getRegisterNumber(register);
          // THUMDER-server sends each half of a double as its own 32-bit entry (F<n> and F<n+1>);
          // a 64-bit value (more than 8 hexadecimal digits) fills the pair starting at the even register
          if (hexadecimalValue.replace(/^0x/i, "").length > 8) this.setRegisterDoubleWithHexadecimal(index, hexadecimalValue);
          else this.setRegisterFloatWithHexadecimal(index, hexadecimalValue);
          break;
        }
        default: {
          logger.warn("Can't process register %s, %s, %s", typeRegister, register, hexadecimalValue);
          break;
        }
      }
    }
  }

  // Hexadecimal
  public setRegisterControlWithHexadecimal(registerControl: TypeRegisterControl, hexadecimal: string) {
    this.setRegisterControlWithBinary(registerControl, hexToBits(hexadecimal, 32));
  }

  public setRegisterIntegerWithHexadecimal(index: number, hexadecimal: string) {
    this.setRegisterIntegerWithBinary(index, hexToBits(hexadecimal, 32));
  }

  public setRegisterFloatWithHexadecimal(index: number, hexadecimal: string) {
    this.setRegisterFloatWithBinary(index, hexToBits(hexadecimal, 32));
  }

  public setRegisterDoubleWithHexadecimal(index: number, hexadecimal: string) {
    this.setRegisterDoubleWithBinary(index, hexToBits(hexadecimal, 64));
  }

  // Binary
  public setRegisterControlWithBinary(registerControl: TypeRegisterControl, binary: string) {
    if (!MACHINE_ALL_REGISTER_CONTROL.includes(registerControl)) {
      throw new Error(`Register Control unknown (register: ${registerControl})`);
    }
    ManagerRegisters.checkBinary(binary, 32);
    this[registerControl] = new Int32();
    this[registerControl].binary = binary;
  }

  public setRegisterIntegerWithBinary(index: number, binary: string) {
    if (!Number.isInteger(index) || index < 0 || index > 31) {
      throw new Error(`Register Integer error in range (index: ${index})`);
    }
    ManagerRegisters.checkBinary(binary, 32);
    this.R[index] = new Int32();
    this.R[index].binary = binary;
  }

  public setRegisterFloatWithBinary(index: number, binary: string) {
    if (!Number.isInteger(index) || index < 0 || index > 31) {
      throw new Error(`Register Float error in range (index: ${index})`);
    }
    this.F[index] = new Float32();
    this.F[index].binary = binary;
  }

  // A double uses an even/odd pair of registers (D0 = F0-F1, ..., D30 = F30-F31), named by the even one
  public setRegisterDoubleWithBinary(index: number, binary: string) {
    if (!Number.isInteger(index) || index < 0 || index > 30 || index % 2 !== 0) {
      throw new Error(`Register Double error in range (index: ${index})`);
    }
    ManagerRegisters.checkBinary(binary, 64);
    this.F[index] = new Float32();
    this.F[index + 1] = new Float32();
    this.F[index].binary = binary.slice(0, 32);
    this.F[index + 1].binary = binary.slice(32, 64);
  }

  private static checkBinary(binary: string, bits: number) {
    if (binary.length !== bits || !/^[01]+$/.test(binary)) {
      throw new Error(`Expected ${bits} bits, got "${binary}"`);
    }
  }

  public reset(): void {
    for (const registerControl of MACHINE_ALL_REGISTER_CONTROL) {
      const r = registerControl as TypeRegisterControl;
      this[r] = new Int32();
    }
    for (let i = 0; i < 32; i++) {
      this.R[i] = new Int32();
      this.F[i] = new Float32();
    }
  }
}
