# The DLX Instruction Set, BYU Edition

Note that 8 instructions have been added to this version of the instruction set that do not appear in Hennessy and Patterson's text; nor are they listed in "The DLX Instruction Set Architecture Handbook" by Sailer and Kaeli, which otherwise was used as a guideline to the instruction set specification. The new instructions are sgeu, sgtu, sleu, sltu -- all compares using unsigned values -- along with an immediate form of each. The new instructions were added to simplify the DLX backend for lcc.

Here are some links to sections of this document, which is rather long:

- [Notation](#notation)
- [Notes/Assumptions](#notes-assumptions)
- [Instructions](#instructions)
- [Instruction Encoding](#instruction-encoding)

## Notation

```
Symbol         Meaning
x_y         bit y of x
x_y..z      bits y to z of x (right justified)
x^y         xx....x (x repeated y times)
x##y        xy (x concatenated with y)
IR          instruction register
IAR         interrupt address register
PC          program counter
R[rega]     integer register[IR_6..10]
R[regb]     integer register[IR_11..15]
R[regc]     integer register[IR_16..20]
F[frega]    fp register[IR_6..10]
F[fregb]    fp register[IR_11..15]
F[fregc]    fp register[IR_16..20]
D[drega]    double register[IR_6..10]
D[dregb]    double register[IR_11..15]
D[dregc]    double register[IR_16..20]
imm16       value of (IR_16)^16 ## IR_16..31
uimm16      value of 0^16 ## IR_16..31
imm26       value of (IR_6)^6 ## IR_6..0
fps         floating point status bit
<--         a 32-bit transfer
<--n        an n-bit transfer
```

## Notes Assumptions

* Bits are numbered from 0 (the most significant bit) to 31 (the least significant bit).
* All transfers are 32 bits unless otherwise specified, with the exception of double precision fp operations which are 64 bit transfers unless otherwise noted.
* All integer operations are on 32-bit integers.
* All assignments to integer register[x] are conditional on x not being zero. Register 0 has a hardwired {\em zero} value and cannot be modified.
* Double register[x] is a 64 bit quantity that represents the same storage as fp register[x] and fp register[x+1]. Only even values of x are allowed (double register addresses are aligned).
* Single precision floating point is 32 bits and double precision floating point is 64 bits. The exact floating point format used is that of the machine on which the simulator is running.
* The specifications for branches and jumps assume that the PC has not yet been incremented (for the next instruction) when the specified actions are performed. Note that this does not represent the actual behavior in any reasonable pipelined implementation; it is assumed merely to simplify the description.
* Memory will be stored in big endian format and all effective addresses must be aligned with the data type.

## Instructions

```
add
Ex: add r1,r2,r3
R[regc] = R[rega] + R[regb]
All are signed integers.

addd
Ex: addd f4,f4,f6
D[dregc] = D[drega] + D[dregb]
All are double precision floating point numbers.

addf
Ex: addf f3,f4,f5
F[fregc] = F[frega] + F[fregb]
All are single precision floating point numbers.

addi
Ex: addi r5,r2,#5
R[regb] = R[rega] + imm16
All are signed integers.

addu
Ex: addu r2,r3,r4
R[regc] = R[rega] + R[regb]
All are unsigned integers.

addui
Ex: addui r2,r3,#28
R[regb] = R[rega] + uimm16
All are unsigned integers.

and
Ex: and r2,r3,r4
R[regc] = R[rega] & R[regb]
All are unsigned integers. Logical `and' is performed on a bitwise basis.

andi
Ex: andi r3,r4,#5
R[regb] = R[rega] & uimm16
All are unsigned integers. Logical `and' is performed on a bitwise basis.

beqz
Ex: beqz r1,label
if (R[rega] == 0) PC = PC + imm16 + 4
bfpf
Ex: bfpf label
if (fps == 0) PC = PC + imm16 + 4
fps is the floating point status bit.

bfpt
Ex: bfpt label
if (fps == 1) PC = PC + imm16 + 4
fps is the floating point status bit.

bnez
Ex: bnez r1,label
if (R[rega] != 0) PC = PC + imm16 + 4


cvtd2f
Ex: cvtd2f f1,f4
F[fregc] = (float) D[drega]
Converts double precision floating point value to single precision floating point value.

cvtd2i
Ex: cvtd2i f1,f0
F[fregc] = (int) D[drega]
Converts double precision floating point value to integer.

cvtf2d
Ex: cvtf2d f4,f9
D[dregc] = (double) F[frega]
Converts single precision float to double.

cvtf2i
Ex: cvtf2i f3,f4
F[fregc] = (int) F[frega]
Converts single precision float to integer.

cvti2d
Ex: cvti2d f2,f9
D[dregc] = (double) F[frega]
Converts a signed integer to double precision float.

cvti2f
Ex: cvti2f f2,f5
F[fregc] = (float) F[frega]
Converts a signed integer to single precision float.

div
Ex: div f2,f2,f3
F[fregc] = F[frega] / F[fregb]
All are signed integers.

divd
Ex: divd f4,f4,f6
D[dregc] = D[drega] / D[dregb]
All are double precision floats.

divf
Ex: divf f2,f3,f6
F[fregc] = F[frega] / F[fregb]
All are single precision floats.

divu
Ex: divu f2,f3,f4
F[fregc] = F[frega] / F[fregb]
All are unsigned integers.

eqd
Ex: eqd f2,f4
if (D[drega] == D[dregb]) fps = 1 else fps = 0
Both are double precision floats.

eqf
Ex: eqf f3,f5
if (F[frega] == F[fregb]) fps = 1 else fps = 0
Both are single precision floats.

ged
Ex: ged f8,f6
if (D[drega] >= D[dregb]) fps = 1 else fps = 0
Both are double precision floats.

gef
Ex: gef f3,f6
if (F[frega] >= F[fregb]) fps = 1 else fps = 0
Both are single precision floats.

gtd
Ex: gtd f8,f6
if (D[drega] > D[dregb]) fps = 1 else fps = 0
Both are double precision floats.

gtf
Ex: gtf f3,f6
if (F[frega] > F[fregb]) fps = 1 else fps = 0
Both are single precision floats.

j
Ex: j label
PC = PC + imm26 + 4
Unconditionally jumps relative to the PC of the next instruction. imm26 is a 26-bit signed integer.

jal
Ex: jal label
R31 = PC + 8; PC = PC + imm26 + 4
Saves a return address in register 31 and jumps relative to the PC of the next instruction. imm26 is a 26-bit signed integer.

jalr
Ex: jalr r2
R31 = PC + 8; PC = R[rega]
Saves a return address in register 31 and does an absolute jump to the target address contained in R[rega].

jr
Ex: jr r3
PC = R[rega]
R[rega] is treated as an unsigned integer. Does an absolute jump to the target address contained in R[rega].

lb
Ex: lb r1,40-4(r2)
R[regb] = (sign extended) M[imm16 + R[rega]]
One byte of data is read from the effective address computed by adding signed integer imm16 and signed integer R[rega]. The byte from memory is then sign extended to 32-bits and stored in register R[regb].

lbu
Ex: lbu r2,label-786+4(r3)
R[regb] = 0^24 ## M[imm16 + R[rega]]
One byte of data is read from the effective address computed by adding signed integer imm16 and signed integer R[rega]. The byte from memory is then zero extended to 32 bits and stored in register R[regb].

ld
Ex: ld f2,240(r1)
D[dregb] <--64 M[imm16 + R[rega]]
Two words of data are read from the effective address computed by adding signed integer imm16 and unsigned integer R[rega] and stored in double register D[dregb]. This is equivalent to two lf instructions:
    
    F[fregb] = M[imm16 + R[rega]]
    F[freg(b+1)] = M[imm16 + R[rega] + 4]
    where F[freg(b+1)] is the next fp register after F[fregb] in sequence, and all values are simply copied and not converted.)
    led
    Ex: led f8,f6
    if (D[drega] <= D[dregb]) fps = 1 else fps = 0
    Both are double precision floats.
    
    lef
    Ex: lef f3,f6
    if (F[frega] <= F[fregb]) fps = 1 else fps = 0
    Both are single precision floats.
    
    lf
    Ex: lf f6,76(r4)
    F[fregb] = M[imm16 + R[rega]]
    One word of data is read from the effective address computed by adding signed integer imm16 and signed integer R[rega] and stored in fp register F[fregb].
    
    lh
    Ex: lh r1,32(r3)
    R[regb] = (sign extended) M[imm16 + R[rega]]
    Two bytes of data are read from the effective address computed by adding signed integer imm16 and signed integer R[rega]. The address must be half-word aligned. The half-word from memory is then sign extended to 32 bits and stored in register R[regb].
    
    lhi
    Ex: lhi r3,#-40
    R[regb] = imm16 ## 0^16
    Loads the 16 bit immediate value imm16 into the most significant half of an integer register and clears the least significant half.
    
    lhu
    Ex: lhu r2,-40+4(r3)
    R[regb] = 0^16 ## M[imm16 + R[rega]]
    Two bytes of data are read from the effective address computed by adding signed integer imm16 and signed integer R[rega]. The address must be half-word aligned. The half-word from memory is then zero extended to 32 bits and stored in register R[regb].
    
    ltd
    Ex: ltd f8,f6
    if (D[drega] < D[dregb]) fps = 1 else fps = 0
    Both are double precision floats.
    
    ltf
    Ex: ltf f3,f6
    if (F[frega] < F[fregb]) fps = 1 else fps = 0
    Both are single precision floats.
    
    lw
    Ex: lw r19,label+63(r8)
    R[regb] = M[imm16 + R[rega]]
    One word is read from the effective address computed by adding signed integer imm16 and unsigned integer R[rega] and is stored in R[regb].
    
    movd
    Ex: movd f2,f4
    D[dregc] = D[drega]
    Copies two words from double register D[drega] to double register D[dregc].
    
    movf
    Ex: movf f1,f2
    F[fregc] = F[frega]
    Copies one word from fp register F[frega] to fp register F[fregc].
    
    movfp2i
    Ex: movfp2i r3,f0
    R[regc] = F[frega]
    Copies one word from fp register F[frega] to integer register R[regc].
    
    movi2fp
    Ex: movi2fp f0,r3
    F[fregc] = R[rega]
    Copies one word from integer register R[rega] to fp register F[fregc].
    
    movi2s
    Ex: movi2s r1
    Unspecified
    Copies one word from integer register R[rega] to a special register.
    
    movs2i
    Ex: movs2i r2
    Unspecified
    Copies one word from a special register to integer register R[rega].
    
    mult
    Ex: mult f2,f3,f4
    F[fregc] = F[frega] * F[fregb]
    All are signed integers.
    
    multd
    Ex: multd f2,f4,f6
    D[dregc] = D[drega] * D[dregb]
    All are double precision floats.
    
    multf
    Ex: multf f3,f4,f5
    F[fregc] = F[frega] * F[fregb]
    All are single precision floats.
    
    multu
    Ex: multu f2,f3,f4
    F[fregc] = F[frega] * F[fregb]
    All are unsigned integers.
    
    ned
    Ex: ned f8,f6
    if (D[drega] != D[dregb]) fps = 1 else fps = 0
    Both are double precision floats.
    
    nef
    Ex: nef f3,f6
    if (F[frega] != F[fregb]) fps = 1 else fps = 0
    Both are single precision floats.
    
    nop
    Ex: nop
    Idles one cycle.
    
    or
    Ex: or r2,r3,r4
    R[regc] = R[rega] | R[regb]
    All are unsigned integers. Logical `or' is performed on a bitwise basis.
    
    ori
    Ex: ori r3,r4,#5
    R[regb] = R[rega] | uimm16
    All are unsigned integers. Logical `or' is performed on a bitwise basis.
    
    rfe
    Ex: rfe
    Unspecified
    Return from exception.
    
    sb
    Ex: sb label-41(r3),r2
    M[imm16 + R[rega]] <--8 R[regb]_24..31
    One byte of data from the least significant byte of register R[regb] is written to the effective address computed by adding signed integer imm16 and signed integer R[rega].
    
    sd
    Ex: sd 200(r4),f6
    M[imm16 + R[rega]] <--64 D[dregb]
    Two words from double register D[dregb] are written to the effective address computed by adding signed integer imm16 and signed integer R[rega].
    
    seq
    Ex: seq r1,r2,r3
    if (R[rega] == R[regb]) R[regc] = 1 else R[regc] = 0
    All are signed integers.
    
    seqi
    Ex: seqi r14,r3,#3
    if (R[rega] == imm16) R[regb] = 1 else R[regb] = 0
    All are signed integers.
    
    sf
    Ex: sf 121(r3),f1
    M[imm16 + R[rega]] = F[fregb]
    One word from fp register F[fregb] is written to the effective address computed by adding signed integer imm16 and signed integer R[rega].
    
    sge
    Ex: sge r1,r3,r4
    if (R[rega] >= R[regb]) R[regc] = 1 else R[regc] = 0
    All are signed integers.
    
    sgei
    Ex: sgei r2,r1,#6
    if (R[rega] >= imm16) R[regb] = 1 else R[regb] = 0
    All are signed integers.
    
    sgeu
    Ex: sgeu r1,r3,r4
    if (R[rega] >= R[regb]) R[regc] = 1 else R[regc] = 0
    All are unsigned integers.
    
    sgeui
    Ex: sgeui r2,r1,#6
    if (R[rega] >= uimm16) R[regb] = 1 else R[regb] = 0
    All are unsigned integers.
    
    sgt
    Ex: sgt r4,r5,r6
    if (R[rega] > R[regb]) R[regc] = 1 else R[regc] = 0
    All are signed integers.
    
    sgti
    Ex: sgti r1,r2,#-3000
    if (R[rega] > imm16) R[regb] = 1 else R[regb] = 0
    All are signed integers.
    
    sgtu
    Ex: sgtu r4,r5,r6
    if (R[rega] > R[regb]) R[regc] = 1 else R[regc] = 0
    All are unsigned integers.
    
    sgtui
    Ex: sgtui r1,r2,#3000
    if (R[rega] > uimm16) R[regb] = 1 else R[regb] = 0
    All are unsigned integers.
    
    sh
    Ex: sh 421(r3),r5
    M[imm16 + R[rega]] <--16 R[regb]_16..31
    Two bytes of data from the least significant half of register R[regb] are written to the effective address computed by adding signed integer imm16 and unsigned integer R[rega]. The effective address must be halfword aligned.
    
    sle
    Ex: sle r1,r2,r3
    if (R[rega] <= R[regb]) R[regc] = 1 else R[regc] = 0
    All are signed integers.
    
    slei
    Ex: slei r8,r5,#345
    if (R[rega] <= imm16) R[regb] = 1 else R[regb] = 0
    All are signed integers.
    
    sleu
    Ex: sleu r1,r2,r3
    if (R[rega] <= R[regb]) R[regc] = 1 else R[regc] = 0
    All are unsigned integers.
    
    sleui
    Ex: sleui r8,r5,#345
    if (R[rega] <= uimm16) R[regb] = 1 else R[regb] = 0
    All are unsigned integers.
    
    sll
    Ex: sll r6,r7,r11
    R[regc] = R[rega] << R[regb]_27..31
    All are unsigned integers. R[rega] is logically shifted left by the low five bits of R[regb]. Zeros are shifted into the least-significant bit.
    
    slli
    Ex: slli r1,r2,#3
    R[regb] = R[rega] << uimm16_27..31
    All are unsigned integers. R[rega] is logically shifted left by the low five bits of uimm16. Zeros are shifted into the least-significant bit. (Actually only the bottom five bits of R[regb] are used.)
    
    slt
    Ex: slt r3,r4,r5
    if (R[rega] < R[regb]) R[regc] = 1 else R[regc] = 0
    All are signed integers.
    
    slti
    Ex: slti r1,r2,#22
    if (R[rega] < imm16) R[regb] = 1 else R[regb] = 0
    All are signed integers.
    
    sltu
    Ex: sltu r3,r4,r5
    if (R[rega] < R[regb]) R[regc] = 1 else R[regc] = 0
    All are unsigned integers.
    
    sltui
    Ex: sltui r1,r2,#22
    if (R[rega] < uimm16) R[regb] = 1 else R[regb] = 0
    All are unsigned integers.
    
    sne
    Ex: sne r1,r2,r3
    if (R[rega] != R[regb]) R[regc] = 1 else R[regc] = 0
    All are signed integers.
    
    snei
    Ex: snei r4,r5,#89
    if (R[rega] != imm16) R[regb] = 1 else R[regb] = 0
    All are signed integers.
    
    sra
    Ex: sra r1,r2,r3
    R[regc] = (R[rega]_0)^R[regb] ## (R[rega]>>R[regb])_R[regb]..31
    R[rega] and R[regc] are signed integers. R[regb] is an unsigned integer. R[rega] is arithmetically shifted right by R[regb]. The sign bit is shifted into the most-significant bit. (Actually uses only the five low order bits of R[regb].)
    
    srai
    Ex: srai r2,r3,#5
    R[regb] = (R[rega]_31)^uimm16 ## (R[rega]>>uimm16)_uimm16..31
    R[rega] and R[regc] are signed integers. uimm16 is an unsigned integer. R[rega] is arithmetically shifted right by R[regb]. The sign bit is shifted into the most-significant bit. (Actually uses only the five low order bits of uimm16.)
    
    srl
    Ex: srl r15,r2,r3
    R[regc] = R[rega] >> R[regb]_27..31
    All are unsigned integers. R[rega] is arithmetically shifted right by R[regb]. Zeros are shifted into the most significant bit.
    
    srli
    Ex: srli r1,r2,#5
    R[regb] = R[rega] >> uimm16_27..31
    All are unsigned integers. R[rega] is arithmetically shifted right by uimm16. Zeros are shifted into the most significant bit.
    
    sub
    Ex: sub r3,r2,r1
    Ex: R[regc] = R[rega] - R[regb]
    All are signed integers.
    
    subd
    Ex: subd f2,f4,f6
    D[dregc] = D[drega] - D[dregb]
    All are double precision floats.
    
    subf
    Ex: subf f3,f4,f6
    F[fregc] = F[frega] - F[fregb]
    All are single precision floats.
    
    subi
    Ex: subi r15,r16,#964
    R[regb] = R[rega] - imm16
    All are signed integers.
    
    subu
    Ex: subu r3,r2,r1
    R[regc] = R[rega] - R[regb]
    All are unsigned integers.
    
    subui
    Ex: subui r1,r2,#53
    R[regb] = R[rega] - uimm16
    All are unsigned integers.
    
    sw
    Ex: sw 21(r13),r6
    M[imm16 + R[rega]] = R[regb]
    One word from integer register R[regb] is written to the effective address computed by adding signed integer imm16 and unsigned integer R[rega].
    
    trap
    Ex: trap #3
    Execute trap with number in immediate field
    Saves state and jumps to an operating system procedure located at an address in the interrupt vector table. In our systems, this is simulated by calling the procedure corresponding to the trap number.
    
    xor
    Ex: xor r2,r3,r4
    R[regc] = F[rega] XOR R[regb]
    All are unsigned integers. Logical 'xor' is performed on a bitwise basis.
    
    xori
    Ex: xori r3,r4,#5
    R[regb] = R[rega] XOR uimm16
    All are unsigned integers. Logical 'xor' is performed on a bitwise basis.
```

## Instruction Encoding

The general instruction layout for DLX is shown on page 99 of H&P (2nd Ed.). This specifies the encodings (the 6-bit opcode and the 11-bit function code) assumed in the BYU ECEn Department's tool set. (This is not intended to be compatible with DLX tools from any other source. Encodings were chosen to keep things simple.) The following is a portion of an include file used by the assembler and simulator. Note that it defines a struct for each instruction, specifying (1) the mnemonic used by the assembler and disassemblers, (2) the 6 bit opcode value, (3) the value used in the func bits.

```cpp
int main() {
  int y = SOME_MACRO_REFERENCE;
  int x = 5 + 6;
  cout << "Hello World! " << x << std::endl();
}
```

```
/* --------------------- dlxdef.h ------------------------- */

struct mapper
{
char *name;
int op;
int func;
int optype;
};

struct mapper mainops[] =
{
{"special", 0x00, 0x00, UNIMP},
{"fparith", 0x01, 0x00, UNIMP},
{"addi",    0x02, 0x00, REG2IMM},
{"addui",   0x03, 0x00, REG2IMM},
{"andi",    0x04, 0x00, REG2IMM},
{"beqz",    0x05, 0x00, REGLAB},
{"bfpf",    0x06, 0x00, LEXP16},
{"bfpt",    0x07, 0x00, LEXP16},
{"bnez",    0x08, 0x00, REGLAB},
{"j",       0x09, 0x00, LEXP26},
{"jal",     0x0a, 0x00, LEXP26},
{"jalr",    0x0b, 0x00, IREG1},
{"jr",      0x0c, 0x00, IREG1},
{"lb",      0x0d, 0x00, LOADI},
{"lbu",     0x0e, 0x00, LOADI},
{"ld",      0x0f, 0x00, LOADD},
{"lf",      0x10, 0x00, LOADF},
{"lh",      0x11, 0x00, LOADI},
{"lhi",     0x12, 0x00, REG1IMM},
{"lhu",     0x13, 0x00, LOADI},
{"lw",      0x14, 0x00, LOADI},
{"ori",     0x15, 0x00, REG2IMM},
{"rfe",     0x16, 0x00, UNIMP},
{"sb",      0x17, 0x00, STRI},
{"sd",      0x18, 0x00, STRD},
{"seqi",    0x19, 0x00, REG2IMM},
{"sf",      0x1a, 0x00, STRF},
{"sgei",    0x1b, 0x00, REG2IMM},
{"sgeui",   0x1c, 0x00, REG2IMM}, /* added instruction */
{"sgti",    0x1d, 0x00, REG2IMM},
{"sgtui",   0x1e, 0x00, REG2IMM}, /* added instruction */
{"sh",      0x1f, 0x00, STRI},
{"slei",    0x20, 0x00, REG2IMM},
{"sleui",   0x21, 0x00, REG2IMM}, /* added instruction */
{"slli",    0x22, 0x00, REG2IMM},
{"slti",    0x23, 0x00, REG2IMM},
{"sltui",   0x24, 0x00, REG2IMM}, /* added instruction */
{"snei",    0x25, 0x00, REG2IMM},
{"srai",    0x26, 0x00, REG2IMM},
{"srli",    0x27, 0x00, REG2IMM},
{"subi",    0x28, 0x00, REG2IMM},
{"subui",   0x29, 0x00, REG2IMM},
{"sw",      0x2a, 0x00, STRI},
{"trap",    0x2b, 0x00, IMM1},
{"xori",    0x2c, 0x00, REG2IMM},
{"la",      0x30, 0x00, PSEUDO}
};

struct mapper spec[] =
{
{"nop",     0x00, 0x00, NONEOP},
{"add",     0x00, 0x01, REG3IMM},
{"addu",    0x00, 0x02, REG3IMM},
{"and",     0x00, 0x03, REG3IMM},
{"movd",    0x00, 0x04, DREG2a},
{"movf",    0x00, 0x05, FREG2a},
{"movfp2i", 0x00, 0x06, IF2},
{"movi2fp", 0x00, 0x07, FI2},
{"movi2s",  0x00, 0x08, UNIMP},
{"movs2i",  0x00, 0x09, UNIMP},
{"or",      0x00, 0x0a, REG3IMM},
{"seq",     0x00, 0x0b, REG3IMM},
{"sge",     0x00, 0x0c, REG3IMM},
{"sgeu",    0x00, 0x0d, REG3IMM}, /* added instruction */
{"sgt",     0x00, 0x0e, REG3IMM},
{"sgtu",    0x00, 0x0f, REG3IMM}, /* added instruction */
{"sle",     0x00, 0x10, REG3IMM},
{"sleu",    0x00, 0x11, REG3IMM}, /* added instruction */
{"sll",     0x00, 0x12, REG3IMM},
{"slt",     0x00, 0x13, REG3IMM},
{"sltu",    0x00, 0x14, REG3IMM}, /* added instruction */
{"sne",     0x00, 0x15, REG3IMM},
{"sra",     0x00, 0x16, REG3IMM},
{"srl",     0x00, 0x17, REG3IMM},
{"sub",     0x00, 0x18, REG3IMM},
{"subu",    0x00, 0x19, REG3IMM},
{"xor",     0x00, 0x1a, REG3IMM}
};

struct mapper fpops[] =
{
{"addd",   0x01, 0x00, DREG3},
{"addf",   0x01, 0x01, FREG3},
{"cvtd2f", 0x01, 0x02, FD2},
{"cvtd2i", 0x01, 0x03, FD2},
{"cvtf2d", 0x01, 0x04, DF2},
{"cvtf2i", 0x01, 0x05, FREG2a},
{"cvti2d", 0x01, 0x06, DF2},
{"cvti2f", 0x01, 0x07, FREG2a},
{"div",    0x01, 0x08, FREG3},
{"divd",   0x01, 0x09, DREG3},
{"divf",   0x01, 0x0a, FREG3},
{"divu",   0x01, 0x0b, FREG3},
{"eqd",    0x01, 0x0c, DREG2b},
{"eqf",    0x01, 0x0d, FREG2b},
{"ged",    0x01, 0x0e, DREG2b},
{"gef",    0x01, 0x0f, FREG2b},
{"gtd",    0x01, 0x10, DREG2b},
{"gtf",    0x01, 0x11, FREG2b},
{"led",    0x01, 0x12, DREG2b},
{"lef",    0x01, 0x13, FREG2b},
{"ltd",    0x01, 0x14, DREG2b},
{"ltf",    0x01, 0x15, FREG2b},
{"mult",   0x01, 0x16, FREG3},
{"multd",  0x01, 0x17, DREG3},
{"multf",  0x01, 0x18, FREG3},
{"multu",  0x01, 0x19, FREG3},
{"ned",    0x01, 0x1a, DREG2b},
{"nef",    0x01, 0x1b, FREG2b},
{"subd",   0x01, 0x1c, DREG3},
{"subf",   0x01, 0x1d, FREG3}
};

```
