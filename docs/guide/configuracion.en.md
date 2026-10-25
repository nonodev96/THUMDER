# Settings

The machine you simulate is set in **Config**, at the end of the side menu. Each option explains there what it does.

> Changing the machine loads the program again and the simulation going on is lost: THUMDER asks you before saving. **Default values** puts everything back as it came.

## Architecture

**DLX** or **SuperDLX**. It can also be chosen in the top bar. Programs end the same in both: only the cycles change.

## Pipeline (DLX)

| Option | What it does | Default |
| :-- | :-- | :-- |
| **Forwarding** | An instruction gets the result of the previous one as soon as it is computed, without waiting for it to be written in the registers. Without forwarding, each data dependency costs up to two more cycles (`R-Stall`) | On |
| **Floating point units** | How many units there are for additions, multiplications and divisions (1 to 8) and how many cycles each operation takes (1 to 50). The units are not pipelined: with only one, a second operation waits for the first to finish (`S-Stall`) | 1 of each; 2, 5 and 19 cycles |

Try the same program with and without forwarding, or with more units: the **With and without forwarding** tab of the statistics makes the first comparison for you.

## SuperDLX

The parameters of the `MACHINE` file of WinSuperDLX:

- **Ready-made machines**: the one of WinSuperDLX (default), a **scalar** one (one instruction per cycle, to see what being superscalar brings) and a **very wide** one (eight per cycle).
- **Instructions per cycle**: how many are fetched, decoded and committed.
- **Queues and buffers**: the size of the instruction queue, the ROBs, the windows, the load and store buffers and the BTB.
- **Branch prediction**: without it, fetch stops at each branch until it is resolved.
- **Data memory**: the cycles of an access and how many accesses there are per cycle.
- **Functional units**, integer and floating point: how many there are and their latency.

All the values and their limits are in [SuperDLX](../superdlx.en.md#the-parameters).

## Memory

**Memory size**, in bytes: from 512 to 1,048,576 and a multiple of 8. By default, 32,768. The code starts at `0x100` and the data at `0x1000`.

## Simulation

| Option | What it does |
| :-- | :-- |
| **Time between cycles (milliseconds)** | The pause between a cycle and the next one when running (<kbd>F9</kbd>). With 0, as fast as possible. By default, 250. It is also chosen in the speed menu |
| **History of the cycle clock diagram** | How many cycles the diagram keeps, from 100 to 100,000 (by default, 2,000). A long history makes long programs use more memory |

## Editor

**Auto save** (on by default): when you leave the editor, it saves the file and its breakpoints. Without it, the changes not saved and the breakpoints are lost when you leave.

## Multi view

Which windows the multiview shows and in which column. They are ordered by dragging them by their handle.

## Sound

Turns the sound of the simulation on, chooses whether each stage sounds or only the events (program loaded, errors, breakpoint, console input and end), and the volume. **Try the sound** lets you hear it first.

## What is not in Config

- **The language** (Spanish or English) and **the theme** (light, dark or the one of the system) are chosen in the top bar.
- **Privacy**: **Privacy settings**, at the bottom of every page ([Account and privacy](cuenta.en.md)).

The settings are kept on the device, not in the account.
