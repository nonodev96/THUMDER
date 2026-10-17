// What an instruction does, explained for the code window: a formula (R3 ← R1 + R2), the explanation in words (which
// registers it reads, which operation, which address of the memory, where it jumps), what each stage of the pipeline
// does with it and the fields of its word. Pure TypeScript, in Spanish and in English, with the semantics of cpu.ts.
import { type Decoded, decode, registerUse } from "@core/engine/isa";

export type DescriptionLang = "es" | "en";

export type DescriptionContext = {
  /** The address of the instruction (for the targets of branches and the return address of JAL) */
  address: number;
  /** The labels of the program, by address: the targets and the data are named with them */
  labels?: ReadonlyMap<number, string>;
  lang?: DescriptionLang;
};

/** A field of the word of the instruction */
export type InstructionField = { name: string; bits: string; meaning: string };

export type InstructionDescription = {
  /** The operation as a formula: R3 ← R1 + R2 */
  summary: string;
  /** What it does, in words */
  text: string;
  /** What each stage of the pipeline does with it */
  stages: { stage: string; text: string }[];
  /** The format (R, F, I or J) and its fields */
  format: string;
  fields: InstructionField[];
};

const ZERO_EXTENDED = new Set(["ADDUI", "SUBUI", "ANDI", "ORI", "XORI", "SEQUI", "SNEUI", "SLTUI", "SGTUI", "SLEUI", "SGEUI"]);

const hex = (value: number, digits = 8) => `0x${(value >>> 0).toString(16).toUpperCase().padStart(digits, "0")}`;
const R = (n: number) => `R${n}`;
const F = (n: number) => `F${n}`;
/** A floating point operand: one register, or the pair of a double (F2:F3) */
const FP = (n: number, isDouble: boolean) => (isDouble ? `F${n}:F${n + 1}` : `F${n}`);
/** A displacement added to a base: R1 + 8, R1 - 8, R1 */
const plus = (base: string, value: number) => (value === 0 ? base : value < 0 ? `${base} - ${-value}` : `${base} + ${value}`);

const COMPARISONS: Record<string, string> = { EQ: "=", NE: "≠", LT: "<", GT: ">", LE: "≤", GE: "≥" };

