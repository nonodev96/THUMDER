// The DLX instruction set as WinDLX encodes it (see docs/manual-simulador-dlx.md, section 4.1, and the opcode tables of
// src/app/__core/DLX/__OPCODES.ts, which the disassembler uses). Pure TypeScript: no Angular, so THUMDER-server can use it.
//
//   R-type (opcode 0, SPECIAL): opcode(6) rs1(5) rs2(5) rd(5) func(11)
//   F-type (opcode 1, FPARITH): opcode(6) fs1(5) fs2(5) fd(5) func(11)
//   I-type:                     opcode(6) rs1(5) rd(5)  immediate(16)
//   J-type:                     opcode(6) offset(26)

export type Format = "R" | "F" | "I" | "J";

/** The execution unit: the integer unit (intEX) or one of the floating point units */
export type Unit = "int" | "fadd" | "fmul" | "fdiv";

/** How the operands are written in assembler */
export type Syntax =
  | "none" // NOP
  | "rrr" // rd, rs1, rs2
  | "rri" // rd, rs1, imm
  | "ri" // rd, imm (LHI)
  | "load" // rd, disp(rs1)
  | "store" // disp(rs1), rs
  | "fload" // fd, disp(rs1)
  | "fstore" // disp(rs1), fs
  | "branch" // rs, label
  | "fbranch" // label (BFPT, BFPF)
  | "jump" // label
  | "jreg" // rs
  | "trap" // number
  | "fff" // fd, fs1, fs2
  | "ff" // fd, fs
  | "fcmp" // fs1, fs2
  | "fr" // fd, rs (MOVI2FP)
  | "rf"; // rd, fs (MOVFP2I)

export type InstructionDef = {
  mnemonic: string;
  format: Format;
  /** Opcode (I and J formats) or function code (R and F formats) */
  code: number;
  syntax: Syntax;
  unit: Unit;
  /** Operands that are double precision registers (an even/odd pair named by the even one) */
  doubles?: ("d" | "s1" | "s2")[];
};

const R = (mnemonic: string, code: number, syntax: Syntax, unit: Unit = "int", doubles?: InstructionDef["doubles"]): InstructionDef => ({
  mnemonic,
  format: "R",
  code,
  syntax,
  unit,
  doubles,
});
const F = (mnemonic: string, code: number, syntax: Syntax, unit: Unit, doubles?: InstructionDef["doubles"]): InstructionDef => ({
  mnemonic,
  format: "F",
  code,
  syntax,
  unit,
  doubles,
});
const I = (mnemonic: string, code: number, syntax: Syntax, doubles?: InstructionDef["doubles"]): InstructionDef => ({
  mnemonic,
  format: "I",
  code,
  syntax,
  unit: "int",
  doubles,
});
const J = (mnemonic: string, code: number, syntax: Syntax): InstructionDef => ({ mnemonic, format: "J", code, syntax, unit: "int" });

