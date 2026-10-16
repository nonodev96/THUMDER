// The state of the DLX machine and what every instruction does (docs/manual-simulador-dlx.md, section 4.1). The pipeline
// (pipeline.ts) and the reference executor (reference.ts) both use it, so they cannot disagree on the semantics.
import type { Decoded } from "@core/engine/isa";

/** An error of the program being simulated (bad address, division by zero...): the simulation stops */
export class SimulationError extends Error {}

/** Byte addressable, big-endian memory (the byte 0 of a word is the most significant one) */
export class Memory {
  public readonly bytes: Uint8Array;
  private readonly view: DataView;

  constructor(public readonly size: number) {
    this.bytes = new Uint8Array(size);
    this.view = new DataView(this.bytes.buffer);
  }

  public check(address: number, bytes: number): void {
    if (!Number.isInteger(address) || address < 0 || address + bytes > this.size) {
      throw new SimulationError(`Address 0x${(address >>> 0).toString(16).toUpperCase().padStart(8, "0")} is out of memory`);
    }
    if (bytes > 1 && address % Math.min(bytes, 4) !== 0) {
      throw new SimulationError(
        `Address 0x${address.toString(16).toUpperCase().padStart(8, "0")} is not aligned to ${Math.min(bytes, 4)} bytes`,
      );
    }
  }

  public readU8(address: number): number {
    this.check(address, 1);
    return this.view.getUint8(address);
  }

  public readU16(address: number): number {
    this.check(address, 2);
    return this.view.getUint16(address);
  }

  public readU32(address: number): number {
    this.check(address, 4);
    return this.view.getUint32(address);
  }

  public writeU8(address: number, value: number): void {
    this.check(address, 1);
    this.view.setUint8(address, value & 0xff);
  }

  public writeU16(address: number, value: number): void {
    this.check(address, 2);
    this.view.setUint16(address, value & 0xffff);
  }

  public writeU32(address: number, value: number): void {
    this.check(address, 4);
    this.view.setUint32(address, value >>> 0);
  }

  /** A zero-terminated string (at most `max` bytes) */
  public readString(address: number, max = 4096): string {
    let text = "";
    for (let i = 0; i < max; i++) {
      const byte = this.readU8(address + i);
      if (byte === 0) break;
      text += String.fromCharCode(byte);
    }
    return text;
  }
}

export type FloatingPointUnit = { count: number; delay: number };

export type MachineConfig = {
  memorySize: number;
  forwarding: boolean;
  fadd: FloatingPointUnit;
  fmul: FloatingPointUnit;
  fdiv: FloatingPointUnit;
};

/** WinDLX by default: 1 unit of each kind, 2 cycles to add, 5 to multiply and 19 to divide */
export const DEFAULT_MACHINE_CONFIG: MachineConfig = {
  memorySize: 0x8000,
  forwarding: true,
  fadd: { count: 1, delay: 2 },
  fmul: { count: 1, delay: 5 },
  fdiv: { count: 1, delay: 19 },
};

/** The registers of the programmer (the special registers of the stages are in the pipeline) */
export class Registers {
  /** R0..R31 as signed 32-bit integers; R0 is always 0 */
  public readonly R = new Int32Array(32);
  /** F0..F31 as raw 32-bit patterns (a double is the pair Fn (high word) and Fn+1 (low word)) */
  public readonly F = new Uint32Array(32);
  public FPSR = 0;
  public PC = 0;

  public setR(register: number, value: number): void {
    if (register !== 0) this.R[register] = value | 0;
  }
}

// Bit conversions of IEEE 754 numbers
const scratch = new DataView(new ArrayBuffer(8));

export function floatFromBits(bits: number): number {
  scratch.setUint32(0, bits >>> 0);
  return scratch.getFloat32(0);
}

export function bitsFromFloat(value: number): number {
  scratch.setFloat32(0, value);
  return scratch.getUint32(0);
}

export function doubleFromBits(high: number, low: number): number {
  scratch.setUint32(0, high >>> 0);
  scratch.setUint32(4, low >>> 0);
  return scratch.getFloat64(0);
}

export function bitsFromDouble(value: number): [number, number] {
  scratch.setFloat64(0, value);
  return [scratch.getUint32(0), scratch.getUint32(4)];
}

/** C conversion of a floating point number to int: truncation, saturated to the range of int32 (NaN gives 0) */
function toInt32(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value >= 2147483647) return 2147483647;
  if (value <= -2147483648) return -2147483648;
  return Math.trunc(value) | 0;
}

