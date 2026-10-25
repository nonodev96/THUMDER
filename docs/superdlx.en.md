# SuperDLX: the superscalar DLX

THUMDER simulates two architectures with the same instruction set, the same assembler and the same programs:

- **DLX**, the five-stage pipeline of WinDLX (IF, ID, EX, MEM, WB): one instruction per cycle, in order ([the DLX simulator](simulador.en.md)).
- **SuperDLX**, a **superscalar DLX with out of order execution**, as the one of [WinSuperDLX](https://github.com/oslugr/WinSuperDLX): it fetches, decodes and commits several instructions per cycle, runs them as soon as they have their operands and a free unit, and commits them in order with a reorder buffer (ROB).

A program ends with the same registers, the same memory and the same output in both: only the cycles change. So the same program can be compared on one machine and the other.

## How to choose it

- In the **header**, the architecture button (`DLX` or `SuperDLX`). On a phone it is in the "More" menu.
- In the **settings**, section "Architecture", where the parameters of SuperDLX are too.

Changing it loads the program again in the other machine. A guided or shared exercise can lock the architecture: then it cannot be changed while it is open. The exercises of the topic "Superscalar (SuperDLX)" lock SuperDLX.

## The machine

```
            ┌───────────────┐
  memory ──►│     Fetch     │◄── BTB (prediction with 2-bit counters)
            └──────┬────────┘
                   ▼
            Instruction queue
                   │
            ┌──────▼────────┐  renaming: each operand is a value or the ROB entry that will produce it
            │    Decode     │──────────────────────────────────────────────┐
            └──┬─────────┬──┘                                              │
               ▼         ▼                                                 ▼
      Integer window   Floating point window            Integer ROB   Floating point ROB
               │         │                                    ▲              ▲
               ▼         ▼                                    │ results      │
   ALU, shift, compare,                   add, multiply, divide,               │
   address and branch (integer)           convert, compare, address            │
               │                          and branch (floating point)          │
               └──── load buffer and store buffer ──────────── memory ─────────┘
                                              │
                               In order commit (writes the registers)
```

The machine has two halves, the integer one and the floating point one, each with its **instruction window** (reservation stations) and its **ROB**. An instruction goes to the half of the register it writes: the floating point ones, the floating point loads and stores (`lf`, `ld`, `sf`, `sd`), the floating point comparisons (they write the FPSR) and their branches (`bfpt`, `bfpf`) go to the floating point half; the rest, to the integer one.

### What happens in each cycle

The stages are simulated from the last one to the first, so that what a stage produces is used by the next one in the next cycle:

1. **Commit.** From the head of each ROB, in order, up to `commit` instructions of each. The registers are written here. A store is released to be written to memory (it needs its data). A trap runs when it is the oldest instruction of the machine and the earlier stores are already in memory; its result (R1) commits in the next cycle. An error of the program (address outside the memory, division by zero, invalid instruction) stops the simulation when its instruction reaches the head: those of squashed instructions do not stop it.
2. **Result write.** The instructions whose unit ends in this cycle have their result in the ROB; the ones waiting for it can start in this same cycle. A load has its address and moves on to wait for the memory.
3. **Memory.** The loads, in order, read the memory if no earlier store can write any of their bytes; a load whose address is not known yet stops the younger ones. Then the released stores are written, in order, with the accesses left (`accesses` per cycle). An access takes `latency` cycles. There is no forwarding from a store to a load: the load waits until it is written.
4. **Issue.** From each window (the integer one first), the oldest instructions that have their operands go to a free unit of their kind. The units are **not pipelined**: each one is busy for its whole latency. A branch is resolved here: if the prediction fails, everything fetched after it is squashed and fetch goes on along the right path in the next cycle.
5. **Decode.** Up to `decode` instructions of the queue go to their window and their ROB (and to the load or store buffer), with their registers renamed: each operand is a value (from the ROB or the registers) or the ROB instruction that will produce it. It stops if the window, the ROB or the buffer the instruction needs is full. A `jr` or `jalr` whose register is already known is resolved here.
6. **Fetch.** Up to `fetch` instructions to the queue. A conditional branch is looked up in the BTB: if it is there, its 2-bit counter predicts; if not, it enters and is predicted taken. `j` is resolved in fetch and `jal` goes on in it along its target; `jr` and `jalr` stop fetch until their register is known. After `trap 0` nothing else is fetched.

The instructions `nop` and `j` are resolved in fetch and take no place in the queue or the ROB; they commit when all the earlier ones have committed.

### The parameters

They are those of the `MACHINE` file of WinSuperDLX, with their default values:

| Parameter | Default | Limits |
| :-- | :-- | :-- |
| Instructions fetched, decoded and committed per cycle | 6, 4 and 4 | 1 to 16 |
| Instruction queue | 20 | 1 to 128 |
| Integer and floating point ROB | 20 and 20 | 2 to 128 |
| Integer and floating point windows | 20 and 20 | 1 to 128 |
| Load and store buffers | 5 and 5 | 1 to 64 |
| BTB entries | 111 | 1 to 4096 |
| Memory: latency and accesses per cycle | 1 and 4 | 1 to 50, 1 to 16 |
| Integer units (count and latency) | ALU 4 and 1, shift 2 and 1, compare 1 and 1, address 4 and 1, branch 1 and 1 | 1 to 20, 1 to 50 |
| Floating point units | add 4 and 2, multiply 4 and 5, divide 2 and 10, convert 2 and 2, compare 1 and 1, address 4 and 1, branch 1 and 1 | 1 to 20, 1 to 50 |

The settings have three ready-made machines: the WinSuperDLX one, a **scalar** one (one instruction per cycle and one unit of each kind, to see what being superscalar brings) and a **very wide** one (eight per cycle and large structures). Branch prediction can be turned off: then fetch stops at each branch until it is resolved.

Integer multiplications and divisions (`mult`, `div`...) use, as in DLX, the floating point multiplier and divider, although they belong to the integer half (their registers are integer).

## The views

| View | With SuperDLX |
| :-- | :-- |
| Pipeline | The machine in the cycle: the queue, the windows with the operands each instruction waits for, the functional units with the cycles they have left, the two ROBs, the load and store buffers, the renamed registers and the BTB with its counters |
| Cycle Clock Diagram | Each instruction in a row, with what it does in each cycle: F (fetched), q (in the queue), D (decoded), w (waits in the window), E (in its unit), M (memory), W (result), r (waits in the ROB), C (committed) and X (squashed). The table of events gives the cycle of each step of all the instructions (it exports to CSV). Choosing an instruction shows how long it waited in each place |
| Statistics | IPC and CPI, how many cycles commit 0, 1, 2... instructions, why fetch, decode and commit stop, the waits in the windows (operands or unit), branch prediction, the use of each unit, the average occupation of each structure and the same program in DLX and in SuperDLX |
| Registers, memory and code | The same: the registers are the committed ones. The code and the editor mark the state of each instruction: in the queue, in the window, in its unit, waits for memory, reads memory, done, committed or squashed |
| Datapath | It is the one of the DLX pipeline: with SuperDLX it is not in the menus |

Breakpoints work the same: a line stops when one of its instructions is fetched or, depending on the chosen stage, when it is decoded (ID), starts in its unit (EX), accesses the memory (MEM) or commits (WB). Watching the memory, step back, the speed and running to the end without drawing also work with SuperDLX.

## Examples and exercises

In the folder `ejemplos/superdlx` of the file manager there are five commented programs ([the guide to the examples](ejemplos-dlx.en.md#superdlx-examples)): parallelism between instructions, register renaming, branch prediction, dependencies through memory and the ROB with long instructions.

In the exercises view, the topic "Superscalar (SuperDLX)" has nine guided exercises. Each one locks the architecture and the machine, and its answers come from the simulation (also from the statistics of SuperDLX, such as the mispredictions or the cycles without commit):

| Exercise | Program | Machine | Asks for |
| :-- | :-- | :-- | :-- |
| Parallelism between instructions | `01-paralelismo.s` | WinSuperDLX | cycles, instructions, cycles without commit |
| One instruction per cycle | `01-paralelismo.s` | scalar | cycles, cycles without commit |
| Register renaming | `02-renombrado.s` | WinSuperDLX | R6, cycles |
| Branch prediction with 2-bit counters | `03-prediccion-de-saltos.s` | WinSuperDLX | branches, mispredictions, squashed, cycles |
| Without branch prediction | `03-prediccion-de-saltos.s` | without prediction | cycles, fetch waits, squashed |
| Dependencies through memory | `04-dependencias-en-memoria.s` | WinSuperDLX | loads, loads that waited, cycles |
| A small ROB | `05-rob-y-coma-flotante.s` | floating point ROB of 4 | cycles, cycles with the ROB full |
| A ROB of 20 entries | `05-rob-y-coma-flotante.s` | WinSuperDLX | cycles, cycles with the ROB full |
| DLX against SuperDLX | `16-producto-escalar.s` | WinSuperDLX | cycles, instructions |

## Differences with WinSuperDLX

THUMDER follows the model of SuperDLX and its parameters, with these differences, most of them so that the result of the program is always right:

1. **Memory disambiguation.** A load also waits for the earlier stores whose address is not known yet, and for the earlier traps (trap 3 writes to memory). SuperDLX only compares with the addresses already computed, and a load could overtake a store that wrote the same place.
2. **Synchronisation of the two ROBs.** In SuperDLX a branch takes an entry in both ROBs. In THUMDER it only takes the one of its half, and an instruction does not commit while the other ROB has an earlier unresolved branch, an earlier trap not run or an earlier error.
3. **Decode.** It stops when the window, the ROB or the buffer **of the instruction** are full (SuperDLX requires room in both windows and both ROBs).
4. **Precise errors.** An error happens when the instruction commits; those of squashed instructions do not stop the simulation.
5. **`trap 0`** is fetched, stops fetch and ends the program when it commits (SuperDLX runs it in fetch and waits for the machine to empty).
6. **`nop`** takes one of the instructions fetched in the cycle (SuperDLX does not count it).
7. **Squashed instructions** leave the ROB in the cycle of the misprediction (SuperDLX marks them and removes them when they reach the head).
8. **Prediction.** Only the scheme of SuperDLX: a 2-bit counter per BTB entry, which starts at "taken (weak)"; collisions do not update the entry. WinSuperDLX added schemes with more history bits that THUMDER does not have.
9. **Integer `mult` and `div`** work with integer registers, as in WinDLX (in SuperDLX, as in the original DLX, they work with floating point registers).

## Origin and licence

SuperDLX is by Cecile Moura and the ACAPS group of McGill University (1993); WinSuperDLX, its interface for Windows, is by Mario David Barragán García, Antonio Jesús Contreras Sánchez, Emilio José Garnica López and Julio Ortega Lopera (University of Granada, 2002). Both are free software under the GPL licence.

The SuperDLX mode of THUMDER is **its own implementation in TypeScript**, written from the model described in the code and the documentation of WinSuperDLX: it does not copy or translate its code, its texts or its examples, so THUMDER keeps its MIT licence.

## Inside

| File | What it does |
| :-- | :-- |
| `src/app/__core/engine/architectures.ts` | The architectures, their name and their views |
| `src/app/__core/engine/superscalar-config.ts` | The parameters of SuperDLX, their limits, their validation and the ready-made machines |
| `src/app/__core/engine/superscalar.ts` | The machine, cycle by cycle, and what the views see in each cycle (`snapshot`) |
| `src/app/__core/machine/superscalar-timeline.ts` | The history of the instructions for the cycle clock diagram |
| `src/app/components/architecture-selector/` | The button of the header |
| `src/app/components/superscalar-machine/` and `superscalar-diagram/` | The machine and the cycle clock diagram |
| `src/app/views/_auth/statistics/superscalar-statistics.component.ts` | The statistics |

The simulator of the Worker (`simulator.ts`) creates the machine of the architecture of the configuration (`UpdateConfigurationMachineRequest` carries `architecture` and `superscalar`). Each SuperDLX cycle carries in `superscalar.events` what each instruction did; the whole machine (`superscalar.snapshot`) and its statistics only go in the last cycle of each message, which is the one the page draws. `CompareArchitecturesRequest` runs the program to the end in DLX and in SuperDLX.

### How it is checked

- The 30 example programs (the DLX and the SuperDLX ones) end in SuperDLX with the same registers, the same memory, the same output and the same number of instructions as the reference executor, with five different machines (the WinSuperDLX one, the scalar one, the very wide one, without prediction and with minimal buffers and slow memory).
- In each cycle it is checked that no structure goes beyond its size, that no more instructions than allowed are fetched, decoded or committed, that each ROB commits in order and that nothing committed is squashed.
- Timing tests: independent instructions in parallel, chains of dependencies, using the result in the next cycle, the loads, the waits for stores, the prediction of a loop, the non pipelined units, the two halves and the errors on the wrong path.
- The SuperDLX examples do what their comments say (`superdlx-examples.spec.ts`), and the exercises ask what they say: that the scalar machine takes more than twice as long, that without prediction nothing is squashed but it takes longer, that the small ROB takes longer (`exercises.spec.ts`).
- e2e tests of the header, the views, the settings, the examples, a guided exercise and accessibility (axe) in both themes.

### How to add another architecture

1. Its name and its views in `architectures.ts`.
2. Its machine, with `tick()`, `registers`, `memory`, `nextPC` and `cycle`, and its link to the protocol in `simulator.ts` (`createEngine`).
3. Its configuration in `config.ts` and in the settings view.
4. Its views, which choose what they show with `MachineService.state.architecture`.
