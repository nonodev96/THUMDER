# Frequently asked questions

## Using THUMDER

### I changed the program, but the old one is simulated

The simulation uses the **saved** version of the file. Save (<kbd>Ctrl</kbd>+<kbd>S</kbd>) and load again (<kbd>Ctrl</kbd>+<kbd>F9</kbd>). If you load with changes not saved, THUMDER warns you.

### I cannot save an example

The folders **ejemplos** and **ejercicios** are read only. Saving one of their programs creates a copy in **mis ejemplos** (or **mis ejercicios**), and that copy is the one opened from then on.

### The program stops and does not go on

Look at the status bar, at the bottom:

- **Waiting for a line of the console**: the program ran a `trap 3`. Type the line in the console and press <kbd>Enter</kbd>.
- **Stopped at a breakpoint**: press **Run** or **Step** to go on.
- **With errors**: the program could not be assembled; the errors are in the **Problems** panel, under the editor.
- **Finished**: the program reached `trap 0`. Load it again to repeat it.

### The program fails while it runs

An address outside the memory, an access not aligned (a word must be at an address multiple of 4), an integer division by zero or a word that is not an instruction stop the simulation. THUMDER shows the error and the address. Check the `.align` directives and the addresses of your data, and the memory size in the settings.

### Why does this instruction stall?

In **Cycle Clock Diagram**, click the stall: THUMDER explains which data was missing, which instruction was producing it and whether forwarding would have avoided it. The kinds of stall are explained in [The DLX pipeline](pipeline.en.md#the-stalls-in-thumder).

### How do I start a program at a given address?

Execution starts at the label `main` if there is one and, if not, at the start of the code (`0x100`). `.text` and `.data` take an address (`.data 0x2000`).

### Can I use several files?

Yes. The symbols that a file declares with `.global` can be used by the others in the same folder. THUMDER adds only the ones needed, or you can choose them in **Tools of the program → Modules**. The example `20-media-entrada.s` uses `input.s` that way.

## Files and account

### Where are my files?

Without an account, in that browser or on that device. If you clear the data of the site or uninstall the application, they are lost: download them first (**Download everything (.zip)**). With an account, in the cloud too.

### How do I move my files to another computer?

Sign in with the same account on both. Without an account: **Download everything (.zip)** on one and **Import** the `.zip` on the other.

### Do I need an account?

No. Everything works without one; it only synchronises the files between devices ([Account and privacy](cuenta.en.md)).

## THUMDER and WinDLX

### Do my WinDLX programs work?

Yes: THUMDER uses the same assembler, the same directives, the same traps and the same instruction codes as WinDLX, and simulates the same pipeline. The few differences (for example, that execution starts at `main`) are in [The simulator inside](../simulador.en.md#6-differences-with-windlx).

### Are the results the same as in WinDLX?

The cycles and the stalls follow the rules of the WinDLX manual, and each rule has its test. Besides, each example is checked against a reference executor without a pipeline: the final state must be identical.

### Why does the same program take different times in DLX and in SuperDLX?

Because SuperDLX runs several instructions per cycle and out of order. The result of the program is the same; only the cycles change. The statistics of SuperDLX compare both.

## Technical problems

### The desktop application does not open: the system says it is not safe

It is not signed, because the certificates cost money. On Windows: **More info → Run anyway**. On macOS: right click → **Open**. More in [Install THUMDER](instalar.en.md).

### Something does not work as it should

Open an issue on [GitHub](https://github.com/nonodev96/THUMDER/issues) with the program, the settings and what you expected to happen. The **Debug** button, at the bottom of the page, shows the version and the route, which help to find the problem.
