import { Operation } from "./interfaces";
import { HaltOperation } from "./HaltOperation";
import { Operation_Register } from "./Operation_Register";

export type TypeOperation = "debug"
  | "nop" | "add" | "addu" | "and" | "movd" | "movf" | "movfp2i" | "movi2fp" | "movi2s" | "movs2i" | "or" | "seq"
  | "sge" | "sgeu" | "sgt" | "sgtu" | "sle" | "sleu" | "sll" | "slt" | "sltu" | "sne" | "sra" | "srl" | "sub" | "subu"
  | "xor"
  | "halt"

  | "special" | "fparith" | "addi" | "addui" | "andi" | "beqz" | "bfpf" | "bfpt" | "bnez" | "j" | "jal" | "jalr" | "jr"
  | "lb" | "lbu" | "ld" | "lf" | "lh" | "lhi" | "lhu" | "lw" | "ori" | "rfe" | "sb" | "sd" | "seqi" | "sf" | "sgei"
  | "sgeui" | "sgti" | "sgtui" | "sh" | "slei" | "sleui" | "slli" | "slti" | "sltui" | "snei" | "srai" | "srli" | "subi"
  | "subui" | "sw" | "trap" | "xori" | "la"

  | "addd" | "addf" | "cvtd2f" | "cvtd2i" | "cvtf2d" | "cvtf2i" | "cvti2d" | "cvti2f" | "div" | "divd" | "divf" | "divu"
  | "eqd" | "eqf" | "ged" | "gef" | "gtd" | "gtf" | "led" | "lef" | "ltd" | "ltf" | "mult" | "multd" | "multf" | "multu"
  | "ned" | "nef" | "subd" | "subf";

export type TypeOperationUppercase = Uppercase<TypeOperation>

/*@formatter:off*/
type DLX_mapper = {
  name: string,
  op: number,
  func: number,
  optype: string
}

const spec: DLX_mapper[] =
  [
    {name: "nop",     op: 0x00, func: 0x00, optype: "NONEOP"},
    {name: "add",     op: 0x00, func: 0x01, optype: "REG3IMM"},
    {name: "addu",    op: 0x00, func: 0x02, optype: "REG3IMM"},
    {name: "and",     op: 0x00, func: 0x03, optype: "REG3IMM"},
    {name: "movd",    op: 0x00, func: 0x04, optype: "DREG2a"},
    {name: "movf",    op: 0x00, func: 0x05, optype: "FREG2a"},
    {name: "movfp2i", op: 0x00, func: 0x06, optype: "IF2"},
    {name: "movi2fp", op: 0x00, func: 0x07, optype: "FI2"},
    {name: "movi2s",  op: 0x00, func: 0x08, optype: "UNIMP"},
    {name: "movs2i",  op: 0x00, func: 0x09, optype: "UNIMP"},
    {name: "or",      op: 0x00, func: 0x0a, optype: "REG3IMM"},
    {name: "seq",     op: 0x00, func: 0x0b, optype: "REG3IMM"},
    {name: "sge",     op: 0x00, func: 0x0c, optype: "REG3IMM"},
    {name: "sgeu",    op: 0x00, func: 0x0d, optype: "REG3IMM"}, /* added instruction */
    {name: "sgt",     op: 0x00, func: 0x0e, optype: "REG3IMM"},
    {name: "sgtu",    op: 0x00, func: 0x0f, optype: "REG3IMM"}, /* added instruction */
    {name: "sle",     op: 0x00, func: 0x10, optype: "REG3IMM"},
    {name: "sleu",    op: 0x00, func: 0x11, optype: "REG3IMM"}, /* added instruction */
    {name: "sll",     op: 0x00, func: 0x12, optype: "REG3IMM"},
    {name: "slt",     op: 0x00, func: 0x13, optype: "REG3IMM"},
    {name: "sltu",    op: 0x00, func: 0x14, optype: "REG3IMM"}, /* added instruction */
    {name: "sne",     op: 0x00, func: 0x15, optype: "REG3IMM"},
    {name: "sra",     op: 0x00, func: 0x16, optype: "REG3IMM"},
    {name: "srl",     op: 0x00, func: 0x17, optype: "REG3IMM"},
    {name: "sub",     op: 0x00, func: 0x18, optype: "REG3IMM"},
    {name: "subu",    op: 0x00, func: 0x19, optype: "REG3IMM"},
    {name: "xor",     op: 0x00, func: 0x1a, optype: "REG3IMM"}
  ];
