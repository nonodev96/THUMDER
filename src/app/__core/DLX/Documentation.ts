export const DLX_DOCUMENTATION = [
  "add",
  "Ex: add r1,r2,r3",
  "R[regc] = R[rega] + R[regb]",
  "All are signed integers.",

  "addd",
  "Ex: addd f4,f4,f6",
  "D[dregc] = D[drega] + D[dregb]",
  "All are double precision floating point numbers.",

  "addf",
  "Ex: addf f3,f4,f5",
  "F[fregc] = F[frega] + F[fregb]",
  "All are single precision floating point numbers.",

  "addi",
  "Ex: addi r5,r2,#5",
  "R[regb] = R[rega] + imm16",
  "All are signed integers.",

  "addu",
  "Ex: addu r2,r3,r4",
  "R[regc] = R[rega] + R[regb]",
  "All are unsigned integers.",

  "addui",
  "Ex: addui r2,r3,#28",
  "R[regb] = R[rega] + uimm16",
  "All are unsigned integers.",

  "and",
  "Ex: and r2,r3,r4",
  "R[regc] = R[rega] & R[regb]",
  "All are unsigned integers. Logical `and' is performed on a bitwise basis.",

  "andi",
  "Ex: andi r3,r4,#5",
  "R[regb] = R[rega] & uimm16",
  "All are unsigned integers. Logical 'and' is performed on a bitwise basis.",

  "beqz",
  "Ex: beqz r1,label",
  "if (R[rega] == 0) PC = PC + imm16 + 4",
  "bfpf",
  "Ex: bfpf label",
  "if (fps == 0) PC = PC + imm16 + 4",
  "fps is the floating point status bit.",

  "bfpt",
  "Ex: bfpt label",
  "if (fps == 1) PC = PC + imm16 + 4",
  "fps is the floating point status bit.",

  "bnez",
  "Ex: bnez r1,label",
  "if (R[rega] != 0) PC = PC + imm16 + 4",
  "jump with condition in flag",

  "cvtd2f",
  "Ex: cvtd2f f1,f4",
  "F[fregc] = (float) D[drega]",
  "Converts double precision floating point value to single precision floating point value.",

  "cvtd2i",
  "Ex: cvtd2i f1,f0",
  "F[fregc] = (int) D[drega]",
  "Converts double precision floating point value to integer.",

  "cvtf2d",
  "Ex: cvtf2d f4,f9",
  "D[dregc] = (double) F[frega]",
  "Converts single precision float to double.",

  "cvtf2i",
  "Ex: cvtf2i f3,f4",
  "F[fregc] = (int) F[frega]",
  "Converts single precision float to integer.",

  "cvti2d",
  "Ex: cvti2d f2,f9",
  "D[dregc] = (double) F[frega]",
  "Converts a signed integer to double precision float.",

  "cvti2f",
  "Ex: cvti2f f2,f5",
  "F[fregc] = (float) F[frega]",
  "Converts a signed integer to single precision float.",

  "div",
  "Ex: div f2,f2,f3",
  "F[fregc] = F[frega] / F[fregb]",
  "All are signed integers.",

  "divd",
  "Ex: divd f4,f4,f6",
  "D[dregc] = D[drega] / D[dregb]",
  "All are double precision floats.",

  "divf",
  "Ex: divf f2,f3,f6",
  "F[fregc] = F[frega] / F[fregb]",
  "All are single precision floats.",

  "divu",
  "Ex: divu f2,f3,f4",
  "F[fregc] = F[frega] / F[fregb]",
  "All are unsigned integers.",

  "eqd",
  "Ex: eqd f2,f4",
  "if (D[drega] == D[dregb]) fps = 1 else fps = 0",
  "Both are double precision floats.",

  "eqf",
  "Ex: eqf f3,f5",
  "if (F[frega] == F[fregb]) fps = 1 else fps = 0",
  "Both are single precision floats.",

  "ged",
  "Ex: ged f8,f6",
  "if (D[drega] >= D[dregb]) fps = 1 else fps = 0",
  "Both are double precision floats.",

  "gef",
  "Ex: gef f3,f6",
  "if (F[frega] >= F[fregb]) fps = 1 else fps = 0",
  "Both are single precision floats.",

  "gtd",
  "Ex: gtd f8,f6",
  "if (D[drega] > D[dregb]) fps = 1 else fps = 0",
  "Both are double precision floats.",

  "gtf",
  "Ex: gtf f3,f6",
  "if (F[frega] > F[fregb]) fps = 1 else fps = 0",
  "Both are single precision floats.",

  "j",
  "Ex: j label",
  "PC = PC + imm26 + 4",
  "Unconditionally jumps relative to the PC of the next instruction. imm26 is a 26-bit signed integer.",

  "jal",
  "Ex: jal label",
  "R31 = PC + 8; PC = PC + imm26 + 4",
  "Saves a return address in register 31 and jumps relative to the PC of the next instruction. imm26 is a 26-bit signed integer.",

  "jalr",
  "Ex: jalr r2",
  "R31 = PC + 8; PC = R[rega]",
  "Saves a return address in register 31 and does an absolute jump to the target address contained in R[rega].",

  "jr",
  "Ex: jr r3",
  "PC = R[rega]",
  "R[rega] is treated as an unsigned integer. Does an absolute jump to the target address contained in R[rega].",

  "lb",
  "Ex: lb r1,40-4(r2)",
  "R[regb] = (sign extended) M[imm16 + R[rega]]",
  "One byte of data is read from the effective address computed by adding signed integer imm16 and signed integer R[rega]. The byte from memory is then sign extended to 32-bits and stored in register R[regb].",

  "lbu",
  "Ex: lbu r2,label-786+4(r3)",
  "R[regb] = 0^24 ## M[imm16 + R[rega]]",
  "One byte of data is read from the effective address computed by adding signed integer imm16 and signed integer R[rega]. The byte from memory is then zero extended to 32 bits and stored in register R[regb].",

  "ld",
  "Ex: ld f2,240(r1)",
  "D[dregb] <--64 M[imm16 + R[rega]]",
  "Two words of data are read from the effective address computed by adding signed integer imm16 and unsigned integer R[rega] and stored in double register D[dregb]. This is equivalent to two lf instructions:" + "\n" +
  "F[fregb] = M[imm16 + R[rega]]" + "\n" +
  "F[freg(b+1)] = M[imm16 + R[rega] + 4]" + "\n" +
  "where F[freg(b+1)] is the next fp register after F[fregb] in sequence, and all values are simply copied and not converted.)",

  "led",
  "Ex: led f8,f6",
  "if (D[drega] <= D[dregb]) fps = 1 else fps = 0",
  "Both are double precision floats.",

  "lef",
  "Ex: lef f3,f6",
  "if (F[frega] <= F[fregb]) fps = 1 else fps = 0",
  "Both are single precision floats.",

  "lf",
  "Ex: lf f6,76(r4)",
  "F[fregb] = M[imm16 + R[rega]]",
  "One word of data is read from the effective address computed by adding signed integer imm16 and signed integer R[rega] and stored in fp register F[fregb].",

  "lh",
  "Ex: lh r1,32(r3)",
  "R[regb] = (sign extended) M[imm16 + R[rega]]",
  "Two bytes of data are read from the effective address computed by adding signed integer imm16 and signed integer R[rega]. The address must be half-word aligned. The half-word from memory is then sign extended to 32 bits and stored in register R[regb].",

  "lhi",
  "Ex: lhi r3,#-40",
  "R[regb] = imm16 ## 0^16",
  "Loads the 16 bit immediate value imm16 into the most significant half of an integer register and clears the least significant half.",

  "lhu",
  "Ex: lhu r2,-40+4(r3)",
  "R[regb] = 0^16 ## M[imm16 + R[rega]]",
  "Two bytes of data are read from the effective address computed by adding signed integer imm16 and signed integer R[rega]. The address must be half-word aligned. The half-word from memory is then zero extended to 32 bits and stored in register R[regb].",

  "ltd",
  "Ex: ltd f8,f6",
  "if (D[drega] < D[dregb]) fps = 1 else fps = 0",
  "Both are double precision floats.",

  "ltf",
  "Ex: ltf f3,f6",
  "if (F[frega] < F[fregb]) fps = 1 else fps = 0",
  "Both are single precision floats.",

  "lw",
  "Ex: lw r19,label+63(r8)",
  "R[regb] = M[imm16 + R[rega]]",
  "One word is read from the effective address computed by adding signed integer imm16 and unsigned integer R[rega] and is stored in R[regb].",

  "movd",
  "Ex: movd f2,f4",
  "D[dregc] = D[drega]",
  "Copies two words from double register D[drega] to double register D[dregc].",

  "movf",
  "Ex: movf f1,f2",
  "F[fregc] = F[frega]",
  "Copies one word from fp register F[frega] to fp register F[fregc].",

  "movfp2i",
  "Ex: movfp2i r3,f0",
  "R[regc] = F[frega]",
  "Copies one word from fp register F[frega] to integer register R[regc].",

  "movi2fp",
  "Ex: movi2fp f0,r3",
  "F[fregc] = R[rega]",
  "Copies one word from integer register R[rega] to fp register F[fregc].",

  "movi2s",
  "Ex: movi2s r1",
  "Unspecified",
  "Copies one word from integer register R[rega] to a special register.",

  "movs2i",
  "Ex: movs2i r2",
  "Unspecified",
  "Copies one word from a special register to integer register R[rega].",

  "mult",
  "Ex: mult f2,f3,f4",
  "F[fregc] = F[frega] * F[fregb]",
  "All are signed integers.",

  "multd",
  "Ex: multd f2,f4,f6",
  "D[dregc] = D[drega] * D[dregb]",
  "All are double precision floats.",

  "multf",
  "Ex: multf f3,f4,f5",
  "F[fregc] = F[frega] * F[fregb]",
  "All are single precision floats.",

  "multu",
  "Ex: multu f2,f3,f4",
  "F[fregc] = F[frega] * F[fregb]",
  "All are unsigned integers.",

  "ned",
  "Ex: ned f8,f6",
  "if (D[drega] != D[dregb]) fps = 1 else fps = 0",
  "Both are double precision floats.",

  "nef",
  "Ex: nef f3,f6",
  "if (F[frega] != F[fregb]) fps = 1 else fps = 0",
  "Both are single precision floats.",

  "nop",
  "Ex: nop",
  "Idles one cycle.",

  "or",
  "Ex: or r2,r3,r4",
  "R[regc] = R[rega] | R[regb]",
  "All are unsigned integers. Logical 'or' is performed on a bitwise basis.",

  "ori",
  "Ex: ori r3,r4,#5",
  "R[regb] = R[rega] | uimm16",
  "All are unsigned integers. Logical `or' is performed on a bitwise basis.",

  "rfe",
  "Ex: rfe",
  "Unspecified",
  "Return from exception.",

  "sb",
  "Ex: sb label-41(r3),r2",
  "M[imm16 + R[rega]] <--8 R[regb]_24..31",
  "One byte of data from the least significant byte of register R[regb] is written to the effective address computed by adding signed integer imm16 and signed integer R[rega].",

  "sd",
  "Ex: sd 200(r4),f6",
  "M[imm16 + R[rega]] <--64 D[dregb]",
  "Two words from double register D[dregb] are written to the effective address computed by adding signed integer imm16 and signed integer R[rega].",

  "seq",
  "Ex: seq r1,r2,r3",
  "if (R[rega] == R[regb]) R[regc] = 1 else R[regc] = 0",
  "All are signed integers.",

  "seqi",
  "Ex: seqi r14,r3,#3",
  "if (R[rega] == imm16) R[regb] = 1 else R[regb] = 0",
  "All are signed integers.",

  "sf",
  "Ex: sf 121(r3),f1",
  "M[imm16 + R[rega]] = F[fregb]",
  "One word from fp register F[fregb] is written to the effective address computed by adding signed integer imm16 and signed integer R[rega].",

  "sge",
  "Ex: sge r1,r3,r4",
  "if (R[rega] >= R[regb]) R[regc] = 1 else R[regc] = 0",
  "All are signed integers.",

  "sgei",
  "Ex: sgei r2,r1,#6",
  "if (R[rega] >= imm16) R[regb] = 1 else R[regb] = 0",
  "All are signed integers.",

  "sgeu",
  "Ex: sgeu r1,r3,r4",
  "if (R[rega] >= R[regb]) R[regc] = 1 else R[regc] = 0",
  "All are unsigned integers.",

  "sgeui",
  "Ex: sgeui r2,r1,#6",
  "if (R[rega] >= uimm16) R[regb] = 1 else R[regb] = 0",
  "All are unsigned integers.",

  "sgt",
  "Ex: sgt r4,r5,r6",
  "if (R[rega] > R[regb]) R[regc] = 1 else R[regc] = 0",
  "All are signed integers.",

  "sgti",
  "Ex: sgti r1,r2,#-3000",
  "if (R[rega] > imm16) R[regb] = 1 else R[regb] = 0",
  "All are signed integers.",

  "sgtu",
  "Ex: sgtu r4,r5,r6",
  "if (R[rega] > R[regb]) R[regc] = 1 else R[regc] = 0",
  "All are unsigned integers.",

  "sgtui",
  "Ex: sgtui r1,r2,#3000",
  "if (R[rega] > uimm16) R[regb] = 1 else R[regb] = 0",
  "All are unsigned integers.",

  "sh",
  "Ex: sh 421(r3),r5",
  "M[imm16 + R[rega]] <--16 R[regb]_16..31",
  "Two bytes of data from the least significant half of register R[regb] are written to the effective address computed by adding signed integer imm16 and unsigned integer R[rega]. The effective address must be halfword aligned.",

  "sle",
  "Ex: sle r1,r2,r3",
  "if (R[rega] <= R[regb]) R[regc] = 1 else R[regc] = 0",
  "All are signed integers.",

  "slei",
  "Ex: slei r8,r5,#345",
  "if (R[rega] <= imm16) R[regb] = 1 else R[regb] = 0",
  "All are signed integers.",

  "sleu",
  "Ex: sleu r1,r2,r3",
  "if (R[rega] <= R[regb]) R[regc] = 1 else R[regc] = 0",
  "All are unsigned integers.",

  "sleui",
  "Ex: sleui r8,r5,#345",
  "if (R[rega] <= uimm16) R[regb] = 1 else R[regb] = 0",
  "All are unsigned integers.",

  "sll",
  "Ex: sll r6,r7,r11",
  "R[regc] = R[rega] << R[regb]_27..31",
  "All are unsigned integers. R[rega] is logically shifted left by the low five bits of R[regb]. Zeros are shifted into the least-significant bit.",

  "slli",
  "Ex: slli r1,r2,#3",
  "R[regb] = R[rega] << uimm16_27..31",
  "All are unsigned integers. R[rega] is logically shifted left by the low five bits of uimm16. Zeros are shifted into the least-significant bit. (Actually only the bottom five bits of R[regb] are used.)",

  "slt",
  "Ex: slt r3,r4,r5",
  "if (R[rega] < R[regb]) R[regc] = 1 else R[regc] = 0",
  "All are signed integers.",

  "slti",
  "Ex: slti r1,r2,#22",
  "if (R[rega] < imm16) R[regb] = 1 else R[regb] = 0",
  "All are signed integers.",

  "sltu",
  "Ex: sltu r3,r4,r5",
  "if (R[rega] < R[regb]) R[regc] = 1 else R[regc] = 0",
  "All are unsigned integers.",

  "sltui",
  "Ex: sltui r1,r2,#22",
  "if (R[rega] < uimm16) R[regb] = 1 else R[regb] = 0",
  "All are unsigned integers.",

  "sne",
  "Ex: sne r1,r2,r3",
  "if (R[rega] != R[regb]) R[regc] = 1 else R[regc] = 0",
  "All are signed integers.",

  "snei",
  "Ex: snei r4,r5,#89",
  "if (R[rega] != imm16) R[regb] = 1 else R[regb] = 0",
  "All are signed integers.",

  "sra",
  "Ex: sra r1,r2,r3",
  "R[regc] = (R[rega]_0)^R[regb] ## (R[rega]>>R[regb])_R[regb]..31",
  "R[rega] and R[regc] are signed integers. R[regb] is an unsigned integer. R[rega] is arithmetically shifted right by R[regb]. The sign bit is shifted into the most-significant bit. (Actually uses only the five low order bits of R[regb].)",

  "srai",
  "Ex: srai r2,r3,#5",
  "R[regb] = (R[rega]_31)^uimm16 ## (R[rega]>>uimm16)_uimm16..31",
  "R[rega] and R[regc] are signed integers. uimm16 is an unsigned integer. R[rega] is arithmetically shifted right by R[regb]. The sign bit is shifted into the most-significant bit. (Actually uses only the five low order bits of uimm16.)",

  "srl",
  "Ex: srl r15,r2,r3",
  "R[regc] = R[rega] >> R[regb]_27..31",
  "All are unsigned integers. R[rega] is arithmetically shifted right by R[regb]. Zeros are shifted into the most significant bit.",

  "srli",
  "Ex: srli r1,r2,#5",
  "R[regb] = R[rega] >> uimm16_27..31",
  "All are unsigned integers. R[rega] is arithmetically shifted right by uimm16. Zeros are shifted into the most significant bit.",

  "sub",
  "Ex: sub r3,r2,r1",
  "Ex: R[regc] = R[rega] - R[regb]",
  "All are signed integers.",

  "subd",
  "Ex: subd f2,f4,f6",
  "D[dregc] = D[drega] - D[dregb]",
  "All are double precision floats.",

  "subf",
  "Ex: subf f3,f4,f6",
  "F[fregc] = F[frega] - F[fregb]",
  "All are single precision floats.",

  "subi",
  "Ex: subi r15,r16,#964",
  "R[regb] = R[rega] - imm16",
  "All are signed integers.",

  "subu",
  "Ex: subu r3,r2,r1",
  "R[regc] = R[rega] - R[regb]",
  "All are unsigned integers.",

  "subui",
  "Ex: subui r1,r2,#53",
  "R[regb] = R[rega] - uimm16",
  "All are unsigned integers.",

  "sw",
  "Ex: sw 21(r13),r6",
  "M[imm16 + R[rega]] = R[regb]",
  "One word from integer register R[regb] is written to the effective address computed by adding signed integer imm16 and unsigned integer R[rega].",

  "trap",
  "Ex: trap #3",
  "Execute trap with number in immediate field",
  "Saves state and jumps to an operating system procedure located at an address in the interrupt vector table. In our systems, this is simulated by calling the procedure corresponding to the trap number.",

  "HALT",
  "Ex: HALT",
  "Stop the program counter",
  "Saves state and jumps to an operating system procedure located at an address in the interrupt vector table. In our systems, this is simulated by calling the procedure corresponding to the trap number.",

  "xor",
  "Ex: xor r2,r3,r4",
  "R[regc] = F[rega] XOR R[regb]",
  "All are unsigned integers. Logical 'xor' is performed on a bitwise basis.",

  "xori",
  "Ex: xori r3,r4,#5",
  "R[regb] = R[rega] XOR uimm16",
  "All are unsigned integers. Logical 'xor' is performed on a bitwise basis.",
]