export const INSTRUCTIONS: InstructionDef[] = [
  // SPECIAL (opcode 0): integer register-register operations
  R("NOP", 0x00, "none"),
  R("SLL", 0x04, "rrr"),
  R("SRL", 0x06, "rrr"),
  R("SRA", 0x07, "rrr"),
  // WinDLX multiplies and divides integer registers in the floating point units
  R("MULT", 0x18, "rrr", "fmul"),
  R("MULTU", 0x19, "rrr", "fmul"),
  R("DIV", 0x1a, "rrr", "fdiv"),
  R("DIVU", 0x1b, "rrr", "fdiv"),
  R("ADD", 0x20, "rrr"),
  R("ADDU", 0x21, "rrr"),
  R("SUB", 0x22, "rrr"),
  R("SUBU", 0x23, "rrr"),
  R("AND", 0x24, "rrr"),
  R("OR", 0x25, "rrr"),
  R("XOR", 0x26, "rrr"),
  R("SEQ", 0x28, "rrr"),
  R("SNE", 0x29, "rrr"),
  R("SLT", 0x2a, "rrr"),
  R("SGT", 0x2b, "rrr"),
  R("SLE", 0x2c, "rrr"),
  R("SGE", 0x2d, "rrr"),
  R("MOVF", 0x32, "ff"),
  R("MOVD", 0x33, "ff", "int", ["d", "s1"]),
  R("MOVFP2I", 0x34, "rf"),
  R("MOVI2FP", 0x35, "fr"),
  // The unsigned comparisons have no code in the WinDLX tables of THUMDER: these function codes are free ones
  R("SEQU", 0x10, "rrr"),
  R("SNEU", 0x11, "rrr"),
  R("SLTU", 0x12, "rrr"),
  R("SGTU", 0x13, "rrr"),
  R("SLEU", 0x14, "rrr"),
  R("SGEU", 0x15, "rrr"),

  // FPARITH (opcode 1): floating point operations
  F("ADDF", 0x00, "fff", "fadd"),
  F("SUBF", 0x01, "fff", "fadd"),
  F("MULTF", 0x02, "fff", "fmul"),
  F("DIVF", 0x03, "fff", "fdiv"),
  F("ADDD", 0x04, "fff", "fadd", ["d", "s1", "s2"]),
  F("SUBD", 0x05, "fff", "fadd", ["d", "s1", "s2"]),
  F("MULTD", 0x06, "fff", "fmul", ["d", "s1", "s2"]),
  F("DIVD", 0x07, "fff", "fdiv", ["d", "s1", "s2"]),
  F("CVTF2D", 0x08, "ff", "int", ["d"]),
  F("CVTF2I", 0x09, "ff", "int"),
  F("CVTD2F", 0x0a, "ff", "int", ["s1"]),
  F("CVTD2I", 0x0b, "ff", "int", ["s1"]),
  F("CVTI2F", 0x0c, "ff", "int"),
  F("CVTI2D", 0x0d, "ff", "int", ["d"]),
  F("EQF", 0x10, "fcmp", "fadd"),
  F("NEF", 0x11, "fcmp", "fadd"),
  F("LTF", 0x12, "fcmp", "fadd"),
  F("GTF", 0x13, "fcmp", "fadd"),
  F("LEF", 0x14, "fcmp", "fadd"),
  F("GEF", 0x15, "fcmp", "fadd"),
  F("EQD", 0x18, "fcmp", "fadd", ["s1", "s2"]),
  F("NED", 0x19, "fcmp", "fadd", ["s1", "s2"]),
  F("LTD", 0x1a, "fcmp", "fadd", ["s1", "s2"]),
  F("GTD", 0x1b, "fcmp", "fadd", ["s1", "s2"]),
  F("LED", 0x1c, "fcmp", "fadd", ["s1", "s2"]),
  F("GED", 0x1d, "fcmp", "fadd", ["s1", "s2"]),

  // I and J types
  J("J", 0x02, "jump"),
  J("JAL", 0x03, "jump"),
  I("BEQZ", 0x04, "branch"),
  I("BNEZ", 0x05, "branch"),
  I("BFPT", 0x06, "fbranch"),
  I("BFPF", 0x07, "fbranch"),
  I("ADDI", 0x08, "rri"),
  I("ADDUI", 0x09, "rri"),
  I("SUBI", 0x0a, "rri"),
  I("SUBUI", 0x0b, "rri"),
  I("ANDI", 0x0c, "rri"),
  I("ORI", 0x0d, "rri"),
  I("XORI", 0x0e, "rri"),
  I("LHI", 0x0f, "ri"),
  J("RFE", 0x10, "none"),
  J("TRAP", 0x11, "trap"),
  I("JR", 0x12, "jreg"),
  I("JALR", 0x13, "jreg"),
  I("SLLI", 0x14, "rri"),
  I("SRLI", 0x16, "rri"),
  I("SRAI", 0x17, "rri"),
  I("SEQI", 0x18, "rri"),
  I("SNEI", 0x19, "rri"),
  I("SLTI", 0x1a, "rri"),
  I("SGTI", 0x1b, "rri"),
  I("SLEI", 0x1c, "rri"),
  I("SGEI", 0x1d, "rri"),
  I("LB", 0x20, "load"),
  I("LH", 0x21, "load"),
  I("LW", 0x23, "load"),
  I("LBU", 0x24, "load"),
  I("LHU", 0x25, "load"),
  I("LF", 0x26, "fload"),
  I("LD", 0x27, "fload", ["d"]),
  I("SB", 0x28, "store"),
  I("SH", 0x29, "store"),
  I("SW", 0x2b, "store"),
  I("SF", 0x2e, "fstore"),
  I("SD", 0x2f, "fstore", ["d"]),
  // Unsigned comparisons with an immediate: free opcodes, as above
  I("SEQUI", 0x30, "rri"),
  I("SNEUI", 0x31, "rri"),
  I("SLTUI", 0x32, "rri"),
  I("SGTUI", 0x33, "rri"),
  I("SLEUI", 0x34, "rri"),
  I("SGEUI", 0x35, "rri"),
];