const mainops: DLX_mapper[] =
  [
    {name: "special", op: 0x00, func: 0x00, optype: "UNIMP"},
    {name: "fparith", op: 0x01, func: 0x00, optype: "UNIMP"},
    {name: "addi",    op: 0x02, func: 0x00, optype: "REG2IMM"},
    {name: "addui",   op: 0x03, func: 0x00, optype: "REG2IMM"},
    {name: "andi",    op: 0x04, func: 0x00, optype: "REG2IMM"},
    {name: "beqz",    op: 0x05, func: 0x00, optype: "REGLAB"},
    {name: "bfpf",    op: 0x06, func: 0x00, optype: "LEXP16"},
    {name: "bfpt",    op: 0x07, func: 0x00, optype: "LEXP16"},
    {name: "bnez",    op: 0x08, func: 0x00, optype: "REGLAB"},
    {name: "j",       op: 0x09, func: 0x00, optype: "LEXP26"},
    {name: "jal",     op: 0x0a, func: 0x00, optype: "LEXP26"},
    {name: "jalr",    op: 0x0b, func: 0x00, optype: "IREG1"},
    {name: "jr",      op: 0x0c, func: 0x00, optype: "IREG1"},
    {name: "lb",      op: 0x0d, func: 0x00, optype: "LOADI"},
    {name: "lbu",     op: 0x0e, func: 0x00, optype: "LOADI"},
    {name: "ld",      op: 0x0f, func: 0x00, optype: "LOADD"},
    {name: "lf",      op: 0x10, func: 0x00, optype: "LOADF"},
    {name: "lh",      op: 0x11, func: 0x00, optype: "LOADI"},
    {name: "lhi",     op: 0x12, func: 0x00, optype: "REG1IMM"},
    {name: "lhu",     op: 0x13, func: 0x00, optype: "LOADI"},
    {name: "lw",      op: 0x14, func: 0x00, optype: "LOADI"},
    {name: "ori",     op: 0x15, func: 0x00, optype: "REG2IMM"},
    {name: "rfe",     op: 0x16, func: 0x00, optype: "UNIMP"},
    {name: "sb",      op: 0x17, func: 0x00, optype: "STRI"},
    {name: "sd",      op: 0x18, func: 0x00, optype: "STRD"},
    {name: "seqi",    op: 0x19, func: 0x00, optype: "REG2IMM"},
    {name: "sf",      op: 0x1a, func: 0x00, optype: "STRF"},
    {name: "sgei",    op: 0x1b, func: 0x00, optype: "REG2IMM"},
    {name: "sgeui",   op: 0x1c, func: 0x00, optype: "REG2IMM"}, /* added instruction */
    {name: "sgti",    op: 0x1d, func: 0x00, optype: "REG2IMM"},
    {name: "sgtui",   op: 0x1e, func: 0x00, optype: "REG2IMM"}, /* added instruction */
    {name: "sh",      op: 0x1f, func: 0x00, optype: "STRI"},
    {name: "slei",    op: 0x20, func: 0x00, optype: "REG2IMM"},
    {name: "sleui",   op: 0x21, func: 0x00, optype: "REG2IMM"}, /* added instruction */
    {name: "slli",    op: 0x22, func: 0x00, optype: "REG2IMM"},
    {name: "slti",    op: 0x23, func: 0x00, optype: "REG2IMM"},
    {name: "sltui",   op: 0x24, func: 0x00, optype: "REG2IMM"}, /* added instruction */
    {name: "snei",    op: 0x25, func: 0x00, optype: "REG2IMM"},
    {name: "srai",    op: 0x26, func: 0x00, optype: "REG2IMM"},
    {name: "srli",    op: 0x27, func: 0x00, optype: "REG2IMM"},
    {name: "subi",    op: 0x28, func: 0x00, optype: "REG2IMM"},
    {name: "subui",   op: 0x29, func: 0x00, optype: "REG2IMM"},
    {name: "sw",      op: 0x2a, func: 0x00, optype: "STRI"},
    {name: "trap",    op: 0x2b, func: 0x00, optype: "IMM1"},
    {name: "xori",    op: 0x2c, func: 0x00, optype: "REG2IMM"},
    {name: "la",      op: 0x30, func: 0x00, optype: "PSEUDO"}
  ];
