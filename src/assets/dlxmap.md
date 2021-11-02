# DLX instructions

The DLX instruction opcodes are listed in the following three tables. The first table shows the instructions defined in 6-bit opcode field. The second table shows R-R ALU instructions which are defined in the 6-bit function field and have an opcode field of 0. The third table shows the floating-point instructions which are defined in the 6-bit function field and have an opcode field of 1. (In fact, there are 11 bits in function field. Only the least significant 6 bits are used to define both R-R ALU and floating-point instructions.)
Note that, in all tables, each column is numbered by the least significant 3 bits where each row is numbered by the most significant 3 bits. For instance, the opcode of SW is $101011$. Instruction ADD has an opcode $000000$ and a function field $100000$.

[comment]: <> (All instructions in Table 2 and 3 are R-type. In Table 1, J, JAL, REF, TRAP are J-type, the rest are I-type instructions.)
Todas las instrucciones en la tabla 2 y 3 son instrucciones tipo R.
En la tabla 1 las instrucciones ``J, JAL, REF, TRAP'' son de tipo J el resto son tipo I.

```
(bit0-2)\(bit3-5)   $000$       $001$   $010$   $011$   $100$   $101$   $110$   $111$
$000$               (rr alu)    (float) J       JAL     BEQZ    BNEZ    BFPT    BFPF
$001$               ADDI        ADDUI   SUBI    SUBUI   ANDI    ORI     XORI    LHI
$010$               RFE         TRAP    JR      JALR    SLLI    -       SRLI    SRAI
$011$               SEQI        SNEI    SLTI    SGTI    SLEI    SGEI    -       -
$100$               LB          LH      -       LW      LBU     LHU     LF      LD
$101$               SB          SH      -       SW      -       -       SF      SD
$110$               -           -       -       -       -       -       -       -
$111$               -           -       -       -       -       -       -       -
```

```
(bit0-2)\(bit3-5)       $000$   $001$   $010$   $011$   $100$   $101$   $110$   $111$
$000$                   000000  000001  000010  000011  000100  000101  000110  000111
$001$                   001000  001001  001010  001011  001100  001101  001110  001111
$010$                   010000  010001  010010  010011  010100  -       010110  010111
$011$                   011000  011001  011010  011011  011100  011101  -       -
$100$                   100000  100001  -       100011  100100  100101  100110  100111
$101$                   101000  101001  -       101011  -       -       101110  101111
$110$                   -       -       -       -       -       -       -       -
$111$                   -       -       -       -       -       -       -       -
```

[comment]: <> (DLX R-R ALU instructions &#40;opcode = 0&#41;: only the least-significant 6 bits in the function field are used.)
En DLX operaciones ALU tipo R con tipo R con (opcode = 0): Solo los 6 bits menos significativos en el campo ``func'' son usado

```
(bit26-28)\(bit29-31)   $000$   $001$   $010$   $011$   $100$   $101$   $110$   $111$
$000$                   -       -       -       -       SLL     -       SRL     SRA
$001$                   -       -       -       -       -       -       -       -
$010$                   -       -       -       -       -       -       -       -
$011$                   -       -       -       -       -       -       -       -
$100$                   ADD     ADDU    SUB     SUBU    AND     OR      XOR     -
$101$                   SEQ     SNE     SLT     SGT     SLE     SGE     -       -
$110$                   MOVI2S  MOVS2I  MOVF    MOVD    MOVFP2I MOVI2FP -       -
$111$                   -       -       -       -       -       -       -       -
```

```
(bit26-28)\(bit29-31)   $000$   $001$   $010$   $011$   $100$   $101$   $110$   $111$
$000$                   -       -       -       -       000100  -       000110  000111
$001$                   -       -       -       -       -       -       -       -
$010$                   -       -       -       -       -       -       -       -
$011$                   -       -       -       -       -       -       -       -
$100$                   100000  100001  100010  100011  100100  100101  100110  -
$101$                   101000  101001  101010  101011  101100  101101  -       -
$110$                   110000  110001  110010  110011  110100  110101  -       -
$111$                   -       -       -       -       -       -       -       -
```

[comment]: <> (DLX floating-poing instructions &#40;opcode = 1&#41;: only the least-significant 6 bits in the function field are used.)
En DLX instrucciones de punto flotante con (opcode = 1): Solo los 6 bits menos significativos en el campo ``func'' son usados.

```
(bit26-28)\(bit29-31)   $000$   $001$   $010$   $011$   $100$   $101$   $110$   $111$
$000$                   ADDF    SUBF    MULTF   DIVF    ADDD    SUBD    MULTD   DIVD
$001$                   CVTF2D  CVTF2I  CVTD2F  CVTD2I  CVTI2F  CVTI2D  MULT    DIV
$010$                   EQF     NEF     LTF     GTF     LEF     GEF     MULTU   DIVU
$011$                   EQD     NED     LTD     GTD     LED     GED     -       -
$100$                   -       -       -       -       -       -       -       -
$101$                   -       -       -       -       -       -       -       -
$110$                   -       -       -       -       -       -       -       -
$111$                   -       -       -       -       -       -       -       -
```

```
(bit26-28)\(bit29-31)   $000$   $001$   $010$   $011$   $100$   $101$   $110$   $111$
$000$                   000000  000001  000010  000011  000100  000101  000110  000111
$001$                   001000  001001  001010  001011  001100  001101  001110  001111
$010$                   010000  010001  010010  010011  010100  010101  010110  010111
$011$                   011000  011001  011010  011011  011100  011101  -       -
$100$                   -       -       -       -       -       -       -       -
$101$                   -       -       -       -       -       -       -       -
$110$                   -       -       -       -       -       -       -       -
$111$                   -       -       -       -       -       -       -       -
```
