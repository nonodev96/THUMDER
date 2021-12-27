import { Float32, Int32 } from "../typesData";
import { stringOfLength, StringOfLength } from "../../types";

export interface InterfaceRegisters {
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
}

export interface InterfaceBreakpoints {

}

export interface InterfaceMemory {

}

export interface InterfaceDataStatistics {

}

export interface InterfaceInstructionTypeI {
  codeOP: StringOfLength<6, 6>;
  rs1: StringOfLength<5, 5>;
  rd: StringOfLength<5, 5>;
  inmediato: StringOfLength<16, 16>;
}

export interface InterfaceInstructionTypeR {
  codeOP: StringOfLength<6, 6>;
  rs1: StringOfLength<5, 5>;
  rs2: StringOfLength<5, 5>;
  rd: StringOfLength<5, 5>;
  func: StringOfLength<11, 11>;
}

export interface InterfaceInstructionTypeJ {
  codeOP: StringOfLength<6, 6>;
  des: StringOfLength<26, 26>;
}

export class InstructionTypeI implements InterfaceInstructionTypeI {
  codeOP: StringOfLength<6, 6>;
  rs1: StringOfLength<5, 5>;
  rd: StringOfLength<5, 5>;
  inmediato: StringOfLength<16, 16>;

  constructor(codeOP: string, rs1: string, rd: string, inmediato: string) {
    this.codeOP = stringOfLength(codeOP, 6, 6);
    this.rs1 = stringOfLength(rs1, 5, 5);
    this.rd = stringOfLength(rd, 5, 5);
    this.inmediato = stringOfLength(inmediato, 16, 16);
  }

  public toString() {
    return this.codeOP.toString() + this.rs1.toString() + this.rd.toString() + this.inmediato.toString();
  }
}

export class InstructionTypeR implements InterfaceInstructionTypeR {
  codeOP: StringOfLength<6, 6>;
  rs1: StringOfLength<5, 5>;
  rs2: StringOfLength<5, 5>;
  rd: StringOfLength<5, 5>;
  func: StringOfLength<11, 11>;

  constructor(codeOP: string, rs1: string, rs2: string, rd: string, func: string) {
    this.codeOP = stringOfLength(codeOP, 6, 6);
    this.rs1 = stringOfLength(rs1, 5, 5);
    this.rs2 = stringOfLength(rs2, 5, 5);
    this.rd = stringOfLength(rd, 5, 5);
    this.func = stringOfLength(func, 11, 11);
  }

  public toString() {
    return this.codeOP.toString() + this.rs1.toString() + this.rs2.toString() + this.rd.toString() + this.func.toString();
  }
}

export class InstructionTypeJ implements InterfaceInstructionTypeJ {
  codeOP: StringOfLength<6, 6>;
  des: StringOfLength<26, 26>;

  constructor(codeOP: string, des: string) {
    this.codeOP = stringOfLength(codeOP, 6, 6);
    this.des = stringOfLength(des, 26, 26);
  }

  public toString() {
    return this.codeOP.toString() + this.des.toString();
  }
}


export interface InterfaceOperation {
  readonly name: string;
}

export abstract class Operation implements InterfaceOperation {
  private readonly _name: string;

  protected constructor(name: string) {
    this._name = name;
  }

  get name() {
    return this._name;
  }
}