const TEXTS = {
  es: {
    formats: { R: "Tipo R (registro-registro)", F: "Tipo F (coma flotante)", I: "Tipo I (inmediato)", J: "Tipo J (salto)" },
    unused: "sin uso",
    immediate: "inmediato",
    offset: "desplazamiento",
    func: "función",
    nop: "No hace nada: pasa por el pipeline sin leer ni escribir registros ni memoria.",
    nopSummary: "nada",
    signed: "con signo",
    unsigned: "sin signo",
    words: {
      EQ: "igual a",
      NE: "distinto de",
      LT: "menor que",
      GT: "mayor que",
      LE: "menor o igual que",
      GE: "mayor o igual que",
    } as Record<string, string>,
    overflow: "Es una operación de 32 bits: si el resultado no cabe, se queda con sus 32 bits bajos (no hay excepción por desbordamiento).",
    zero: "R0 vale siempre 0: el resultado se descarta.",
    signedImmediate: (value: number) => `el inmediato ${value} (16 bits, extendido con su signo a 32)`,
    zeroImmediate: (value: number) => `el inmediato ${hex(value, 4)} (${value}; 16 bits, extendido con ceros)`,
    add: (a: string, b: string, d: string, u: boolean, immediate: boolean) =>
      immediate
        ? `Suma a ${a} ${b} y guarda el resultado en ${d}.`
        : `Suma ${a} y ${b} (enteros ${u ? "sin signo" : "con signo"}) y guarda el resultado en ${d}.`,
    sub: (a: string, b: string, d: string, u: boolean, immediate: boolean) =>
      immediate
        ? `Resta a ${a} ${b} y guarda el resultado en ${d}.`
        : `Resta ${b} a ${a} (enteros ${u ? "sin signo" : "con signo"}) y guarda el resultado en ${d}.`,
    constant: (d: string, value: string) => `Como R0 vale siempre 0, ${d} recibe ${value}: así se carga una constante de 16 bits.`,
    logic: (op: string, a: string, b: string, d: string) =>
      `Hace la operación ${op} bit a bit entre ${a} y ${b} y guarda el resultado en ${d}.`,
    shift: (kind: "SLL" | "SRL" | "SRA", a: string, n: string, d: string) =>
      kind === "SLL"
        ? `Desplaza ${a} a la izquierda ${n}, entrando ceros por la derecha (multiplica por 2^n), y guarda el resultado en ${d}.`
        : kind === "SRL"
          ? `Desplaza ${a} a la derecha ${n}, entrando ceros por la izquierda (desplazamiento lógico), y guarda el resultado en ${d}.`
          : `Desplaza ${a} a la derecha ${n}, copiando el bit de signo (desplazamiento aritmético: divide entre 2^n redondeando hacia abajo), y guarda el resultado en ${d}.`,
    shiftRegister: (b: string) => `tantos bits como indican los 5 bits bajos de ${b} (de 0 a 31)`,
    shiftImmediate: (n: number) => `${n} ${n === 1 ? "bit" : "bits"}`,
    compare: (a: string, word: string, b: string, d: string, u: boolean) =>
      `Compara ${a} con ${b} como enteros ${u ? "sin signo" : "con signo"}: si ${a} es ${word} ${b}, ${d} vale 1; si no, 0.`,
    mult: (a: string, b: string, d: string, u: boolean) =>
      `Multiplica los enteros ${u ? "sin signo" : "con signo"} ${a} y ${b} y guarda en ${d} los 32 bits bajos del producto. En DLX la multiplicación de enteros se hace en la unidad de multiplicación de coma flotante.`,
    div: (a: string, b: string, d: string, u: boolean) =>
      `Divide ${a} entre ${b} (enteros ${u ? "sin signo" : "con signo"}) y guarda en ${d} el cociente, truncado hacia cero. Dividir entre 0 detiene la simulación con un error. En DLX la división de enteros se hace en la unidad de división de coma flotante.`,
    lhi: (value: number, d: string) =>
      `Pone el inmediato ${hex(value, 4)} en los 16 bits altos de ${d} y los 16 bajos a 0: ${d} = ${hex(value << 16)}. Con ORI se completan después los 16 bits bajos (así se carga una constante de 32 bits).`,
    sizes: { 1: "1 byte", 2: "2 bytes (media palabra)", 4: "4 bytes (una palabra)", 8: "8 bytes (una doble palabra)" } as Record<
      number,
      string
    >,
    load: (size: string, where: string, d: string, extension: "signed" | "zero" | "none") =>
      `Lee ${size} de la memoria, en la dirección ${where}, ${extension === "signed" ? "los extiende con su signo a 32 bits " : extension === "zero" ? "los extiende con ceros a 32 bits " : ""}y los guarda en ${d}.`,
    fload: (size: string, where: string, d: string, isDouble: boolean) =>
      isDouble
        ? `Lee ${size} de la memoria, en la dirección ${where}: un número de doble precisión, que guarda en el par ${d} (el primer registro, los 4 bytes de la dirección; el segundo, los 4 siguientes).`
        : `Lee ${size} de la memoria, en la dirección ${where}: un número de simple precisión, que guarda en ${d} sin convertirlo.`,
    store: (what: string, where: string) => `Escribe ${what} en la memoria, en la dirección ${where}.`,
    storeWhat: {
      1: (s: string) => `el byte bajo (8 bits) de ${s}`,
      2: (s: string) => `los 16 bits bajos de ${s}`,
      4: (s: string) => `la palabra (32 bits) de ${s}`,
    } as Record<number, (s: string) => string>,
    fstoreWhat: (s: string, isDouble: boolean) =>
      isDouble ? `los 8 bytes del par ${s} (doble precisión)` : `los 4 bytes de ${s} (simple precisión)`,
    base: (base: string, displacement: number) => `${plus(base, displacement)} (la base más el desplazamiento, extendido con su signo)`,
    absolute: (address: string) => `${address} (la base es R0, que vale 0)`,
    branch: (condition: string, target: string, next: string, imm: number) =>
      `Si ${condition}, salta a ${target}; si no, sigue con la instrucción siguiente (${next}). El destino es relativo a la instrucción siguiente: PC + 4 ${imm < 0 ? "-" : "+"} ${Math.abs(imm)}. THUMDER lo resuelve en ID y supone que no se salta: si se salta, se anula la instrucción que ya se había leído.`,
    zeroCondition: (s: string, equal: boolean) => `${s} ${equal ? "vale 0" : "no vale 0"}`,
    fpsrCondition: (set: boolean): string =>
      set
        ? "el bit FPSR vale 1 (la última comparación de coma flotante fue cierta)"
        : "el bit FPSR vale 0 (la última comparación de coma flotante fue falsa)",
    jump: (target: string, offset: number) =>
      `Salta siempre a ${target}. El destino es relativo a la instrucción siguiente: PC + 4 ${offset < 0 ? "-" : "+"} ${Math.abs(offset)}.`,
    jal: (back: string, target: string) =>
      `Guarda en R31 la dirección de vuelta (${back}) y salta a ${target}: es la llamada a una subrutina, que vuelve con JR R31.`,
    jr: (s: string) =>
      `Salta a la dirección que hay en ${s}.${s === "R31" ? " Con R31 vuelve de una subrutina llamada con JAL o JALR." : ""}`,
    jalr: (back: string, s: string) =>
      `Guarda en R31 la dirección de vuelta (${back}) y salta a la dirección que hay en ${s}: llama a una subrutina cuya dirección se calcula al ejecutar.`,
    rfe: "Vuelve de una excepción (Return From Exception). THUMDER no tiene excepciones: detiene la simulación con un error.",
    traps: {
      0: "Termina el programa: la simulación se para cuando acaban las instrucciones anteriores.",
      1: "Abre un fichero (open). En THUMDER no hay ficheros: escribe un aviso en la consola y devuelve -1 en R1.",
      2: "Cierra un fichero (close): el primer parámetro es el descriptor; devuelve 0 en R1 para la entrada y las salidas (0, 1 y 2) y -1 para los demás.",
      3: "Lee de la entrada (read): los parámetros son el descriptor (0, la consola), la dirección del búfer y el número máximo de bytes. Copia la línea escrita al búfer y devuelve en R1 los bytes leídos; si no hay ninguna, espera a que la escribas en la consola.",
      4: "Escribe en la consola (write): los parámetros son el descriptor (1, la salida, o 2, los errores), la dirección del texto y su número de bytes; devuelve en R1 los bytes escritos.",
      5: "Escribe un texto con formato (printf): el primer parámetro es la dirección de la cadena de formato (%d, %u, %x, %c, %s, %f...) y los siguientes, sus valores (los dobles ocupan 8 bytes). Devuelve en R1 la longitud del texto.",
    } as Record<number, string>,
    trapSummaries: { 0: "fin del programa", 1: "open()", 2: "close()", 3: "read()", 4: "write()", 5: "printf()" } as Record<number, string>,
    trapUnknown: (n: number) => `El trap ${n} no existe en DLX: detiene la simulación con un error.`,
    trapParameters:
      "Los parámetros están en la memoria, a partir de la dirección que hay en R14 (R14, R14 + 4, R14 + 8...), y el resultado va a R1.",
    fpOps: { ADD: "Suma", SUB: "Resta", MULT: "Multiplica", DIV: "Divide" } as Record<string, string>,
    fpArith: (op: string, a: string, b: string, d: string, isDouble: boolean, mnemonic: string) => {
      const kind = isDouble ? "de doble precisión (64 bits)" : "de simple precisión (32 bits)";
      if (mnemonic.startsWith("SUB")) return `Resta ${b} a ${a}, números ${kind}, y guarda el resultado en ${d}.`;
      if (mnemonic.startsWith("DIV"))
        return `Divide ${a} entre ${b}, números ${kind}, y guarda el resultado en ${d}. Dividir entre 0 da ±Infinito (o NaN si ${a} también es 0), como dice IEEE 754.`;
      return `${op} los números ${kind} ${a} y ${b} y guarda el resultado en ${d}, redondeado según IEEE 754.`;
    },
    fcmp: (a: string, word: string, b: string, isDouble: boolean) =>
      `Compara ${a} con ${b} (números de ${isDouble ? "doble" : "simple"} precisión): si ${a} es ${word} ${b}, pone el bit FPSR a 1; si no, a 0. Después, BFPT y BFPF saltan según FPSR.`,
    convert: {
      CVTF2D: (s: string, d: string) =>
        `Convierte el número de simple precisión de ${s} a doble precisión y lo guarda en ${d} (sin perder precisión).`,
      CVTD2F: (s: string, d: string) =>
        `Convierte el número de doble precisión de ${s} a simple precisión (redondeando al más cercano) y lo guarda en ${d}.`,
      CVTF2I: (s: string, d: string) =>
        `Convierte el número de simple precisión de ${s} en un entero de 32 bits con signo (trunca los decimales; NaN da 0 y lo que no cabe se satura) y lo guarda en ${d}. Para usarlo como entero, se mueve después con MOVFP2I.`,
      CVTD2I: (s: string, d: string) =>
        `Convierte el número de doble precisión de ${s} en un entero de 32 bits con signo (trunca los decimales; NaN da 0 y lo que no cabe se satura) y lo guarda en ${d}. Para usarlo como entero, se mueve después con MOVFP2I.`,
      CVTI2F: (s: string, d: string) =>
        `Toma ${s} como un entero de 32 bits con signo y lo convierte a simple precisión en ${d}. El entero suele llegar a ${s} con MOVI2FP.`,
      CVTI2D: (s: string, d: string) =>
        `Toma ${s} como un entero de 32 bits con signo y lo convierte a doble precisión en ${d} (sin perder precisión). El entero suele llegar a ${s} con MOVI2FP.`,
    } as Record<string, (s: string, d: string) => string>,
    move: {
      MOVF: (s: string, d: string) => `Copia ${s} en ${d} (un número de simple precisión).`,
      MOVD: (s: string, d: string) => `Copia el par ${s} en ${d} (un número de doble precisión).`,
      MOVFP2I: (s: string, d: string) => `Copia los 32 bits de ${s} en el registro entero ${d}, sin convertirlos.`,
      MOVI2FP: (s: string, d: string) => `Copia los 32 bits de ${s} en el registro de coma flotante ${d}, sin convertirlos.`,
    } as Record<string, (s: string, d: string) => string>,
    units: {
      int: "intEX, la unidad de enteros",
      fadd: "faddEX, la unidad de suma de coma flotante",
      fmul: "fmultEX, la unidad de multiplicación",
      fdiv: "fdivEX, la unidad de división",
    },
    stageIF: (address: string, next: string) => `Se lee la instrucción de la dirección ${address} y PC pasa a ${next}.`,
    stageID: (reads: string, count: number) =>
      count ? `Se decodifica y se ${count === 1 ? "lee" : "leen"} ${reads}.` : "Se decodifica; no lee ningún registro.",
    stageIDControl: (reads: string, count: number) =>
      `Se decodifica${count ? `, se ${count === 1 ? "lee" : "leen"} ${reads}` : ""} y se decide el salto: si se salta, PC pasa al destino.`,
    stageEX: (unit: string, what: string) => `En ${unit}: ${what}`,
    stageEXLatency: "tarda los ciclos que tenga esa unidad en la configuración.",
    stageEXAddress: (where: string) => `se calcula la dirección ${where}.`,
    stageEXOperation: (summary: string) => `se calcula ${summary}.`,
    stageEXNothing: "no hay nada que calcular.",
    stageEXTrap: "se pide el servicio al sistema cuando terminan las instrucciones anteriores.",
    stageMEMRead: (size: string) => `Se leen ${size} de la memoria.`,
    stageMEMWrite: (size: string) => `Se escriben ${size} en la memoria.`,
    stageMEMNothing: "No accede a la memoria.",
    stageWB: (writes: string, count: number) =>
      count ? `Se ${count === 1 ? "escribe" : "escriben"} ${writes}.` : "No escribe ningún registro.",
    and: " y ",
    if: "si",
    label: (name: string) => `«${name}»`,
  },
  en: {
    formats: { R: "R-type (register-register)", F: "F-type (floating point)", I: "I-type (immediate)", J: "J-type (jump)" },
    unused: "unused",
    immediate: "immediate",
    offset: "offset",
    func: "function",
    nop: "Does nothing: it goes through the pipeline without reading or writing registers or memory.",
    nopSummary: "nothing",
    signed: "signed",
    unsigned: "unsigned",
    words: {
      EQ: "equal to",
      NE: "not equal to",
      LT: "less than",
      GT: "greater than",
      LE: "less than or equal to",
      GE: "greater than or equal to",
    } as Record<string, string>,
    overflow: "It is a 32-bit operation: if the result does not fit, it keeps its low 32 bits (there is no overflow exception).",
    zero: "R0 is always 0: the result is discarded.",
    signedImmediate: (value: number) => `the immediate ${value} (16 bits, sign-extended to 32)`,
    zeroImmediate: (value: number) => `the immediate ${hex(value, 4)} (${value}; 16 bits, zero-extended)`,
    add: (a: string, b: string, d: string, u: boolean, immediate: boolean) =>
      immediate
        ? `Adds ${b} to ${a} and puts the result in ${d}.`
        : `Adds ${a} and ${b} (${u ? "unsigned" : "signed"} integers) and puts the result in ${d}.`,
    sub: (a: string, b: string, d: string, u: boolean, immediate: boolean) =>
      immediate
        ? `Subtracts ${b} from ${a} and puts the result in ${d}.`
        : `Subtracts ${b} from ${a} (${u ? "unsigned" : "signed"} integers) and puts the result in ${d}.`,
    constant: (d: string, value: string) => `As R0 is always 0, ${d} gets ${value}: this is how a 16-bit constant is loaded.`,
    logic: (op: string, a: string, b: string, d: string) => `Computes the bitwise ${op} of ${a} and ${b} and puts the result in ${d}.`,
    shift: (kind: "SLL" | "SRL" | "SRA", a: string, n: string, d: string) =>
      kind === "SLL"
        ? `Shifts ${a} left ${n}, filling with zeros from the right (multiplies by 2^n), and puts the result in ${d}.`
        : kind === "SRL"
          ? `Shifts ${a} right ${n}, filling with zeros from the left (logical shift), and puts the result in ${d}.`
          : `Shifts ${a} right ${n}, copying the sign bit (arithmetic shift: divides by 2^n rounding down), and puts the result in ${d}.`,
    shiftRegister: (b: string) => `by the low 5 bits of ${b} (0 to 31)`,
    shiftImmediate: (n: number) => `${n} ${n === 1 ? "bit" : "bits"}`,
    compare: (a: string, word: string, b: string, d: string, u: boolean) =>
      `Compares ${a} with ${b} as ${u ? "unsigned" : "signed"} integers: if ${a} is ${word} ${b}, ${d} becomes 1; otherwise 0.`,
    mult: (a: string, b: string, d: string, u: boolean) =>
      `Multiplies the ${u ? "unsigned" : "signed"} integers ${a} and ${b} and puts the low 32 bits of the product in ${d}. In DLX, integer multiplication runs in the floating point multiplication unit.`,
    div: (a: string, b: string, d: string, u: boolean) =>
      `Divides ${a} by ${b} (${u ? "unsigned" : "signed"} integers) and puts the quotient, truncated towards zero, in ${d}. Dividing by 0 stops the simulation with an error. In DLX, integer division runs in the floating point division unit.`,
    lhi: (value: number, d: string) =>
      `Puts the immediate ${hex(value, 4)} in the high 16 bits of ${d} and zeros in the low 16: ${d} = ${hex(value << 16)}. An ORI then fills the low 16 bits (this is how a 32-bit constant is loaded).`,
    sizes: { 1: "1 byte", 2: "2 bytes (a half word)", 4: "4 bytes (a word)", 8: "8 bytes (a double word)" } as Record<number, string>,
    load: (size: string, where: string, d: string, extension: "signed" | "zero" | "none") =>
      `Reads ${size} from memory at address ${where}, ${extension === "signed" ? "sign-extends them to 32 bits " : extension === "zero" ? "zero-extends them to 32 bits " : ""}and puts them in ${d}.`,
    fload: (size: string, where: string, d: string, isDouble: boolean) =>
      isDouble
        ? `Reads ${size} from memory at address ${where}: a double precision number, which goes to the pair ${d} (the first register gets the 4 bytes at the address; the second, the next 4).`
        : `Reads ${size} from memory at address ${where}: a single precision number, which goes to ${d} unconverted.`,
    store: (what: string, where: string) => `Writes ${what} to memory at address ${where}.`,
    storeWhat: {
      1: (s: string) => `the low byte (8 bits) of ${s}`,
      2: (s: string) => `the low 16 bits of ${s}`,
      4: (s: string) => `the word (32 bits) of ${s}`,
    } as Record<number, (s: string) => string>,
    fstoreWhat: (s: string, isDouble: boolean) =>
      isDouble ? `the 8 bytes of the pair ${s} (double precision)` : `the 4 bytes of ${s} (single precision)`,
    base: (base: string, displacement: number) => `${plus(base, displacement)} (the base plus the sign-extended displacement)`,
    absolute: (address: string) => `${address} (the base is R0, which is 0)`,
    branch: (condition: string, target: string, next: string, imm: number) =>
      `If ${condition}, it jumps to ${target}; otherwise it goes on with the next instruction (${next}). The target is relative to the next instruction: PC + 4 ${imm < 0 ? "-" : "+"} ${Math.abs(imm)}. THUMDER resolves it in ID and predicts not taken: if it is taken, the instruction already fetched is aborted.`,
    zeroCondition: (s: string, equal: boolean) => `${s} ${equal ? "is 0" : "is not 0"}`,
    fpsrCondition: (set: boolean): string =>
      set
        ? "the FPSR bit is 1 (the last floating point comparison was true)"
        : "the FPSR bit is 0 (the last floating point comparison was false)",
    jump: (target: string, offset: number) =>
      `Always jumps to ${target}. The target is relative to the next instruction: PC + 4 ${offset < 0 ? "-" : "+"} ${Math.abs(offset)}.`,
    jal: (back: string, target: string) =>
      `Saves the return address (${back}) in R31 and jumps to ${target}: it calls a subroutine, which returns with JR R31.`,
    jr: (s: string) =>
      `Jumps to the address in ${s}.${s === "R31" ? " With R31 it returns from a subroutine called with JAL or JALR." : ""}`,
    jalr: (back: string, s: string) =>
      `Saves the return address (${back}) in R31 and jumps to the address in ${s}: it calls a subroutine whose address is computed at run time.`,
    rfe: "Returns from an exception (Return From Exception). THUMDER has no exceptions: it stops the simulation with an error.",
    traps: {
      0: "Ends the program: the simulation stops when the instructions before it finish.",
      1: "Opens a file (open). There are no files in THUMDER: it writes a warning to the console and returns -1 in R1.",
      2: "Closes a file (close): the first parameter is the descriptor; it returns 0 in R1 for the input and the outputs (0, 1 and 2) and -1 for the others.",
      3: "Reads from the input (read): the parameters are the descriptor (0, the console), the address of the buffer and the maximum number of bytes. It copies the line typed to the buffer and returns in R1 the bytes read; if there is none, it waits for you to type it in the console.",
      4: "Writes to the console (write): the parameters are the descriptor (1, the output, or 2, the errors), the address of the text and its number of bytes; it returns in R1 the bytes written.",
      5: "Writes a formatted text (printf): the first parameter is the address of the format string (%d, %u, %x, %c, %s, %f...) and the next ones, its values (doubles take 8 bytes). It returns in R1 the length of the text.",
    } as Record<number, string>,
    trapSummaries: { 0: "end of the program", 1: "open()", 2: "close()", 3: "read()", 4: "write()", 5: "printf()" } as Record<
      number,
      string
    >,
    trapUnknown: (n: number) => `Trap ${n} does not exist in DLX: it stops the simulation with an error.`,
    trapParameters: "The parameters are in memory, from the address in R14 (R14, R14 + 4, R14 + 8...), and the result goes to R1.",
    fpOps: { ADD: "Adds", SUB: "Subtracts", MULT: "Multiplies", DIV: "Divides" } as Record<string, string>,
    fpArith: (op: string, a: string, b: string, d: string, isDouble: boolean, mnemonic: string) => {
      const kind = isDouble ? "64-bit double precision" : "32-bit single precision";
      if (mnemonic.startsWith("SUB")) return `Subtracts ${b} from ${a} (${kind} numbers) and puts the result in ${d}.`;
      if (mnemonic.startsWith("DIV"))
        return `Divides ${a} by ${b} (${kind} numbers) and puts the result in ${d}. Dividing by 0 gives ±Infinity (or NaN if ${a} is also 0), as IEEE 754 says.`;
      return `${op} the ${kind} numbers ${a} and ${b} and puts the result in ${d}, rounded as IEEE 754 says.`;
    },
    fcmp: (a: string, word: string, b: string, isDouble: boolean) =>
      `Compares ${a} with ${b} (${isDouble ? "double" : "single"} precision numbers): if ${a} is ${word} ${b}, it sets the FPSR bit to 1; otherwise to 0. Then BFPT and BFPF jump depending on FPSR.`,
    convert: {
      CVTF2D: (s: string, d: string) =>
        `Converts the single precision number in ${s} to double precision and puts it in ${d} (without losing precision).`,
      CVTD2F: (s: string, d: string) =>
        `Converts the double precision number in ${s} to single precision (rounding to the nearest) and puts it in ${d}.`,
      CVTF2I: (s: string, d: string) =>
        `Converts the single precision number in ${s} to a signed 32-bit integer (it truncates the decimals; NaN gives 0 and what does not fit saturates) and puts it in ${d}. To use it as an integer, move it then with MOVFP2I.`,
      CVTD2I: (s: string, d: string) =>
        `Converts the double precision number in ${s} to a signed 32-bit integer (it truncates the decimals; NaN gives 0 and what does not fit saturates) and puts it in ${d}. To use it as an integer, move it then with MOVFP2I.`,
      CVTI2F: (s: string, d: string) =>
        `Takes ${s} as a signed 32-bit integer and converts it to single precision in ${d}. The integer usually reaches ${s} with MOVI2FP.`,
      CVTI2D: (s: string, d: string) =>
        `Takes ${s} as a signed 32-bit integer and converts it to double precision in ${d} (without losing precision). The integer usually reaches ${s} with MOVI2FP.`,
    } as Record<string, (s: string, d: string) => string>,
    move: {
      MOVF: (s: string, d: string) => `Copies ${s} to ${d} (a single precision number).`,
      MOVD: (s: string, d: string) => `Copies the pair ${s} to ${d} (a double precision number).`,
      MOVFP2I: (s: string, d: string) => `Copies the 32 bits of ${s} to the integer register ${d}, unconverted.`,
      MOVI2FP: (s: string, d: string) => `Copies the 32 bits of ${s} to the floating point register ${d}, unconverted.`,
    } as Record<string, (s: string, d: string) => string>,
    units: {
      int: "intEX, the integer unit",
      fadd: "faddEX, the floating point addition unit",
      fmul: "fmultEX, the multiplication unit",
      fdiv: "fdivEX, the division unit",
    },
    stageIF: (address: string, next: string) => `The instruction is fetched from address ${address} and PC becomes ${next}.`,
    stageID: (reads: string, count: number) =>
      count ? `It is decoded and ${reads} ${count === 1 ? "is" : "are"} read.` : "It is decoded; no register is read.",
    stageIDControl: (reads: string, count: number) =>
      `It is decoded${count ? `, ${reads} ${count === 1 ? "is" : "are"} read` : ""} and the jump is decided: if it is taken, PC becomes the target.`,
    stageEX: (unit: string, what: string) => `In ${unit}: ${what}`,
    stageEXLatency: "it takes the cycles of that unit in the configuration.",
    stageEXAddress: (where: string) => `the address ${where} is computed.`,
    stageEXOperation: (summary: string) => `${summary} is computed.`,
    stageEXNothing: "there is nothing to compute.",
    stageEXTrap: "the service is requested when the instructions before it finish.",
    stageMEMRead: (size: string) => `${size} are read from memory.`,
    stageMEMWrite: (size: string) => `${size} are written to memory.`,
    stageMEMNothing: "It does not access memory.",
    stageWB: (writes: string, count: number) => (count ? `${writes} ${count === 1 ? "is" : "are"} written.` : "No register is written."),
    and: " and ",
    if: "if",
    label: (name: string) => `"${name}"`,
  },
};

