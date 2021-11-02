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

// In Table 1, J, JAL, REF, TRAP are J-type, the rest are I-type instructions. (bit0-2)\(bit3-5)
export const OPCODES_TYPE_I_J = [
  // { bits: '000000', name: '(RR ALU)'   },
  { bits: '001000', name: 'ADDI'          },
  { bits: '010000', name: 'RFE'           },
  { bits: '011000', name: 'SEQI'          },
  { bits: '100000', name: 'LB'            },
  { bits: '101000', name: 'SB'            },

  // { bits: '000001', name: '(FLOAT)'    },
  { bits: '001001', name: 'ADDUI'         },
  { bits: '010001', name: 'TRAP'          },
  { bits: '011001', name: 'SNEI'          },
  { bits: '100001', name: 'LH'            },
  { bits: '101001', name: 'SH'            },

  { bits: '000010', name: 'J'             },
  { bits: '001010', name: 'SUBI'          },
  { bits: '010010', name: 'JR'            },
  { bits: '011010', name: 'SLTI'          },

  { bits: '000011', name: 'JAL'           },
  { bits: '001011', name: 'SUBUI'         },
  { bits: '010011', name: 'JALR'          },
  { bits: '011011', name: 'SGTI'          },
  { bits: '100011', name: 'LW'            },
  { bits: '101011', name: 'SW'            },

  { bits: '000100', name: 'BEQZ'          },
  { bits: '001100', name: 'ANDI'          },
  { bits: '010100', name: 'SLLI'          },
  { bits: '011100', name: 'SLEI'          },
  { bits: '100100', name: 'LBU'           },

  { bits: '000101', name: 'BNEZ'          },
  { bits: '001101', name: 'ORI'           },
  { bits: '011101', name: 'SGEI'          },
  { bits: '100101', name: 'LHU'           },

  { bits: '000110', name: 'BFPT'          },
  { bits: '001110', name: 'XORI'          },
  { bits: '010110', name: 'SRLI'          },
  { bits: '100110', name: 'LF'            },
  { bits: '101110', name: 'SF'            },

  { bits: '000111', name: 'BFPF'          },
  { bits: '001111', name: 'LHI'           },
  { bits: '010111', name: 'SRAI'          },
  { bits: '100111', name: 'LD'            },
  { bits: '101111', name: 'SD'            },
];
// DLX R-R ALU instructions (opcode = 0): only the least-significant 6 bits in the function field are used.
export const OPCODES_TYPE_R_OPCODE_0 = [
  { bits: "000100", name: "SLL"           },
  { bits: "000110", name: "SRL"           },
  { bits: "000111", name: "SRA"           },

  { bits: "100000", name: "ADD"           },
  { bits: "100001", name: "ADDU"          },
  { bits: "100010", name: "SUB"           },
  { bits: "100011", name: "SUBU"          },
  { bits: "100100", name: "AND"           },
  { bits: "100101", name: "OR"            },
  { bits: "100110", name: "XOR"           },

  { bits: "101000", name: "SEQ"           },
  { bits: "101001", name: "SNE"           },
  { bits: "101010", name: "SLT"           },
  { bits: "101011", name: "SGT"           },
  { bits: "101100", name: "SLE"           },
  { bits: "101101", name: "SGE"           },

  { bits: "110000", name: "MOVI2S"        },
  { bits: "110001", name: "MOVS2I"        },
  { bits: "110010", name: "MOVF"          },
  { bits: "110011", name: "MOVD"          },
  { bits: "110100", name: "MOVFP2I"       },
  { bits: "110101", name: "MOVI2FP"       },

  { bits: "011000", name: "MULT"          },
  { bits: "011001", name: "MULTU"         },
  { bits: "011010", name: "DIV"           },
  { bits: "011011", name: "DIVU"          },
]
//DLX floating-poing instructions (opcode = 1): only the least-significant 6 bits in the function field are used.
export const OPCODES_TYPE_R_OPCODE_1 = [
  { bits: "000000", name: "ADDF"          },
  { bits: "000001", name: "SUBF"          },
  { bits: "000010", name: "MULTF"         },
  { bits: "000011", name: "DIVF"          },
  { bits: "000100", name: "ADDD"          },
  { bits: "000101", name: "SUBD"          },
  { bits: "000110", name: "MULTD"         },
  { bits: "000111", name: "DIVD"          },

  { bits: "001000", name: "CVTF2D"        },
  { bits: "001001", name: "CVTF2I"        },
  { bits: "001010", name: "CVTD2F"        },
  { bits: "001011", name: "CVTD2I"        },
  { bits: "001100", name: "CVTI2F"        },
  { bits: "001101", name: "CVTI2D"        },

  { bits: "010000", name: "EQF"           },
  { bits: "010001", name: "NEF"           },
  { bits: "010010", name: "LTF"           },
  { bits: "010011", name: "GTF"           },
  { bits: "010100", name: "LEF"           },
  { bits: "010101", name: "GEF"           },

  { bits: "011000", name: "EQD"           },
  { bits: "011001", name: "NED"           },
  { bits: "011010", name: "LTD"           },
  { bits: "011011", name: "GTD"           },
  { bits: "011100", name: "LED"           },
  { bits: "011101", name: "GED"           },
];
/*@formatter:on*/



































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
