# The DLX pipeline

DLX is the RISC architecture Hennessy and Patterson use to teach **pipelining**: each instruction is split into five stages, and in each cycle there is a different instruction in each stage, as on an assembly line. So, although an instruction takes five cycles, one ends every cycle.

This page explains the theory and where to see it in THUMDER. To try it, open `ejemplos/19-riesgos.s`: each block causes one kind of hazard.

## The five stages

| Stage | Name | What it does |
| :-- | :-- | :-- |
| **IF** | Fetch | Reads from memory the instruction the PC points to and adds 4 to the PC |
| **ID** | Decode | Decodes the instruction and reads its registers. Branches are decided here |
| **EX** | Execute | The ALU computes the result, or the address of a load or a store |
| **MEM** | Memory | Loads read the memory and stores write it |
| **WB** | Write back | The result is written in its register |

What happens in each stage by kind of instruction:

| Stage | Arithmetic or logic | Load or store | Branch |
| :-- | :-- | :-- | :-- |
| IF | IR ← Mem[PC]; PC ← PC + 4 | IR ← Mem[PC]; PC ← PC + 4 | IR ← Mem[PC]; PC ← PC + 4 |
| ID | A ← Rs1; B ← Rs2 | A ← Rs1; B ← Rs2 | BTA ← PC + offset; if taken, PC ← BTA |
| EX | ALU ← A op B (or A op immediate) | DMAR ← A + immediate; SDR ← B | |
| MEM | | LDR ← Mem[DMAR], or Mem[DMAR] ← SDR | |
| WB | Rd ← ALU | Rd ← LDR | |

Floating point operations, multiplication and division use their own units in EX (faddEX, fmultEX and fdivEX), which take several cycles.

**In THUMDER**: the **Pipeline** view shows the instruction of each stage, and its footer explains what each one does in the cycle; the **Datapath** draws the wires used. The registers IR, A, B, ALU, DMAR, SDR and LDR are in **Registers → Control**.

## Hazards

A **hazard** is a situation where an instruction cannot move to its next stage in the next cycle. It then **stalls**, and the ones behind it wait with it. Each stall is a lost cycle, and raises the **CPI** (cycles per instruction), which is 1 in an ideal pipeline.

### Data hazards

An instruction needs a data that an earlier one has not produced yet. For two instructions *i* and *j*, with *j* after *i*:

- **RAW** (read after write): *j* reads a register that *i* has not written yet. It is the most common.
- **WAW** (write after write): *j* would write a register before *i*. In DLX it only happens with the floating point units, which take longer than the integer ones.
- **WAR** (write after read): it does not happen in DLX, because reading is always in ID and writing always in WB.

```asm
        lw      r3, Dato(r0)    ; the data arrives at the end of MEM
        add     r4, r3, r3      ; RAW: needs r3 in EX, one cycle earlier
```

### Structural hazards

Two instructions need the same resource at once. In DLX it happens with the floating point units, which are not pipelined: with a single divider, a second division waits for the first to finish.

### Control hazards

A branch changes the PC, but whether it is taken is not known until ID. Meanwhile, IF has already fetched the next instruction. DLX assumes the branch is **not taken**: if it is taken, that instruction is **squashed** and one cycle is lost.

## Forwarding

**Forwarding** takes a result straight from the output of the ALU or of the memory to the input of the ALU, without waiting for it to be written in the register. It solves almost all RAW hazards.

| Situation | With forwarding | Without forwarding |
| :-- | :-- | :-- |
| Using the ALU result of the previous instruction | No stall | 2 cycles |
| Using the data of a previous load | 1 cycle | 2 cycles |
| A branch uses the result of the previous instruction | 1 cycle | Waits until the data is written |
| Using the result of a floating point unit | Waits until the unit ends | Waits until the data is written |

The register is written in the first half of the cycle and read in the second, so an instruction in ID reads the value WB writes in that same cycle.

**In THUMDER**: forwarding is turned on or off in the [settings](configuracion.en.md). In the cycle clock diagram, each forwarding is a green arrow, and the **With and without forwarding** tab of the statistics compares both ways.

## The stalls in THUMDER

THUMDER uses the names of WinDLX in the cycle clock diagram:

| Name | Cause | How to avoid it |
| :-- | :-- | :-- |
| `R-Stall` | RAW: a data is missing | Turn forwarding on, or move apart the instruction that produces the data and the one that uses it |
| `W-Stall` | WAW: a slower instruction writes the same register | Use another destination register |
| `S-Stall` | Structural: no floating point unit is free | Add units in the settings, or move the operations apart |
| `Stall` | An integer and a floating point instruction want MEM at once (the floating point one goes first) | Reorder the instructions |
| `T-Stall` | A trap waits in IF for the pipeline to empty | It cannot be avoided: traps talk to the outside |
| `Aborted` | The instruction was fetched after a taken branch | Rearrange the loop so the branch is taken less often |

Click a stall in the diagram: THUMDER says which register was missing, which instruction was producing it and whether forwarding would have avoided it.

## Scheduling the code

Many stalls go away by changing the order of the instructions, without changing what the program does: between a load and its use, put an instruction that does not depend on it.

Before, `add` waits one cycle for the data of `lw`:

```asm
loop:   lw      r2, 0(r1)
        add     r3, r3, r2      ; R-Stall: r2 has not arrived yet
        addi    r1, r1, 4
```

After, `addi` fills that cycle and there is no stall:

```asm
loop:   lw      r2, 0(r1)
        addi    r1, r1, 4
        add     r3, r3, r2      ; r2 arrives by forwarding
```

The example `02-suma-vector.s` shows it with numbers, and the examples `17-daxpy.s` and `18-daxpy-desenrollado.s` take the idea further: unrolling a loop to have more independent instructions to interleave.

## Beyond one instruction per cycle

DLX fetches at most one instruction per cycle, so its CPI never goes below 1. **SuperDLX** fetches and runs several per cycle and out of order, with register renaming, a reorder buffer (ROB) and branch prediction: [SuperDLX](../superdlx.en.md).

To go deeper, the [WinDLX manual](../manual-simulador-dlx.md) (in Spanish) explains the pipeline in full detail, and the assembly and the exact rules THUMDER follows are in [The simulator inside](../simulador.en.md).