type Texts = (typeof TEXTS)["es"];

const LOAD_SIZES: Record<string, { bytes: number; extension: "signed" | "zero" | "none" }> = {
  LB: { bytes: 1, extension: "signed" },
  LBU: { bytes: 1, extension: "zero" },
  LH: { bytes: 2, extension: "signed" },
  LHU: { bytes: 2, extension: "zero" },
  LW: { bytes: 4, extension: "none" },
  LF: { bytes: 4, extension: "none" },
  LD: { bytes: 8, extension: "none" },
};
const STORE_SIZES: Record<string, number> = { SB: 1, SH: 2, SW: 4, SF: 4, SD: 8 };

/** The explanation of a word of the memory, or null if it is not an instruction */
export function describeWord(word: number, context: DescriptionContext): InstructionDescription | null {
  const decoded = decode(word);
  return decoded ? describe(decoded, context) : null;
}

export function describe(decoded: Decoded, context: DescriptionContext): InstructionDescription {
  const t: Texts = TEXTS[context.lang ?? "es"];
  const { def, rs1, rs2, rd, imm, offset } = decoded;
  const m = def.mnemonic;
  const doubles = def.doubles ?? [];
  const labels = context.labels ?? new Map<number, string>();
  /** An address, with its label if it has one */
  const named = (address: number) => {
    const label = labels.get(address >>> 0);
    return label ? `${hex(address)} ${t.label(label)}` : hex(address);
  };
  const next = (context.address + 4) >>> 0;
  const unsigned = /U(I)?$/.test(m) && m !== "LHU" && m !== "LBU";
  const extended = ZERO_EXTENDED.has(m) ? imm & 0xffff : imm;
  const immediateText = ZERO_EXTENDED.has(m) ? t.zeroImmediate(extended) : t.signedImmediate(extended);
  const immediateShort = ZERO_EXTENDED.has(m) ? hex(extended, 4) : `${extended}`;

  let summary = "";
  let text = "";
  /** What EX computes (a formula), or what it does (a sentence) */
  let ex = "";
  let memory: { read?: number; write?: number } = {};
  const notes: string[] = [];

  // Integer register-register and register-immediate operations
  const alu = (d: string, a: string, b: string, bText: string, immediate: boolean) => {
    const op = immediate ? m.replace(/U?I$/, "") : m.replace(/U$/, "");
    const kind = ["SEQ", "SNE", "SLT", "SGT", "SLE", "SGE"].includes(op) ? "compare" : op;
    switch (kind) {
      case "ADD":
        summary = `${d} ← ${a} + ${b}`;
        text = `${t.add(a, immediate ? bText : b, d, unsigned, immediate)} ${t.overflow}`;
        if (immediate && a === "R0") notes.push(t.constant(d, b));
        break;
      case "SUB":
        summary = `${d} ← ${a} - ${b}`;
        text = `${t.sub(a, immediate ? bText : b, d, unsigned, immediate)} ${t.overflow}`;
        break;
      case "AND":
      case "OR":
      case "XOR":
        summary = `${d} ← ${a} ${kind} ${b}`;
        text = t.logic(kind, a, immediate ? bText : b, d);
        if (immediate && a === "R0" && kind !== "AND") notes.push(t.constant(d, b));
        break;
      case "SLL":
      case "SRL":
      case "SRA": {
        const symbol = kind === "SLL" ? "<<" : kind === "SRL" ? ">>>" : ">>";
        const amount = immediate ? `${extended & 31}` : b;
        summary = `${d} ← ${a} ${symbol} ${amount}`;
        text = t.shift(kind, a, immediate ? t.shiftImmediate(extended & 31) : t.shiftRegister(b), d);
        break;
      }
      case "compare": {
        const relation = op.slice(1, 3);
        summary = `${d} ← (${a} ${COMPARISONS[relation]} ${b}) ? 1 : 0`;
        text = t.compare(a, t.words[relation], immediate ? bText : b, d, unsigned);
        break;
      }
      default:
        summary = m;
    }
    ex = t.stageEXOperation(summary.split(" ← ")[1] ?? summary);
  };

  switch (def.syntax) {
    case "none":
      if (m === "RFE") {
        summary = "RFE";
        text = t.rfe;
      } else {
        summary = t.nopSummary;
        text = t.nop;
      }
      ex = t.stageEXNothing;
      break;
    case "rrr":
      if (m.startsWith("MULT")) {
        summary = `${R(rd)} ← ${R(rs1)} × ${R(rs2)}`;
        text = t.mult(R(rs1), R(rs2), R(rd), m === "MULTU");
        ex = t.stageEXLatency;
      } else if (m.startsWith("DIV")) {
        summary = `${R(rd)} ← ${R(rs1)} ÷ ${R(rs2)}`;
        text = t.div(R(rs1), R(rs2), R(rd), m === "DIVU");
        ex = t.stageEXLatency;
      } else {
        alu(R(rd), R(rs1), R(rs2), R(rs2), false);
      }
      if (rd === 0) notes.push(t.zero);
      break;
    case "rri":
      alu(R(rs2), R(rs1), immediateShort, immediateText, true);
      if (rs2 === 0) notes.push(t.zero);
      break;
    case "ri":
      summary = `${R(rs2)} ← ${hex(imm & 0xffff, 4)} << 16`;
      text = t.lhi(imm & 0xffff, R(rs2));
      ex = t.stageEXOperation(`${hex(imm & 0xffff, 4)} << 16 = ${hex((imm & 0xffff) << 16)}`);
      if (rs2 === 0) notes.push(t.zero);
      break;
    case "load":
    case "fload": {
      const size = LOAD_SIZES[m];
      const isDouble = doubles.includes("d");
      const destination = def.syntax === "load" ? R(rs2) : FP(rs2, isDouble);
      const where = rs1 === 0 ? t.absolute(named(imm)) : t.base(R(rs1), imm);
      summary = `${destination} ← Mem[${rs1 === 0 ? named(imm) : plus(R(rs1), imm)}]`;
      text =
        def.syntax === "load"
          ? t.load(t.sizes[size.bytes], where, destination, size.extension)
          : t.fload(t.sizes[size.bytes], where, destination, isDouble);
      ex = t.stageEXAddress(rs1 === 0 ? hex(imm) : plus(R(rs1), imm));
      memory = { read: size.bytes };
      if (def.syntax === "load" && rs2 === 0) notes.push(t.zero);
      break;
    }
    case "store":
    case "fstore": {
      const bytes = STORE_SIZES[m];
      const isDouble = doubles.includes("d");
      const source = def.syntax === "store" ? R(rs2) : FP(rs2, isDouble);
      const where = rs1 === 0 ? t.absolute(named(imm)) : t.base(R(rs1), imm);
      summary = `Mem[${rs1 === 0 ? named(imm) : plus(R(rs1), imm)}] ← ${source}`;
      text = t.store(def.syntax === "store" ? t.storeWhat[bytes](source) : t.fstoreWhat(source, isDouble), where);
      ex = t.stageEXAddress(rs1 === 0 ? hex(imm) : plus(R(rs1), imm));
      memory = { write: bytes };
      break;
    }
    case "branch": {
      const target = (next + imm) >>> 0;
      const equal = m === "BEQZ";
      summary = `${t.if} ${R(rs1)} ${equal ? "=" : "≠"} 0: PC ← ${named(target)}`;
      text = t.branch(t.zeroCondition(R(rs1), equal), named(target), hex(next), imm);
      ex = t.stageEXNothing;
      break;
    }
    case "fbranch": {
      const target = (next + imm) >>> 0;
      const set = m === "BFPT";
      summary = `${t.if} FPSR = ${set ? 1 : 0}: PC ← ${named(target)}`;
      text = t.branch(t.fpsrCondition(set), named(target), hex(next), imm);
      ex = t.stageEXNothing;
      break;
    }
    case "jump": {
      const target = (next + offset) >>> 0;
      if (m === "JAL") {
        summary = `R31 ← ${hex(next)}; PC ← ${named(target)}`;
        text = t.jal(hex(next), named(target));
      } else {
        summary = `PC ← ${named(target)}`;
        text = t.jump(named(target), offset);
      }
      ex = t.stageEXNothing;
      break;
    }
    case "jreg":
      if (m === "JALR") {
        summary = `R31 ← ${hex(next)}; PC ← ${R(rs1)}`;
        text = t.jalr(hex(next), R(rs1));
      } else {
        summary = `PC ← ${R(rs1)}`;
        text = t.jr(R(rs1));
      }
      ex = t.stageEXNothing;
      break;
    case "trap": {
      const number = offset & 0x3ffffff;
      summary = `TRAP ${number}${t.trapSummaries[number] ? `: ${t.trapSummaries[number]}` : ""}`;
      text = t.traps[number] ?? t.trapUnknown(number);
      if (number > 0 && t.traps[number]) notes.push(t.trapParameters);
      ex = t.stageEXTrap;
      break;
    }
    case "fff": {
      const a = FP(rs1, doubles.includes("s1"));
      const b = FP(rs2, doubles.includes("s2"));
      const d = FP(rd, doubles.includes("d"));
      const op = m.replace(/[FD]$/, "");
      const symbol = { ADD: "+", SUB: "-", MULT: "×", DIV: "÷" }[op] ?? op;
      summary = `${d} ← ${a} ${symbol} ${b}`;
      text = t.fpArith(t.fpOps[op] ?? op, a, b, d, doubles.includes("d"), m);
      ex = t.stageEXLatency;
      break;
    }
    case "ff": {
      const s = FP(rs1, doubles.includes("s1"));
      const d = FP(rd, doubles.includes("d"));
      if (m === "MOVF" || m === "MOVD") {
        summary = `${d} ← ${s}`;
        text = t.move[m](s, d);
      } else {
        const to = { F: "float", D: "double", I: "int" }[m.slice(-1)] as string;
        summary = `${d} ← ${to}(${s})`;
        text = t.convert[m](s, d);
      }
      ex = t.stageEXOperation(summary.split(" ← ")[1]);
      break;
    }
    case "fcmp": {
      const isDouble = doubles.includes("s1");
      const a = FP(rs1, isDouble);
      const b = FP(rs2, isDouble);
      const relation = m.slice(0, 2);
      summary = `FPSR ← (${a} ${COMPARISONS[relation]} ${b}) ? 1 : 0`;
      text = t.fcmp(a, t.words[relation], b, isDouble);
      ex = t.stageEXLatency;
      break;
    }
    case "fr":
      summary = `${F(rd)} ← ${R(rs1)}`;
      text = t.move.MOVI2FP(R(rs1), F(rd));
      ex = t.stageEXOperation(R(rs1));
      break;
    case "rf":
      summary = `${R(rd)} ← ${F(rs1)}`;
      text = t.move.MOVFP2I(F(rs1), R(rd));
      ex = t.stageEXOperation(F(rs1));
      if (rd === 0) notes.push(t.zero);
      break;
  }

  // The stages, from the registers it reads and writes
  // (the trap 0 only ends the program: it neither reads its parameters nor leaves a result)
  const use = registerUse(decoded);
  const halts = def.syntax === "trap" && (offset & 0x3ffffff) === 0;
  const list = (names: string[]) =>
    names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")}${t.and}${names[names.length - 1]}`;
  const read = halts ? [] : [...use.intReads.map(R), ...use.fpReads.map(F), ...(use.readsFPSR ? ["FPSR"] : [])];
  const written = halts ? [] : [...use.intWrites.map(R), ...use.fpWrites.map(F), ...(use.writesFPSR ? ["FPSR"] : [])];
  const control = ["branch", "fbranch", "jump", "jreg"].includes(def.syntax);
  const stages = [
    { stage: "IF", text: t.stageIF(hex(context.address), hex(next)) },
    { stage: "ID", text: control ? t.stageIDControl(list(read), read.length) : t.stageID(list(read), read.length) },
    {
      stage: def.unit === "int" ? "EX" : { fadd: "faddEX", fmul: "fmultEX", fdiv: "fdivEX" }[def.unit],
      text: t.stageEX(t.units[def.unit], ex),
    },
    {
      stage: "MEM",
      text: memory.read ? t.stageMEMRead(t.sizes[memory.read]) : memory.write ? t.stageMEMWrite(t.sizes[memory.write]) : t.stageMEMNothing,
    },
    { stage: "WB", text: t.stageWB(list(written), written.length) },
  ];

  return { summary, text: [text, ...notes].join(" "), stages, format: t.formats[def.format], fields: fieldsOf(decoded, t) };
}

