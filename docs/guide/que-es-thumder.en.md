# What is THUMDER?

THUMDER (*THe UltiMate Dlx EmulatoR*) is a simulator of the **DLX** processor for learning how a pipeline works. You write a program in assembler, load it and watch, cycle by cycle, what each instruction does, which registers and which memory it changes, and why it stalls.

![The editor with the pipeline stage of each instruction](img/editor-stages.en.png)

## Who it is for

- **Students** of Computer Architecture or Computer Organisation: the examples, the exercises and the explanations of each view follow the classic syllabus (Hennessy and Patterson, WinDLX).
- **Teachers**: a program can be shared as an exercise with a link, with the configuration of the machine locked if needed.
- **Anyone curious** about what goes on inside a processor.

## What it simulates

| Architecture | What it is |
| :-- | :-- |
| **DLX** | The five-stage pipeline of WinDLX (IF, ID, EX, MEM and WB): one instruction per cycle, in order, with forwarding, stalls and floating point units. |
| **SuperDLX** | A superscalar DLX with out of order execution, as WinSuperDLX: several instructions per cycle, windows, ROB and branch prediction. |

The same program ends the same in both: only the cycles change. The architecture is chosen in the top bar.

## Where to use it

- **In the browser**, at <https://thumder.netlify.app>, with nothing to install.
- **On the desktop**: Windows, Linux and macOS.
- **On the phone**: Android (APK) and, on iPhone and iPad, in the browser.

Everything happens on your device: no account or server is needed. An account only keeps the same files on several devices. How to get each version: [Install THUMDER](instalar.en.md).

## Where to go next

1. [First steps](primeros-pasos.en.md): your first simulation in five minutes.
2. [Simulate a program](simular.en.md): the controls, the shortcuts and the breakpoints.
3. [The DLX pipeline](pipeline.en.md): the theory behind what you see.
