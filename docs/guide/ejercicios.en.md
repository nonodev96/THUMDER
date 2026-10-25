# Exercises

The exercises ask questions about a program, and THUMDER checks your answers with the simulation itself. They are in **Exercises**, in the **Machine** group of the side menu.

## Do a guided exercise

1. Open **Exercises** and choose one. Each card says its topic, how many questions it has and with which program.
2. Press **Start** (or **Continue**, if you had started it). The program opens with the configuration of the exercise, which stays **locked** while you do it.
3. Run the program to the end: **Run** (<kbd>F9</kbd>) or **To end** (<kbd>Shift</kbd>+<kbd>F9</kbd>).
4. Look at the cycle clock diagram and the statistics, and answer. **Check** says whether each answer is right.

If you get stuck, **Show the solutions** shows them. Your progress is kept on the device.

## The topics

| Topic | Programs | What you practise |
| :-- | :-- | :-- |
| **Data hazards** | `02-suma-vector.s`, with and without forwarding | RAW stalls and what forwarding saves |
| **Control hazards** | `03-maximo.s` | Taken branches and squashed instructions |
| **Structural hazards** | `18-daxpy-desenrollado.s` | A single multiplication unit for many operations |
| **Floating point** | `16-producto-escalar.s` | The floating point units and their latencies |
| **Loops and subroutines** | `05-factorial.s`, `14-factorial-recursivo.s` | A loop with a slow unit, recursion and the stack |
| **Memory** | `10-burbuja.s` | Sorting a vector in memory |
| **Superscalar (SuperDLX)** | The five of `ejemplos/superdlx` and `16-producto-escalar.s` | Parallelism, renaming, branch prediction, dependencies through memory, the ROB and DLX against SuperDLX |

The SuperDLX exercises lock the architecture and the machine (for example, the WinSuperDLX one against a scalar one, or with and without branch prediction). They are detailed in [SuperDLX](../superdlx.en.md#examples-and-exercises).

## Share an exercise

Any program can be shared as an exercise with a link, for example for a class:

1. Open the program in the editor and press **Share**, in the tools of the program.
2. Write a **statement** (optional) and choose what is **locked** while it is done: forwarding, the floating point units, the memory size or the architecture.
3. **Copy** copies the link.

The link carries the program and the configuration, without going through any server. Whoever opens it gets a copy in their folder **compartidos**, with the configuration of the exercise. If the program is very long, it does not fit in a link: share it as a file.

## Ideas to practise on your own

- Run an example with and without forwarding and compare the cycles.
- Reorder the instructions of `02-suma-vector.s` to remove its stalls ([Scheduling the code](pipeline.en.md#scheduling-the-code)).
- Run `17-daxpy.s` and `18-daxpy-desenrollado.s` with one and with four multiplication units.
- Run the same program in DLX and in SuperDLX, and compare the CPI with the IPC.
