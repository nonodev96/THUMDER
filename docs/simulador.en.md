# The DLX simulator of THUMDER

THUMDER assembles and simulates the programs by itself, without a server. The code is in `src/app/__core/engine/` and is plain TypeScript (it does not depend on Angular). The reference is the WinDLX manual ([manual-simulador-dlx.md](manual-simulador-dlx.md), in Spanish).

| File | What it does |
| :-- | :-- |
| `isa.ts` | The instruction set: encoding, syntax, execution unit and double registers |
| `assembler.ts` | The assembler: from source code to memory |
| `cpu.ts` | The memory, the registers and what each instruction does |
| `traps.ts` | The input and output traps (`printf`, reading lines…) |
| `architectures.ts` | The architectures THUMDER simulates (DLX and SuperDLX) and their views |
| `pipeline.ts` | The DLX pipeline, cycle by cycle |
| `superscalar.ts` and `superscalar-config.ts` | SuperDLX, the superscalar DLX, and its parameters ([superdlx.en.md](superdlx.en.md)) |
| `reference.ts` | An executor without a pipeline, instruction by instruction, used to check the pipeline |
| `simulator.ts` | Serves the requests of the protocol (`SimulationInitRequest`, `SimulationNextStepRequest`…) |
| `runner.ts` | The requests and the run loop: cycles at the chosen pace, breakpoints, waiting for input and pause |
| `simulator.worker.ts` | The Web Worker where all of the above lives |

The whole process (assembling, simulating and the run loop) happens in a **Web Worker**, outside the thread of the page. The page sends the requests and the order to run (with the delay and the breakpoints) and only receives the cycles to draw them. With delay 0, the Worker groups the cycles that fit in a frame (16 ms, 500 at most) in each message, so a long program does not block the interface. The Worker stops by itself when the program ends, at a breakpoint, at an error or when the program waits for a line of the console. Where there are no Workers (the unit tests), the same code runs in the page.

### The protocol of the Worker

The page (`LocalSimulatorService`) and the Worker (`runner.ts`) send each other objects with `postMessage`. The requests and their responses go as JSON text, as they went through the socket.

**From the page to the Worker** (`ToSimulator`):

| Message | What it asks |
| :-- | :-- |
| `{ kind: "request", id, event, payload }` | A request (table below); the Worker answers with the same `id` |
| `{ kind: "run", delay, breakpoints, stages?, watchpoints?, until?, journal? }` | Run cycle after cycle (`RunOptions`), `delay` ms between them (0: as fast as possible), stopping at the lines `breakpoints` of the main file: when its instruction is fetched or, depending on `stages`, when it reaches ID, EX, MEM or WB; and when the addresses of `watchpoints` are read or written. With `until`, it stops at that number of cycles, making first the changes of `journal` in their cycle (the step back) |
| `{ kind: "pause" }` | Stop the run |
| `{ kind: "speed", delay }` | Change the pace of the run going on |
| `{ kind: "breakpoints", lines, stages?, watchpoints? }` | Change the breakpoints during the run |

**From the Worker to the page** (`FromSimulator`):

| Message | What it holds |
| :-- | :-- |
| `{ kind: "response", id, result }` or `{ kind: "response", id, error }` | The response to a request, or its error |
| `{ kind: "steps", steps }` | The cycles run since the last message (`LocalSimulationStep`). Each cycle also carries `stalls` (why each instruction is stopped: kind of hazard, register, instruction that causes it and whether forwarding would have avoided it), `reads` (what the loads read) and, if it stopped at a breakpoint, `hit` |
| `{ kind: "stopped", reason }` | Why it stopped: `complete`, `breakpoint`, `input`, `error` or `paused` |

**The requests** (`event`):

| Request | Data | Response |
| :-- | :-- | :-- |
| `UpdateConfigurationMachineRequest` | `TypeConfigurationMachine`: forwarding, floating point units (count and delay), memory size and the architecture (`architecture`: `dlx` or `superdlx`, with the parameters of SuperDLX in `superscalar`) | The configuration. It is sent before loading, because the program is assembled for that memory size |
| `SimulationInitRequest` | `LocalSimulationInitRequest`: the file (`filename`, `content`), the files of its folder (`files`) and, if they were chosen by hand, the modules assembled with it (`modules`) | `LocalSimulationInitResponse`: whether it can be simulated, the errors with their line, the instructions, the data in memory, the symbols (`symbols`) and the modules loaded (`modules`) |
| `SimulationNextStepRequest` | Nothing | One cycle (`LocalSimulationStep`): the stages, the arrows of the diagram, the registers and the memory that change, the statistics and what the program writes |
| `UpdateRegisterRequest` | `TypeRegisterToUpdate[]` (register by name or number, value in hexadecimal) | The values saved and whether all were accepted |
| `UpdateMemoryRequest` | `TypeMemoryToUpdate[]` | The same for the memory |
| `SimulationInputRequest` | `{ text }`: the line written in the console | `{ allOK: true }`; the program goes on at the next `run` or step |
| `CompareForwardingRequest` | `{ init, configuration, maxCycles? }` | `CompareResponse`: the program run to the end in DLX with and without forwarding (cycles, instructions, CPI, IPC and stalls of each kind) |
| `CompareArchitecturesRequest` | `{ init, configuration, maxCycles? }` | `CompareArchitecturesResponse`: the program run to the end in DLX and in SuperDLX, each with its configuration |

