# Files and editor

Your programs live in the **File manager** and are written in the **Editor**. Both are in the **IDE** group of the side menu.

## The file manager

At the root there are always two folders of THUMDER, read only:

| Folder | What it has |
| :-- | :-- |
| **ejemplos** | 20 commented DLX programs, from "Hello, world" to an unrolled DAXPY, and in `ejemplos/superdlx` five for SuperDLX. They are explained in [Commented examples](../ejemplos-dlx.en.md). |
| **ejercicios** | The programs of the [guided exercises](ejercicios.en.md). |

Next to them are your files. The first time there are two classic WinDLX programs to start with: `prim.s` and `win-dlx.s`.

### What you can do

| To | Do |
| :-- | :-- |
| Open a program | Double click or <kbd>Enter</kbd> |
| Create a program or a folder | **New → DLX program (.s)** or **New folder** |
| Import programs | **Import**, or drop the files on the list. It takes `.s`, `.txt` and `.zip` |
| Download | **Download**: a file as it is, or several or a folder in a `.zip`. **Download everything (.zip)** saves all your files |
| Select several | <kbd>Ctrl</kbd>+click |
| Rename | <kbd>F2</kbd> |
| Delete | <kbd>Delete</kbd>. It cannot be undone |
| Move | Drag the item to a folder, or to the path above to move it up |

Each row also has a menu of actions with all of the above.

### The copies of the examples

The programs of THUMDER cannot be changed. If you edit one and save, a copy is created in **mis ejemplos** (or **mis ejercicios**), and from then on you work with your copy. You can also copy a program or a whole folder with **Copy to my files**.

### Where they are kept

Without an account, in the browser or on the device (the file manager says "In this browser" or "On this device"). If you clear the data of the site, they are lost: download first what you want to keep. With an account, they are synchronised with the cloud and you have them on all your devices ([Account and privacy](cuenta.en.md)).

## The editor

The editor is the one of Visual Studio Code (Monaco), with what DLX assembler needs:

- **Highlighting** of instructions, registers, labels, directives and comments.
- **Autocompletion** of the instructions, with an example of their operands.
- **Help on hover** over an instruction: its syntax and what it does.
- **Errors at once**: the simplest ones are marked while you type; the rest, when the program is loaded.

### Saving

<kbd>Ctrl</kbd>+<kbd>S</kbd> saves. While there are changes not saved, the title of the editor says **Not saved**.

> The simulation uses the **saved** version of the file. If you load with changes not saved, THUMDER warns you: save and load again.

With **Auto save** on (in the [settings](configuracion.en.md)), the file is saved when you leave the editor.

### While simulating

Each instruction in the machine has a label with its stage, and its line is coloured. In SuperDLX, the label is its state: in the queue, in the window, in its unit, done, committed... The editor follows the instruction just fetched. More in [Simulate a program](simular.en.md).

### Tools of the program

Under the editor, in **Tools and problems of the program**:

| Tool | What it is for |
| :-- | :-- |
| **Problems** | The errors and warnings of the assembly, with their line. Press one to go to it |
| **Modules** | The other `.s` files of the same folder that are assembled with the program, as "Load Code or Data" of WinDLX. By default, those that define with `.global` the missing symbols |
| **Symbols** | The labels of the program with their address, after loading |
| **Breakpoints** | The stage where each breakpoint stops and the memory that is watched ([Simulate a program](simular.en.md#breakpoints)) |
| **Share** | A link with the program as an exercise ([Exercises](ejercicios.en.md#share-an-exercise)) |

## A minimal program

```asm
        .data
msg:    .asciiz "Hello, DLX\n"
        .align  2
args:   .word   msg

        .text
        .global main
main:   addi    r14, r0, args   ; R14 points to the parameters of the trap
        trap    5               ; printf
        trap    0               ; end of the program
```

The code starts at address `0x100` and the data at `0x1000`. Execution starts at `main` if there is one. All the instructions are in [The instruction table](../../DLX-TABLE-Instructions.md).