/** The values an instruction reads in ID (registers A and B, or the floating point registers) */
export type Operands = {
  a: number;
  b: number;
  /** Floating point sources as raw words: [high, low] for doubles, [bits] for singles */
  fa: number[];
  fb: number[];
  fpsr: number;
};

/** What an instruction does when it executes (EX), before the memory access and the write back */
export type Execution = {
  /** Integer result for the destination register (or the address of a load or store) */
  value?: number;
  /** Floating point result (1 or 2 words) */
  fpValue?: number[];
  fpsr?: number;
  /** Load or store: address, bytes and, for stores, the words to write */
  memory?: { address: number; bytes: 1 | 2 | 4 | 8; store?: number[]; signed?: boolean; floating?: boolean };
  /** Branches and jumps */
  branch?: { taken: boolean; target: number; conditional: boolean };
  trap?: number;
};

/** The register written by an instruction: integer or floating point (with how many words), or none */
export type Destination = { kind: "int"; register: number } | { kind: "fp"; register: number; words: 1 | 2 } | { kind: "fpsr" } | null;

export function destination(decoded: Decoded): Destination {
  const { def, rs2, rd } = decoded;
  const isDouble = def.doubles?.includes("d") ?? false;
  switch (def.syntax) {
    case "rrr":
      return rd === 0 ? null : { kind: "int", register: rd };
    case "rri":
    case "ri":
    case "load":
      return rs2 === 0 ? null : { kind: "int", register: rs2 };
    case "rf":
      return rd === 0 ? null : { kind: "int", register: rd };
    case "fload":
      return { kind: "fp", register: rs2, words: isDouble ? 2 : 1 };
    case "fff":
    case "ff":
    case "fr":
      return { kind: "fp", register: rd, words: isDouble ? 2 : 1 };
    case "fcmp":
      return { kind: "fpsr" };
    case "jump":
      return def.mnemonic === "JAL" ? { kind: "int", register: 31 } : null;
    case "jreg":
      return def.mnemonic === "JALR" ? { kind: "int", register: 31 } : null;
    case "trap":
      return { kind: "int", register: 1 };
    default:
      return null;
  }
}

/** Reads the operands of an instruction from the registers (the pipeline replaces them with forwarded values) */
export function readOperands(decoded: Decoded, registers: Registers): Operands {
  const { def, rs1, rs2 } = decoded;
  const doubles = def.doubles ?? [];
  const fp = (register: number, isDouble: boolean) =>
    isDouble ? [registers.F[register], registers.F[register + 1]] : [registers.F[register]];
  const fpSourceA = def.syntax === "fff" || def.syntax === "ff" || def.syntax === "fcmp" || def.syntax === "rf";
  const fpSourceB = def.syntax === "fff" || def.syntax === "fcmp" || def.syntax === "fstore";
  return {
    a: registers.R[rs1],
    b: registers.R[rs2],
    fa: fpSourceA ? fp(rs1, doubles.includes("s1")) : [],
    fb: fpSourceB ? fp(rs2, def.syntax === "fstore" ? doubles.includes("d") : doubles.includes("s2")) : [],
    fpsr: registers.FPSR,
  };
}

const zeroExtended = (imm: number) => imm & 0xffff;
const ZERO_EXTENDED = new Set(["ADDUI", "SUBUI", "ANDI", "ORI", "XORI", "SEQUI", "SNEUI", "SLTUI", "SGTUI", "SLEUI", "SGEUI"]);

function compare(kind: string, a: number, b: number): number {
  switch (kind) {
    case "EQ":
      return a === b ? 1 : 0;
    case "NE":
      return a !== b ? 1 : 0;
    case "LT":
      return a < b ? 1 : 0;
    case "GT":
      return a > b ? 1 : 0;
    case "LE":
      return a <= b ? 1 : 0;
    case "GE":
      return a >= b ? 1 : 0;
    default:
      throw new SimulationError(`Unknown comparison ${kind}`);
  }
}