`MachineService` is the one that uses this protocol. When loading, it sends `UpdateConfigurationMachineRequest` and then `SimulationInitRequest`. The step of one cycle (F8) is a `SimulationNextStepRequest`. Running (F9) is a `run`, whose cycles it draws as they arrive. Pausing is a `pause`. To the end without drawing (Shift+F9) is a `run` without delay in which the page only updates the views when it stops. The step back (Shift+F8) loads the same program again and makes a `run` with `until` equal to the cycles minus one and the journal of what the person did (lines of the console, registers and memory changed by hand), so the state is exactly that of the previous cycle.

`MachineService` keeps the state in read-only *signals* (`state`: step, line, pipeline, statistics, output, errors, symbols...) and the cycle clock diagram in a data model (`CycleDiagramModel`) that keeps the last cycles (100 to 100,000, in the settings) with the reason of each stall.

## 1. Assembly

It is a two-pass assembler: the first one gives each label its address and the second one writes the memory.

- **Segments:** the code goes from `$TEXT` (0x100) and the data from `$DATA` (0x1000). `.text` and `.data` change segment and take an address (`.data 0x2000`).
- **Directives:** `.align n`, `.ascii`, `.asciiz`, `.byte`, `.half`, `.word`, `.float`, `.double`, `.space n` and `.global`.
- **Expressions:** as in C: decimal, hexadecimal (`0x1F`) and octal (`017`) numbers and characters (`'0'`); symbols; the operators `* / % + - << >> & ^ | ~` and parentheses. Immediates take `#` (`addi r1,r0,#4`).
- **Real encoding:** each instruction is encoded in its 32 bits with the codes of WinDLX, the same that the disassembler of THUMDER uses. For example, `addi r1,r0,0` is `0x20010000`.
- **Errors:** the number of operands, the registers (doubles must be even), the ranges of immediates and offsets and the symbols that do not exist are checked. Each error is marked on its line in the editor, and a program with errors cannot be simulated.
- **Several files:** as in WinDLX, the labels of each file are its own and only those declared with `.global` are shared. If a program lacks a symbol, THUMDER adds the files of the same folder that declare it `.global` (for example, `gcm.s` uses `InputUnsigned` of `input.s`).
- **Start:** execution starts at `main` if it exists and, if not, at `$TEXT`.

## 2. Loading

The instructions and the data of the directives are written to memory. The memory is *big-endian*: byte 0 of a word is the most significant. The code and the data reach the code and memory views before the first cycle.

## 3. Execution in the pipeline

Each cycle, the IF stage reads from memory the word the PC points to and decodes it. So what runs is what is in memory: if a program writes over its own code, the new code runs.

### Stages

- **IF:** fetches the instruction and adds 4 to the PC.
- **ID:** decodes and reads the registers. Branches and jumps are resolved here.
- **EX:** the integer unit (intEX) takes 1 cycle. The floating point ones (faddEX, fmultEX and fdivEX) take their delay, from 1 to 8 units of each kind, and each unit is busy for its whole delay. MULT, MULTU, DIV and DIVU also use these units, although they work with integers.
- **MEM:** loads and stores.
- **WB:** writes to the registers in the first half of the cycle, so an instruction in ID reads the new value in the second half.

### Timing rules

| Situation | With forwarding | Without forwarding |
| :-- | :-- | :-- |
| An instruction uses the ALU result of the previous one | No stall | 2 stalls (`R-Stall`) |
| An instruction uses the value of a previous load | 1 stall (`R-Stall`) | 2 stalls (`R-Stall`) |
| A branch uses the result of the previous instruction (it is resolved in ID) | 1 stall (`R-Stall`) | Waits until the producer is in WB |
| A branch is taken (predict not taken) | The instruction fetched after it is aborted (`Aborted`): 1 cycle | The same |
| An instruction uses the result of a floating point unit | Waits until the end of the unit (`R-Stall`) | Waits until WB |

Besides:

