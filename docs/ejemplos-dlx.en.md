# DLX examples

In `src/assets/examples-dlx/ejemplos/` there are 20 classic programs, from the simplest to the most advanced. Each one starts with a header that explains the concepts, what to look at in THUMDER while it runs, something to try and the result it prints. The programs and their comments are in Spanish.

In THUMDER they are always in the folder `ejemplos` of the file manager, read only, with the 20 programs and `input.s`, the input module of the WinDLX examples that example 20 uses. If you change one, saving creates a copy in `mis ejemplos`.

| No. | File | What it teaches | Prints |
| :-- | :-- | :-- | :-- |
| 01 | `01-hola-mundo.s` | The `.data` and `.text` segments, `.asciiz`, traps 5 (`printf`) and 0 | `Hola, mundo desde DLX!` |
| 02 | `02-suma-vector.s` | Going through a vector, loops with a counter, the load-use hazard and instruction scheduling | `La suma es 50` |
| 03 | `03-maximo.s` | Comparisons with `slt`, conditional branches, the "not taken" prediction, signed and unsigned | `El maximo es 33` |
| 04 | `04-fibonacci.s` | Tables in memory, traps in a loop, the registers the traps change (R1 and R14) | the first 20 terms |
| 05 | `05-factorial.s` | `mult` in the fmulEX unit and its stalls, `printf` with several parameters | `10! = 3628800` |
| 06 | `06-mcd-euclides.s` | `div` in fdivEX, the remainder without a remainder instruction, "while" loops | the steps of Euclid and `mcd(1071, 462) = 21` |
| 07 | `07-multiplica-desplazando.s` | Bit operations (`andi`, `slli`, `srli`) and how the hardware multiplies | `123 x 45 = 5535` |
| 08 | `08-binario.s` | Strings with `sb`, the 32 bits of a word, two's complement, `%08x`, subroutines with `jal` and `jr` | four numbers in binary and their ones |
| 09 | `09-cadenas.s` | `lbu` and `sb`, C strings, `strlen`, reversing, comparing, tables of pointers | length, reverse and palindrome of three words |
| 10 | `10-burbuja.s` | Sorting with two nested loops, swapping in memory, a stop flag | the vector before and after |
| 11 | `11-busqueda-binaria.s` | Searching a sorted vector, `srai` to divide by 2, subroutines that return two values | position and steps of five keys |
| 12 | `12-criba.s` | The sieve of Eratosthenes with a vector of bytes, without divisions | the 25 primes below 100 |
| 13 | `13-matrices.s` | Matrices by rows, three nested loops, going through rows and columns with pointers | the product of two 3 x 3 matrices |
| 14 | `14-factorial-recursivo.s` | Recursion, the stack (r29), call frames, the register convention | `7! = 5040` |
| 15 | `15-hanoi.s` | Recursion with four arguments and two calls, `printf` with `%c` | the 7 moves of 3 disks |
| 16 | `16-producto-escalar.s` | Doubles (`.double`, `ld`, `multd`, `addd`), even registers, floating point units | `X . Y = 16.5` |
| 17 | `17-daxpy.s` | The DAXPY loop of Hennessy and Patterson and its chain of dependencies | `Y = 10.5 21 ... 84` |
| 18 | `18-daxpy-desenrollado.s` | Unrolling and scheduling a loop, structural hazards, more multiplication units | the same as 17, in fewer cycles |
| 19 | `19-riesgos.s` | A catalogue of hazards: RAW with and without forwarding, load, branch, control, MEM, structural, WAW and trap | nothing: look at the cycle clock diagram |
| 20 | `20-media-entrada.s` | Two modules (`.global`), reading from the console (trap 3), integer to double, `divd` | the mean of the numbers typed |

Examples 17 and 18 go together: they do the same and the difference is in the statistics. Run 19 step by step (F8), looking in the cycle clock diagram for the labels of each block.

## SuperDLX examples

In `ejemplos/superdlx` there are five programs for [SuperDLX](superdlx.en.md), the superscalar DLX (chosen in the top bar). They also work in DLX, and their header says what changes from one architecture to the other.

| No. | File | What it teaches | Prints |
| :-- | :-- | :-- | :-- |
| 01 | `01-paralelismo.s` | Parallelism between instructions: a chain of additions against four accumulators, the IPC and the scalar machine | `Un acumulador: 528` and `Cuatro acumuladores: 528` |
| 02 | `02-renombrado.s` | True and false dependencies (WAR and WAW), renaming with the ROB and the renamed registers | `A = 36, B = 360, C = 3600` |
| 03 | `03-prediccion-de-saltos.s` | The BTB and the 2-bit counters, a loop branch against an alternating "if", the squashed instructions | how many even and odd numbers there are, twice |
| 04 | `04-dependencias-en-memoria.s` | Stores are written when they commit; the loads that wait for an earlier store | `En memoria: 120, en un registro: 120` |
| 05 | `05-rob-y-coma-flotante.s` | In order commit, a division at the head of the ROB, the size of the ROB and the two halves of the machine | `Suma de 1/i para i = 1..8: 2.71786` |

Each one has guided exercises in the topic "Superscalar (SuperDLX)" of the exercises view, which lock the architecture and the machine: 01 with the WinSuperDLX machine and with a scalar one, 03 with and without prediction, and 05 with a floating point ROB of 4 and of 20 entries. Another one compares the dot product (example 16) in DLX and in SuperDLX.

## How they are checked

`src/app/__core/engine/classics.spec.ts` assembles and runs each example:

- with no assembly errors or warnings, and the output must be what its header says under "Resultado";
- in the pipeline, with four configurations (with and without forwarding, and fast or slow floating point units), with the same final state as the reference executor;
- the SuperDLX ones (`superdlx-examples.spec.ts`), the same in DLX and in SuperDLX, and what their comments say: that in DLX the two loops of 01 take the same and in SuperDLX the one with four accumulators takes less, that in 02 there are several versions of R4 at once and changing the register saves no cycles, that 03 fails more with the alternating numbers and without prediction squashes nothing, that in 04 14 loads wait, and that in 05 a ROB of 4 entries takes much longer and one of 40 does not improve;
- what the comments say: that scheduling the loop of 02 saves 16 cycles, that 18 takes less than 17 and only it gains with four multipliers, that each block of 19 causes its stall (and the one of "Adelanta" and "UsaCarga" goes up to 2 cycles without forwarding), that the recursive ones leave the stack as it was, and the results in memory of 10, 12 and 13.