/** What the instruction at `pc` computes with its operands (EX stage) */
export function execute(decoded: Decoded, operands: Operands, pc: number): Execution {
  const { def, imm, offset } = decoded;
  const m = def.mnemonic;
  const { a, b, fa, fb } = operands;
  const immediate = ZERO_EXTENDED.has(m) ? zeroExtended(imm) : imm;
  const second = def.syntax === "rri" ? immediate : b;

  switch (m) {
    case "NOP":
      return {};
    case "ADD":
    case "ADDU":
    case "ADDI":
    case "ADDUI":
      return { value: (a + second) | 0 };
    case "SUB":
    case "SUBU":
    case "SUBI":
    case "SUBUI":
      return { value: (a - second) | 0 };
    case "AND":
    case "ANDI":
      return { value: a & second };
    case "OR":
    case "ORI":
      return { value: a | second };
    case "XOR":
    case "XORI":
      return { value: a ^ second };
    case "SLL":
    case "SLLI":
      return { value: a << (second & 31) };
    case "SRL":
    case "SRLI":
      return { value: a >>> (second & 31) };
    case "SRA":
    case "SRAI":
      return { value: a >> (second & 31) };
    case "LHI":
      return { value: zeroExtended(imm) << 16 };
    case "MULT":
    case "MULTU":
      return { value: Math.imul(a, b) };
    case "DIV":
      if (b === 0) throw new SimulationError("Division by zero");
      return { value: a === -2147483648 && b === -1 ? a : (a / b) | 0 };
    case "DIVU":
      if (b === 0) throw new SimulationError("Division by zero");
      return { value: Math.floor((a >>> 0) / (b >>> 0)) | 0 };
    case "MOVI2FP":
      return { fpValue: [a >>> 0] };
    case "MOVFP2I":
      return { value: fa[0] | 0 };
    case "MOVF":
      return { fpValue: [fa[0]] };
    case "MOVD":
      return { fpValue: [fa[0], fa[1]] };
    case "ADDF":
      return { fpValue: [bitsFromFloat(floatFromBits(fa[0]) + floatFromBits(fb[0]))] };
    case "SUBF":
      return { fpValue: [bitsFromFloat(floatFromBits(fa[0]) - floatFromBits(fb[0]))] };
    case "MULTF":
      return { fpValue: [bitsFromFloat(floatFromBits(fa[0]) * floatFromBits(fb[0]))] };
    case "DIVF":
      return { fpValue: [bitsFromFloat(floatFromBits(fa[0]) / floatFromBits(fb[0]))] };
    case "ADDD":
      return { fpValue: bitsFromDouble(doubleFromBits(fa[0], fa[1]) + doubleFromBits(fb[0], fb[1])) };
    case "SUBD":
      return { fpValue: bitsFromDouble(doubleFromBits(fa[0], fa[1]) - doubleFromBits(fb[0], fb[1])) };
    case "MULTD":
      return { fpValue: bitsFromDouble(doubleFromBits(fa[0], fa[1]) * doubleFromBits(fb[0], fb[1])) };
    case "DIVD":
      return { fpValue: bitsFromDouble(doubleFromBits(fa[0], fa[1]) / doubleFromBits(fb[0], fb[1])) };
    case "CVTF2D":
      return { fpValue: bitsFromDouble(floatFromBits(fa[0])) };
    case "CVTD2F":
      return { fpValue: [bitsFromFloat(doubleFromBits(fa[0], fa[1]))] };
    case "CVTF2I":
      return { fpValue: [toInt32(floatFromBits(fa[0])) >>> 0] };
    case "CVTD2I":
      return { fpValue: [toInt32(doubleFromBits(fa[0], fa[1])) >>> 0] };
    case "CVTI2F":
      return { fpValue: [bitsFromFloat(fa[0] | 0)] };
    case "CVTI2D":
      return { fpValue: bitsFromDouble(fa[0] | 0) };
    case "SEQ":
    case "SNE":
    case "SLT":
    case "SGT":
    case "SLE":
    case "SGE":
    case "SEQI":
    case "SNEI":
    case "SLTI":
    case "SGTI":
    case "SLEI":
    case "SGEI":
      return { value: compare(m.slice(1, 3), a, second) };
    case "SEQU":
    case "SNEU":
    case "SLTU":
    case "SGTU":
    case "SLEU":
    case "SGEU":
    case "SEQUI":
    case "SNEUI":
    case "SLTUI":
    case "SGTUI":
    case "SLEUI":
    case "SGEUI":
      return { value: compare(m.slice(1, 3), a >>> 0, second >>> 0) };
    case "EQF":
    case "NEF":
    case "LTF":
    case "GTF":
    case "LEF":
    case "GEF":
      return { fpsr: compare(m.slice(0, 2), floatFromBits(fa[0]), floatFromBits(fb[0])) };
    case "EQD":
    case "NED":
    case "LTD":
    case "GTD":
    case "LED":
    case "GED":
      return { fpsr: compare(m.slice(0, 2), doubleFromBits(fa[0], fa[1]), doubleFromBits(fb[0], fb[1])) };
    case "LB":
      return { memory: { address: (a + imm) >>> 0, bytes: 1, signed: true } };
    case "LBU":
      return { memory: { address: (a + imm) >>> 0, bytes: 1 } };
    case "LH":
      return { memory: { address: (a + imm) >>> 0, bytes: 2, signed: true } };
    case "LHU":
      return { memory: { address: (a + imm) >>> 0, bytes: 2 } };
    case "LW":
      return { memory: { address: (a + imm) >>> 0, bytes: 4 } };
    case "LF":
      return { memory: { address: (a + imm) >>> 0, bytes: 4, floating: true } };
    case "LD":
      return { memory: { address: (a + imm) >>> 0, bytes: 8, floating: true } };
    case "SB":
      return { memory: { address: (a + imm) >>> 0, bytes: 1, store: [b & 0xff] } };
    case "SH":
      return { memory: { address: (a + imm) >>> 0, bytes: 2, store: [b & 0xffff] } };
    case "SW":
      return { memory: { address: (a + imm) >>> 0, bytes: 4, store: [b >>> 0] } };
    case "SF":
      return { memory: { address: (a + imm) >>> 0, bytes: 4, store: [fb[0]], floating: true } };
    case "SD":
      return { memory: { address: (a + imm) >>> 0, bytes: 8, store: [fb[0], fb[1]], floating: true } };
    case "BEQZ":
      return { branch: { taken: a === 0, target: (pc + 4 + imm) >>> 0, conditional: true } };
    case "BNEZ":
      return { branch: { taken: a !== 0, target: (pc + 4 + imm) >>> 0, conditional: true } };
    case "BFPT":
      return { branch: { taken: operands.fpsr === 1, target: (pc + 4 + imm) >>> 0, conditional: true } };
    case "BFPF":
      return { branch: { taken: operands.fpsr === 0, target: (pc + 4 + imm) >>> 0, conditional: true } };
    case "J":
      return { branch: { taken: true, target: (pc + 4 + offset) >>> 0, conditional: false } };
    case "JAL":
      return { value: (pc + 4) | 0, branch: { taken: true, target: (pc + 4 + offset) >>> 0, conditional: false } };
    case "JR":
      return { branch: { taken: true, target: a >>> 0, conditional: false } };
    case "JALR":
      return { value: (pc + 4) | 0, branch: { taken: true, target: a >>> 0, conditional: false } };
    case "TRAP":
      return { trap: offset & 0x3ffffff };
    default:
      throw new SimulationError(`${m} is not supported`);
  }
}