export const BY_MNEMONIC = new Map(INSTRUCTIONS.map((def) => [def.mnemonic, def]));
const BY_OPCODE = new Map(INSTRUCTIONS.filter((def) => def.format === "I" || def.format === "J").map((def) => [def.code, def]));
const BY_FUNC_R = new Map(INSTRUCTIONS.filter((def) => def.format === "R").map((def) => [def.code, def]));
const BY_FUNC_F = new Map(INSTRUCTIONS.filter((def) => def.format === "F").map((def) => [def.code, def]));

/** A decoded instruction: the fields of the word (what each one means depends on the format) */
export type Decoded = {
  def: InstructionDef;
  word: number;
  /** R and F: first source; I: source (base for loads and stores) */
  rs1: number;
  /** R and F: second source; I: destination (or the register to store, or 0) */
  rs2: number;
  /** R and F: destination */
  rd: number;
  /** I: immediate, sign-extended (the instructions that zero-extend it use `imm & 0xffff`) */
  imm: number;
  /** J: 26-bit offset, sign-extended */
  offset: number;
};

/** The instruction of a 32-bit word, or null if the word is not a DLX instruction */
export function decode(word: number): Decoded | null {
  const w = word >>> 0;
  const opcode = w >>> 26;
  const rs1 = (w >>> 21) & 0x1f;
  const rs2 = (w >>> 16) & 0x1f;
  const rd = (w >>> 11) & 0x1f;
  const imm = (w << 16) >> 16;
  const offset = (w << 6) >> 6;
  let def: InstructionDef | undefined;
  if (opcode === 0) def = BY_FUNC_R.get(w & 0x3f);
  else if (opcode === 1) def = BY_FUNC_F.get(w & 0x3f);
  else def = BY_OPCODE.get(opcode);
  if (def === undefined) return null;
  return { def, word: w, rs1, rs2, rd, imm, offset };
}

/** The 32-bit word of an instruction (the fields are taken as they are, masked to their width) */
export function encode(def: InstructionDef, fields: { rs1?: number; rs2?: number; rd?: number; imm?: number; offset?: number }): number {
  const { rs1 = 0, rs2 = 0, rd = 0, imm = 0, offset = 0 } = fields;
  switch (def.format) {
    case "R":
      return ((rs1 & 0x1f) << 21) | ((rs2 & 0x1f) << 16) | ((rd & 0x1f) << 11) | def.code;
    case "F":
      return ((1 << 26) | ((rs1 & 0x1f) << 21) | ((rs2 & 0x1f) << 16) | ((rd & 0x1f) << 11) | def.code) >>> 0;
    case "I":
      return ((def.code << 26) | ((rs1 & 0x1f) << 21) | ((rs2 & 0x1f) << 16) | (imm & 0xffff)) >>> 0;
    case "J":
      return ((def.code << 26) | (offset & 0x3ffffff)) >>> 0;
  }
}

/** The registers an instruction reads and writes, for the hazards of the pipeline */
export type RegisterUse = {
  /** Integer registers read (R0 never counts) */
  intReads: number[];
  /** Floating point registers read (a double reads both of the pair) */
  fpReads: number[];
  intWrites: number[];
  fpWrites: number[];
  readsFPSR: boolean;
  writesFPSR: boolean;
};

const pair = (register: number, isDouble: boolean) => (isDouble ? [register, register + 1] : [register]);