/** The fields of the word, with their bits and what they mean for this instruction */
function fieldsOf(decoded: Decoded, t: Texts): InstructionField[] {
  const { def, word, rs1, rs2, rd } = decoded;
  const bits = word.toString(2).padStart(32, "0");
  const doubles = def.doubles ?? [];
  const slice = (from: number, to: number) => bits.slice(from, to);
  const opcode = { name: "opcode", bits: slice(0, 6), meaning: hex(word >>> 26, 2) };
  const syntax = def.syntax;
  const register = (n: number, kind: "R" | "F" | "-", isDouble = false) =>
    kind === "-" ? t.unused : kind === "R" ? R(n) : FP(n, isDouble);
  switch (def.format) {
    case "R":
    case "F": {
      // What each register field names, by syntax: an integer register, a floating point one or nothing
      const kinds: Record<string, ["R" | "F" | "-", "R" | "F" | "-", "R" | "F" | "-"]> = {
        none: ["-", "-", "-"],
        rrr: ["R", "R", "R"],
        ff: ["F", "-", "F"],
        fff: ["F", "F", "F"],
        fcmp: ["F", "F", "-"],
        rf: ["F", "-", "R"],
        fr: ["R", "-", "F"],
      };
      const [first, second, third] = kinds[syntax] ?? ["-", "-", "-"];
      const fp = def.format === "F";
      return [
        opcode,
        { name: fp ? "fs1" : "rs1", bits: slice(6, 11), meaning: register(rs1, first, doubles.includes("s1")) },
        { name: fp ? "fs2" : "rs2", bits: slice(11, 16), meaning: register(rs2, second, doubles.includes("s2")) },
        { name: fp ? "fd" : "rd", bits: slice(16, 21), meaning: register(rd, third, doubles.includes("d")) },
        { name: t.func, bits: slice(21, 32), meaning: `${hex(word & 0x3f, 2)} ${def.mnemonic}` },
      ];
    }
    case "I": {
      const source: "R" | "-" = syntax === "fbranch" ? "-" : "R";
      const second: "R" | "F" | "-" = ["rri", "ri", "load", "store"].includes(syntax)
        ? "R"
        : ["fload", "fstore"].includes(syntax)
          ? "F"
          : "-";
      const role = syntax === "store" || syntax === "fstore" ? "rs2" : "rd";
      const usesImmediate = syntax !== "jreg";
      return [
        { ...opcode, meaning: `${opcode.meaning} ${def.mnemonic}` },
        { name: "rs1", bits: slice(6, 11), meaning: register(rs1, syntax === "ri" ? "-" : source) },
        { name: role, bits: slice(11, 16), meaning: register(rs2, second, doubles.includes("d")) },
        { name: t.immediate, bits: slice(16, 32), meaning: usesImmediate ? `${decoded.imm} (${hex(decoded.imm & 0xffff, 4)})` : t.unused },
      ];
    }
    case "J":
      return [
        { ...opcode, meaning: `${opcode.meaning} ${def.mnemonic}` },
        {
          name: def.syntax === "trap" ? "trap" : t.offset,
          bits: slice(6, 32),
          meaning: def.syntax === "none" ? t.unused : def.syntax === "trap" ? `${decoded.offset & 0x3ffffff}` : `${decoded.offset}`,
        },
      ];
  }
}