- **`W-Stall`:** the instruction waits in ID while an earlier one with the same destination register is still in an execution unit. It is the example of the manual (section 6.1): `ADDD F0,F2,F4` followed by `MOVF F1,F4`.
- **`S-Stall`:** no unit of the kind needed is free.
- **`Stall`:** a floating point instruction and an integer one end at the same time. The floating point one enters MEM first and the integer one waits in intEX.
- **`T-Stall`:** a trap waits in IF until the pipeline is empty. A trap 3 without input also waits, until a line is written in the console.

All these rules are in the tests of `pipeline.spec.ts`, with the timeline expected for each instruction.

### Statistics

As in WinDLX: cycles, instructions that went through ID, stalls (RAW, and among them those due to loads, to branches and to floating point; WAW, structural, control and trap), taken and not taken conditional branches, loads and stores, instructions of each floating point unit and traps.

## 4. Traps and console (DLX-I/O)

The address of the first parameter goes in R14 and the result is left in R1 (section 5 of the manual).

| Trap | What it does in THUMDER |
| :-- | :-- |
| 0 | Ends the program |
| 1 and 2 | Open and close files: there are no files in the browser, so `open` returns -1 |
| 3 | Reads a line of the console (the standard input, descriptor 0); the program waits until it is written |
| 4 | Writes a block to the standard output or to the error output (descriptors 1 and 2) |
| 5 | `printf` with `%d %i %u %x %X %o %c %s %f %e %g` and their options (width, precision, `-`, `+`, `0`, `#`); `double` values take 8 bytes in the parameters |

What the program writes appears in the **console of the program**, which opens by itself. It is the character device of the processor and has two views:

- **Screen:** only the bytes the traps write (those of the error output, descriptor 2, in red) and the lines typed for trap 3. When the program asks for a line, the cursor is on the screen: Enter sends it and the arrows bring back the previous ones.
- **Traps:** each trap that read or wrote, with its cycle, its number and its function (`read`, `write`, `printf`…), its descriptor, its bytes and its data as they are (with `\n` and the control characters escaped), and how many bytes each descriptor has passed.

A light shows what the program is doing: green while it runs, amber (blinking) while it waits for a line and red when it has ended. The console is resized from its top edge, its left edge and its top left corner; THUMDER remembers the size in that browser, and a double click on the edge brings back the usual one. The debugging window is resized the same way, from its right edge, its bottom edge and its bottom right corner.

## 5. Errors while running

An address outside the memory, an access not aligned, an integer division by zero, a word that is not an instruction or a trap that does not exist stop the simulation. The message and the address where it happened are shown.

## 6. Differences with WinDLX

- **Unsigned comparisons:** the WinDLX tables of THUMDER have no code for `SEQU`…`SGEU` or `SEQUI`…`SGEUI`. THUMDER gives them free codes (functions 0x10 to 0x15 and opcodes 0x30 to 0x35).
- **Entry point:** WinDLX starts at `$TEXT`; THUMDER starts at `main` if it exists, even if a module comes first in alphabetical order.
- **Files:** there are no files in the browser (traps 1, 2 and 4 only with descriptors 0, 1 and 2).
- **Exceptions:** `RFE`, `MOVI2S` and `MOVS2I` are not implemented.

## 7. How it is checked

- **Assembler** (`assembler.spec.ts`): the encodings of WinDLX, directives, errors with their line and all the examples of `src/assets/examples-dlx`.
- **Classic examples** (`classics.spec.ts`): the 20 programs of [ejemplos-dlx.en.md](ejemplos-dlx.en.md) print what their headers say and end the same in the pipeline as in the reference executor, with the four configurations. The 5 of SuperDLX, in `superdlx-examples.spec.ts`.
- **SuperDLX** (`superscalar.spec.ts`): all the examples end the same as in the reference executor with five machines, with invariants in each cycle ([superdlx.en.md](superdlx.en.md)).
- **Semantics** (`reference.spec.ts`): `prim.s` leaves the first 10 primes in `Table`, `gcm.s` with `input.s` prints `gcM=6` for 12 and 18, `fact.s` computes 5! = 120 with `double` and `base.s` counts the days above 14 degrees.
- **Pipeline** (`pipeline.spec.ts`):
  - the timelines of the rules above;
  - all the examples with four configurations (with and without forwarding, and fast or slow floating point units). With each one, the final state (registers, memory and number of instructions) must be identical to that of the reference executor.
- **Running** (`runner.spec.ts`): to the end, breakpoints, console input, pace and pause, and errors of the requests.
- **Integration** (`simulator.spec.ts` and `machine.service.spec.ts`): the protocol, the console input and the whole path from THUMDER.
