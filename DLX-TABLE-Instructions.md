DLX-TABLE Instruction
=====================

## Type I - J

| (bit0-2)(bit3-5) |    000   |   001   |  010 |  011  |  100 |  101 |  110 |  111 |
|:----------------:|:--------:|:-------:|:----:|:-----:|:----:|:----:|:----:|:----:|
|        001       | (rr alu) | (float) |   J  |  JAL  | BEQZ | BNEZ | BFPT | BFPF |
|        001       |   ADDI   |  ADDUI  | SUBI | SUBUI | ANDI |  ORI | XORI |  LHI |
|        010       |    RFE   |   TRAP  |  JR  |  JALR | SLLI |   -  | SRLI | SRAI |
|        011       |   SEQI   |   SNEI  | SLTI |  SGTI | SLEI | SGEI |   -  |   -  |
|        100       |    LB    |    LH   |   -  |   LW  |  LBU |  LHU |  LF  |  LD  |
|        101       |    SB    |    SH   |   -  |   SW  |   -  |   -  |  SF  |  SD  |
|        110       |     -    |    -    |   -  |   -   |   -  |   -  |   -  |   -  |
|        111       |     -    |    -    |   -  |   -   |   -  |   -  |   -  |   -  |

## Type R - OPCODE = 0

| (bit26-28)(bit29-31) |   000  |   001  |  010 |  011 |   100   |   101   | 110 | 111 |
|:--------------------:|:------:|:------:|:----:|:----:|:-------:|:-------:|:---:|:---:|
|          001         |    -   |    -   |   -  |   -  |   SLL   |    -    | SRL | SRA |
|          001         |    -   |    -   |   -  |   -  |    -    |    -    |  -  |  -  |
|          010         |    -   |    -   | SLTU | SGTU |   SLEU  |   SGEU  |  -  |  -  |
|          011         |  MULT  |  MULTU |  DIV | DIVU |    -    |    -    |  -  |  -  |
|          100         |   ADD  |  ADDU  |  SUB | SUBU |   AND   |    OR   | XOR |  -  |
|          101         |   SEQ  |   SNE  |  SLT |  SGT |   SLE   |   SGE   |  -  |  -  |
|          110         | MOVI2S | MOVS2I | MOVF | MOVD | MOVFP2I | MOVI2FP |  -  |  -  |
|          111         |    -   |    -   |   -  |   -  |    -    |    -    |  -  |  -  |

## Type R - OPCODE = 1

| (bit26-28)(bit29-31) |   000  |   001  |   010  |   011  |   100  |   101  |  110  |  111 |
|:--------------------:|:------:|:------:|:------:|:------:|:------:|:------:|:-----:|:----:|
|          001         |  ADDF  |  SUBF  |  MULTF |  DIVF  |  ADDD  |  SUBD  | MULTD | DIVD |
|          001         | CVTF2D | CVTF2I | CVTD2F | CVTD2I | CVTI2F | CVTI2D |   -   |   -  |
|          010         |   EQF  |   NEF  |   LTF  |   GTF  |   LEF  |   GEF  |   -   |   -  |
|          011         |   EQD  |   NED  |   LTD  |   GTD  |   LED  |   GED  |   -   |   -  |
|          100         |    -   |    -   |    -   |    -   |    -   |    -   |   -   |   -  |
|          101         |    -   |    -   |    -   |    -   |    -   |    -   |   -   |   -  |
|          110         |    -   |    -   |    -   |    -   |    -   |    -   |   -   |   -  |
|          111         |    -   |    -   |    -   |    -   |    -   |    -   |   -   |   -  |