const fpops: DLX_mapper[] =
  [
    {name: "addd",    op: 0x01, func: 0x00, optype: "DREG3"},
    {name: "addf",    op: 0x01, func: 0x01, optype: "FREG3"},
    {name: "cvtd2f",  op: 0x01, func: 0x02, optype: "FD2"},
    {name: "cvtd2i",  op: 0x01, func: 0x03, optype: "FD2"},
    {name: "cvtf2d",  op: 0x01, func: 0x04, optype: "DF2"},
    {name: "cvtf2i",  op: 0x01, func: 0x05, optype: "FREG2a"},
    {name: "cvti2d",  op: 0x01, func: 0x06, optype: "DF2"},
    {name: "cvti2f",  op: 0x01, func: 0x07, optype: "FREG2a"},
    {name: "div",     op: 0x01, func: 0x08, optype: "FREG3"},
    {name: "divd",    op: 0x01, func: 0x09, optype: "DREG3"},
    {name: "divf",    op: 0x01, func: 0x0a, optype: "FREG3"},
    {name: "divu",    op: 0x01, func: 0x0b, optype: "FREG3"},
    {name: "eqd",     op: 0x01, func: 0x0c, optype: "DREG2b"},
    {name: "eqf",     op: 0x01, func: 0x0d, optype: "FREG2b"},
    {name: "ged",     op: 0x01, func: 0x0e, optype: "DREG2b"},
    {name: "gef",     op: 0x01, func: 0x0f, optype: "FREG2b"},
    {name: "gtd",     op: 0x01, func: 0x10, optype: "DREG2b"},
    {name: "gtf",     op: 0x01, func: 0x11, optype: "FREG2b"},
    {name: "led",     op: 0x01, func: 0x12, optype: "DREG2b"},
    {name: "lef",     op: 0x01, func: 0x13, optype: "FREG2b"},
    {name: "ltd",     op: 0x01, func: 0x14, optype: "DREG2b"},
    {name: "ltf",     op: 0x01, func: 0x15, optype: "FREG2b"},
    {name: "mult",    op: 0x01, func: 0x16, optype: "FREG3"},
    {name: "multd",   op: 0x01, func: 0x17, optype: "DREG3"},
    {name: "multf",   op: 0x01, func: 0x18, optype: "FREG3"},
    {name: "multu",   op: 0x01, func: 0x19, optype: "FREG3"},
    {name: "ned",     op: 0x01, func: 0x1a, optype: "DREG2b"},
    {name: "nef",     op: 0x01, func: 0x1b, optype: "FREG2b"},
    {name: "subd",    op: 0x01, func: 0x1c, optype: "DREG3"},
    {name: "subf",    op: 0x01, func: 0x1d, optype: "FREG3"}
  ];

export const OPCODES: { [code in Partial<TypeOperationUppercase>]: Operation[] } = {
  ADD:      [new Operation_Register("ADD",(a, b) => a + b)],
  ADDD:     [],
  ADDF:     [],
  ADDI:     [],
  ADDU:     [],
  ADDUI:    [],
  AND:      [],
  ANDI:     [],
  BEQZ:     [],
  BFPF:     [],
  BFPT:     [],
  BNEZ:     [],
  CVTD2F:   [],
  CVTD2I:   [],
  CVTF2D:   [],
  CVTF2I:   [],
  CVTI2D:   [],
  CVTI2F:   [],
  DEBUG:    [],
  DIV:      [],
  DIVD:     [],
  DIVF:     [],
  DIVU:     [],
  EQD:      [],
  EQF:      [],
  FPARITH:  [],
  GED:      [],
  GEF:      [],
  GTD:      [],
  GTF:      [],
  J:        [],
  JAL:      [],
  JALR:     [],
  JR:       [],
  LA:       [],
  LB:       [],
  LBU:      [],
  LD:       [],
  LED:      [],
  LEF:      [],
  LF:       [],
  LH:       [],
  LHI:      [],
  LHU:      [],
  LTD:      [],
  LTF:      [],
  LW:       [],
  MOVD:     [],
  MOVF:     [],
  MOVFP2I:  [],
  MOVI2FP:  [],
  MOVI2S:   [],
  MOVS2I:   [],
  MULT:     [],
  MULTD:    [],
  MULTF:    [],
  MULTU:    [],
  NED:      [],
  NEF:      [],
  NOP:      [],
  OR:       [],
  ORI:      [],
  RFE:      [],
  SB:       [],
  SD:       [],
  SEQ:      [],
  SEQI:     [],
  SF:       [],
  SGE:      [],
  SGEI:     [],
  SGEU:     [],
  SGEUI:    [],
  SGT:      [],
  SGTI:     [],
  SGTU:     [],
  SGTUI:    [],
  SH:       [],
  SLE:      [],
  SLEI:     [],
  SLEU:     [],
  SLEUI:    [],
  SLL:      [],
  SLLI:     [],
  SLT:      [],
  SLTI:     [],
  SLTU:     [],
  SLTUI:    [],
  SNE:      [],
  SNEI:     [],
  SPECIAL:  [],
  SRA:      [],
  SRAI:     [],
  SRL:      [],
  SRLI:     [],
  SUB:      [],
  SUBD:     [],
  SUBF:     [],
  SUBI:     [],
  SUBU:     [],
  SUBUI:    [],
  SW:       [],
  TRAP:     [],
  XOR:      [],
  XORI:     [],
  HALT:     [new HaltOperation("HALT")]
}

/*@formatter:on*/