export function registerUse(decoded: Decoded): RegisterUse {
  const { def, rs1, rs2, rd } = decoded;
  const doubles = def.doubles ?? [];
  const use: RegisterUse = { intReads: [], fpReads: [], intWrites: [], fpWrites: [], readsFPSR: false, writesFPSR: false };
  switch (def.syntax) {
    case "none":
      break;
    case "rrr":
      use.intReads.push(rs1, rs2);
      use.intWrites.push(rd);
      break;
    case "rri":
      use.intReads.push(rs1);
      use.intWrites.push(rs2);
      break;
    case "ri":
      use.intWrites.push(rs2);
      break;
    case "load":
      use.intReads.push(rs1);
      use.intWrites.push(rs2);
      break;
    case "store":
      use.intReads.push(rs1, rs2);
      break;
    case "fload":
      use.intReads.push(rs1);
      use.fpWrites.push(...pair(rs2, doubles.includes("d")));
      break;
    case "fstore":
      use.intReads.push(rs1);
      use.fpReads.push(...pair(rs2, doubles.includes("d")));
      break;
    case "branch":
      use.intReads.push(rs1);
      break;
    case "fbranch":
      use.readsFPSR = true;
      break;
    case "jump":
      if (def.mnemonic === "JAL") use.intWrites.push(31);
      break;
    case "jreg":
      use.intReads.push(rs1);
      if (def.mnemonic === "JALR") use.intWrites.push(31);
      break;
    case "trap":
      // Traps read their parameters from memory through R14 and leave their result in R1
      use.intReads.push(14);
      use.intWrites.push(1);
      break;
    case "fff":
      use.fpReads.push(...pair(rs1, doubles.includes("s1")), ...pair(rs2, doubles.includes("s2")));
      use.fpWrites.push(...pair(rd, doubles.includes("d")));
      break;
    case "ff":
      use.fpReads.push(...pair(rs1, doubles.includes("s1")));
      use.fpWrites.push(...pair(rd, doubles.includes("d")));
      break;
    case "fcmp":
      use.fpReads.push(...pair(rs1, doubles.includes("s1")), ...pair(rs2, doubles.includes("s2")));
      use.writesFPSR = true;
      break;
    case "fr":
      use.intReads.push(rs1);
      use.fpWrites.push(rd);
      break;
    case "rf":
      use.fpReads.push(rs1);
      use.intWrites.push(rd);
      break;
  }
  use.intReads = use.intReads.filter((register) => register !== 0);
  use.intWrites = use.intWrites.filter((register) => register !== 0);
  return use;
}

const R_ = (n: number) => `R${n}`;
const F_ = (n: number) => `F${n}`;
const hex = (n: number) => `0x${(n >>> 0).toString(16)}`;

/** The instruction in assembler (the targets of branches and jumps as absolute addresses) */
export function disassemble(decoded: Decoded, address: number): string {
  const { def, rs1, rs2, rd, imm, offset } = decoded;
  const m = def.mnemonic.toLowerCase();
  switch (def.syntax) {
    case "none":
      return m;
    case "rrr":
      return `${m} ${R_(rd)},${R_(rs1)},${R_(rs2)}`;
    case "rri":
      return `${m} ${R_(rs2)},${R_(rs1)},${["ANDI", "ORI", "XORI", "ADDUI", "SUBUI"].includes(def.mnemonic) ? hex(imm & 0xffff) : imm}`;
    case "ri":
      return `${m} ${R_(rs2)},${hex(imm & 0xffff)}`;
    case "load":
      return `${m} ${R_(rs2)},${imm}(${R_(rs1)})`;
    case "store":
      return `${m} ${imm}(${R_(rs1)}),${R_(rs2)}`;
    case "fload":
      return `${m} ${F_(rs2)},${imm}(${R_(rs1)})`;
    case "fstore":
      return `${m} ${imm}(${R_(rs1)}),${F_(rs2)}`;
    case "branch":
      return `${m} ${R_(rs1)},${hex(address + 4 + imm)}`;
    case "fbranch":
      return `${m} ${hex(address + 4 + imm)}`;
    case "jump":
      return `${m} ${hex(address + 4 + offset)}`;
    case "jreg":
      return `${m} ${R_(rs1)}`;
    case "trap":
      return `${m} ${offset & 0x3ffffff}`;
    case "fff":
      return `${m} ${F_(rd)},${F_(rs1)},${F_(rs2)}`;
    case "ff":
      return `${m} ${F_(rd)},${F_(rs1)}`;
    case "fcmp":
      return `${m} ${F_(rs1)},${F_(rs2)}`;
    case "fr":
      return `${m} ${F_(rd)},${R_(rs1)}`;
    case "rf":
      return `${m} ${R_(rd)},${F_(rs1)}`;
  }
}