/** The memory access of a load or store (MEM stage); a load gives the value for the destination */
export function accessMemory(execution: Execution, memory: Memory): Pick<Execution, "value" | "fpValue"> {
  const access = execution.memory;
  if (!access) return {};
  const { address, bytes, store, signed, floating } = access;
  if (store) {
    if (bytes === 1) memory.writeU8(address, store[0]);
    else if (bytes === 2) memory.writeU16(address, store[0]);
    else if (bytes === 4) memory.writeU32(address, store[0]);
    else {
      memory.check(address, 8);
      memory.writeU32(address, store[0]);
      memory.writeU32(address + 4, store[1]);
    }
    return {};
  }
  if (bytes === 1) {
    const byte = memory.readU8(address);
    return { value: signed ? (byte << 24) >> 24 : byte };
  }
  if (bytes === 2) {
    const half = memory.readU16(address);
    return { value: signed ? (half << 16) >> 16 : half };
  }
  if (bytes === 4) {
    const word = memory.readU32(address);
    return floating ? { fpValue: [word] } : { value: word | 0 };
  }
  memory.check(address, 8);
  return { fpValue: [memory.readU32(address), memory.readU32(address + 4)] };
}

/** Writes the result in its register (WB stage) */
export function writeBack(decoded: Decoded, result: Pick<Execution, "value" | "fpValue" | "fpsr">, registers: Registers): void {
  const target = destination(decoded);
  if (target === null) return;
  if (target.kind === "int" && result.value !== undefined) registers.setR(target.register, result.value);
  if (target.kind === "fp" && result.fpValue !== undefined) {
    registers.F[target.register] = result.fpValue[0] >>> 0;
    if (target.words === 2) registers.F[target.register + 1] = result.fpValue[1] >>> 0;
  }
  if (target.kind === "fpsr" && result.fpsr !== undefined) registers.FPSR = result.fpsr;
}
