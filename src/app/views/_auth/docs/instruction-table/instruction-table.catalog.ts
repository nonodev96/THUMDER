// The DLX instructions of the instruction table of the documentation, made from the definitions of the engine
// (engine/isa.ts): the table is exactly what THUMDER assembles and simulates. Each instruction has a category, a name,
// its syntax, its codes and an example, which describe() explains (formula, text, fields of the word, stages). Also the
// maps of the codes: the opcode and the function codes of the R and F types, in tables of 8 × 8. Pure TypeScript.
import { TEXT_START } from "@core/engine/assembler";
import { type DescriptionLang, describe, type InstructionDescription, type InstructionField } from "@core/engine/describe";
import { type Decoded, decode, encode, type Format, INSTRUCTIONS, type InstructionDef, registerUse, type Unit } from "@core/engine/isa";

/** What an instruction is for (the chips of the table) */
export const CATEGORIES = ["alu", "compare", "shift", "memory", "control", "float", "convert", "move", "other"] as const;
export type Category = (typeof CATEGORIES)[number];

/** A field of the word, with the bits it takes (31 is the highest) and what kind of field it is (its colour) */
export type WordField = InstructionField & {
  from: number;
  to: number;
  kind: "opcode" | "reg1" | "reg2" | "reg3" | "value";
  unused: boolean;
};

/** A service of TRAP: its number, its name and what it does */
export type TrapService = { number: number; name: string; text: string };

export type CatalogEntry = {
  def: InstructionDef;
  mnemonic: string;
  format: Format;
  unit: Unit;
  category: Category;
  /** What it does, in a few words (Add, Load word…) */
  name: string;
  /** How it is written: ADD rd, rs1, rs2 */
  syntax: string;
  /** Its operands: rd, rs1, rs2 */
  operands: string;
  /** The example that the rest describes: ADD R3, R1, R2 */
  example: string;
  /** The word of the example */
  word: number;
  /** The 6 bits of the opcode (0 for the R type, 1 for the F type) */
  opcode: number;
  /** The function code of the R and F types (the low 6 bits of the word) */
  func: number | null;
  description: InstructionDescription;
  fields: WordField[];
  /** The registers that the example reads and writes */
  reads: string[];
  writes: string[];
  /** TRAP: its services, and where all but the first take their parameters */
  services?: { list: TrapService[]; note: string };
  /** Its words for the search, normalized */
  words: string[];
};

/** Where the examples are (the first instruction of a program: $TEXT) */
export const EXAMPLE_ADDRESS = TEXT_START;
/** Where the branches and the jumps of the examples go, and where the calls go */
const BRANCH_TARGET = EXAMPLE_ADDRESS + 0x10;
const CALL_TARGET = EXAMPLE_ADDRESS + 0x40;
const LABELS: Record<DescriptionLang, { branch: string; call: string; label: string }> = {
  es: { branch: "fin", call: "rutina", label: "etiqueta" },
  en: { branch: "done", call: "routine", label: "label" },
};

/** The meaning describe() gives to a field that the instruction does not use */
const UNUSED: Record<DescriptionLang, string> = { es: "sin uso", en: "unused" };

export function categoryOf(def: InstructionDef): Category {
  switch (def.syntax) {
    case "load":
    case "store":
    case "fload":
    case "fstore":
      return "memory";
    case "branch":
    case "fbranch":
    case "jump":
    case "jreg":
      return "control";
    case "fff":
    case "fcmp":
      return "float";
    case "ff":
      return def.mnemonic.startsWith("CVT") ? "convert" : "move";
    case "fr":
    case "rf":
      return "move";
    case "none":
    case "trap":
      return "other";
    default:
      if (/^S(LL|RL|RA)I?$/.test(def.mnemonic)) return "shift";
      if (/^S(EQ|NE|LT|GT|LE|GE)U?I?$/.test(def.mnemonic)) return "compare";
      return "alu";
  }
}

// ─── Names ──────────────────────────────────────────────────────────────────────────────────────────────────────────

const NAMES = {
  es: {
    ops: {
      ADD: "Suma",
      SUB: "Resta",
      MULT: "Multiplica",
      DIV: "Divide",
      AND: "AND bit a bit",
      OR: "OR bit a bit",
      XOR: "XOR bit a bit",
      SLL: "Desplaza a la izquierda",
      SRL: "Desplaza a la derecha",
      SRA: "Desplaza a la derecha",
    } as Record<string, string>,
    kinds: { SRL: "lógico", SRA: "aritmético" } as Record<string, string>,
    unsigned: "sin signo",
    immediate: "inmediato",
    relations: {
      EQ: "igual",
      NE: "distinto",
      LT: "menor",
      GT: "mayor",
      LE: "menor o igual",
      GE: "mayor o igual",
    } as Record<string, string>,
    set: (relation: string) => `Pone a 1 si es ${relation}`,
    compare: (relation: string) => `Compara si es ${relation}`,
    precision: { F: "simple precisión", D: "doble precisión" } as Record<string, string>,
    fixed: {
      NOP: "No hace nada",
      RFE: "Vuelve de una excepción",
      TRAP: "Llama al sistema",
      J: "Salta",
      JAL: "Salta y enlaza (llamada)",
      JR: "Salta a un registro",
      JALR: "Salta a un registro y enlaza",
      BEQZ: "Bifurca si es cero",
      BNEZ: "Bifurca si no es cero",
      BFPT: "Bifurca si FPSR es 1",
      BFPF: "Bifurca si FPSR es 0",
      LHI: "Carga los 16 bits altos",
      LB: "Carga un byte",
      LBU: "Carga un byte (sin signo)",
      LH: "Carga media palabra",
      LHU: "Carga media palabra (sin signo)",
      LW: "Carga una palabra",
      LF: "Carga un float (simple precisión)",
      LD: "Carga un double (doble precisión)",
      SB: "Guarda un byte",
      SH: "Guarda media palabra",
      SW: "Guarda una palabra",
      SF: "Guarda un float (simple precisión)",
      SD: "Guarda un double (doble precisión)",
      MOVF: "Copia un registro F (simple precisión)",
      MOVD: "Copia un par de registros F (doble precisión)",
      MOVFP2I: "Copia de coma flotante a entero",
      MOVI2FP: "Copia de entero a coma flotante",
      CVTF2D: "Convierte de simple a doble precisión",
      CVTF2I: "Convierte de simple precisión a entero",
      CVTD2F: "Convierte de doble a simple precisión",
      CVTD2I: "Convierte de doble precisión a entero",
      CVTI2F: "Convierte de entero a simple precisión",
      CVTI2D: "Convierte de entero a doble precisión",
    } as Record<string, string>,
  },
  en: {
    ops: {
      ADD: "Add",
      SUB: "Subtract",
      MULT: "Multiply",
      DIV: "Divide",
      AND: "Bitwise AND",
      OR: "Bitwise OR",
      XOR: "Bitwise XOR",
      SLL: "Shift left",
      SRL: "Shift right",
      SRA: "Shift right",
    } as Record<string, string>,
    kinds: { SRL: "logical", SRA: "arithmetic" } as Record<string, string>,
    unsigned: "unsigned",
    immediate: "immediate",
    relations: {
      EQ: "equal",
      NE: "not equal",
      LT: "less than",
      GT: "greater than",
      LE: "less than or equal",
      GE: "greater than or equal",
    } as Record<string, string>,
    set: (relation: string) => `Set if ${relation}`,
    compare: (relation: string) => `Compare if ${relation}`,
    precision: { F: "single precision", D: "double precision" } as Record<string, string>,
    fixed: {
      NOP: "No operation",
      RFE: "Return from exception",
      TRAP: "Trap (system call)",
      J: "Jump",
      JAL: "Jump and link (call)",
      JR: "Jump register",
      JALR: "Jump and link register",
      BEQZ: "Branch if equal to zero",
      BNEZ: "Branch if not equal to zero",
      BFPT: "Branch if FPSR is 1 (true)",
      BFPF: "Branch if FPSR is 0 (false)",
      LHI: "Load high immediate",
      LB: "Load byte",
      LBU: "Load byte (unsigned)",
      LH: "Load half word",
      LHU: "Load half word (unsigned)",
      LW: "Load word",
      LF: "Load float (single precision)",
      LD: "Load double (double precision)",
      SB: "Store byte",
      SH: "Store half word",
      SW: "Store word",
      SF: "Store float (single precision)",
      SD: "Store double (double precision)",
      MOVF: "Move float",
      MOVD: "Move double",
      MOVFP2I: "Move floating point to integer",
      MOVI2FP: "Move integer to floating point",
      CVTF2D: "Convert float to double",
      CVTF2I: "Convert float to integer",
      CVTD2F: "Convert double to float",
      CVTD2I: "Convert double to integer",
      CVTI2F: "Convert integer to float",
      CVTI2D: "Convert integer to double",
    } as Record<string, string>,
  },
};

/** What an instruction does, in a few words: "Suma (sin signo, inmediato)", "Load word" */
export function nameOf(def: InstructionDef, lang: DescriptionLang): string {
  const t = NAMES[lang];
  const m = def.mnemonic;
  if (t.fixed[m]) return t.fixed[m];
  const qualified = (base: string, qualifiers: string[]) => (qualifiers.length ? `${base} (${qualifiers.join(", ")})` : base);
  if (def.format === "F") {
    const precision = t.precision[m.slice(-1)];
    const relation = t.relations[m.slice(0, 2)];
    return relation ? `${t.compare(relation)} (${precision})` : `${t.ops[m.slice(0, -1)]} (${precision})`;
  }
  // The integer operations: an operation or a comparison, unsigned (U) and with an immediate (I)
  const match = /^(.+?)(U?)(I?)$/.exec(m) as RegExpExecArray;
  let [, base, unsigned, immediate] = match;
  // ADDI, SLLI…: the I is not part of the operation; SLL, SRL…: the second L is not an I either
  if (!t.ops[base] && !t.relations[base.slice(1)] && t.ops[`${base}${unsigned}${immediate}`]) {
    base = `${base}${unsigned}${immediate}`;
    unsigned = immediate = "";
  }
  const qualifiers = [t.kinds[base], unsigned && t.unsigned, immediate && t.immediate].filter(Boolean) as string[];
  const relation = base.startsWith("S") && t.relations[base.slice(1)];
  return qualified(relation ? t.set(relation) : t.ops[base], qualifiers);
}

// ─── Syntax and example ─────────────────────────────────────────────────────────────────────────────────────────────

const ZERO_EXTENDED_LOGIC = new Set(["ANDI", "ORI", "XORI"]);

/** The operands of the syntax, by kind: rd, rs1, rs2… */
function operandsOf(def: InstructionDef, lang: DescriptionLang): string {
  const label = LABELS[lang].label;
  switch (def.syntax) {
    case "none":
      return "";
    case "rrr":
      return "rd, rs1, rs2";
    case "rri":
      return "rd, rs1, imm";
    case "ri":
      return "rd, imm";
    case "load":
      return "rd, imm(rs1)";
    case "store":
      return "imm(rs1), rs2";
    case "fload":
      return "fd, imm(rs1)";
    case "fstore":
      return "imm(rs1), fs";
    case "branch":
      return `rs1, ${label}`;
    case "fbranch":
    case "jump":
      return label;
    case "jreg":
      return "rs1";
    case "trap":
      return "n";
    case "fff":
      return "fd, fs1, fs2";
    case "ff":
      return "fd, fs1";
    case "fcmp":
      return "fs1, fs2";
    case "fr":
      return "fd, rs1";
    case "rf":
      return "rd, fs1";
  }
}

type Example = { fields: Parameters<typeof encode>[1]; operands: string };

/**
 * The example of an instruction. The integer registers are numbered as their fields (rs1 is R1, the second field R2 and
 * the rd of the R type R3: ADD R3, R1, R2); the floating point ones as the books do (ADDD F0, F2, F4: the doubles are
 * pairs, named by their even register).
 */
function exampleOf(def: InstructionDef, lang: DescriptionLang): Example {
  const labels = LABELS[lang];
  const next = EXAMPLE_ADDRESS + 4;
  const m = def.mnemonic;
  switch (def.syntax) {
    case "none":
      return { fields: {}, operands: "" };
    case "rrr":
      return { fields: { rd: 3, rs1: 1, rs2: 2 }, operands: "R3, R1, R2" };
    case "rri": {
      const shift = categoryOf(def) === "shift";
      const imm = shift ? 2 : ZERO_EXTENDED_LOGIC.has(m) ? 0xff : 8;
      return { fields: { rs1: 1, rs2: 2, imm }, operands: `R2, R1, ${imm === 0xff ? "0xFF" : imm}` };
    }
    case "ri":
      return { fields: { rs2: 2, imm: 0x1234 }, operands: "R2, 0x1234" };
    case "load":
      return { fields: { rs1: 1, rs2: 2, imm: 8 }, operands: "R2, 8(R1)" };
    case "store":
      return { fields: { rs1: 1, rs2: 2, imm: 8 }, operands: "8(R1), R2" };
    case "fload":
      return { fields: { rs1: 1, rs2: 0, imm: 8 }, operands: "F0, 8(R1)" };
    case "fstore":
      return { fields: { rs1: 1, rs2: 0, imm: 8 }, operands: "8(R1), F0" };
    case "branch":
      return { fields: { rs1: 1, imm: BRANCH_TARGET - next }, operands: `R1, ${labels.branch}` };
    case "fbranch":
      return { fields: { imm: BRANCH_TARGET - next }, operands: labels.branch };
    case "jump":
      return m === "JAL"
        ? { fields: { offset: CALL_TARGET - next }, operands: labels.call }
        : { fields: { offset: BRANCH_TARGET - next }, operands: labels.branch };
    case "jreg":
      return m === "JR" ? { fields: { rs1: 31 }, operands: "R31" } : { fields: { rs1: 1 }, operands: "R1" };
    case "trap":
      return { fields: { offset: 0 }, operands: "0" };
    case "fff":
      return { fields: { rd: 0, rs1: 2, rs2: 4 }, operands: "F0, F2, F4" };
    case "ff":
      return { fields: { rd: 0, rs1: 2 }, operands: "F0, F2" };
    case "fcmp":
      return { fields: { rs1: 2, rs2: 4 }, operands: "F2, F4" };
    case "fr":
      return { fields: { rd: 0, rs1: 1 }, operands: "F0, R1" };
    case "rf":
      return { fields: { rd: 3, rs1: 2 }, operands: "R3, F2" };
  }
}

/** The labels of the examples, by address (describe() names the targets with them) */
export function exampleLabels(lang: DescriptionLang): Map<number, string> {
  return new Map([
    [BRANCH_TARGET, LABELS[lang].branch],
    [CALL_TARGET, LABELS[lang].call],
  ]);
}

// ─── The entries ────────────────────────────────────────────────────────────────────────────────────────────────────

/** Lowercase and without accents, to search */
export function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

const wordsOf = (text: string) =>
  normalize(text)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

/** A hexadecimal code of 2 digits: 0x08 */
export const hex2 = (value: number) => `0x${value.toString(16).toUpperCase().padStart(2, "0")}`;

/** The registers of a list, with the pairs of the doubles together: F2:F3 */
function registerNames(prefix: "R" | "F", registers: number[], pairs: boolean): string[] {
  const names: string[] = [];
  for (let i = 0; i < registers.length; i++) {
    const register = registers[i];
    if (pairs && register % 2 === 0 && registers[i + 1] === register + 1) {
      names.push(`${prefix}${register}:${prefix}${register + 1}`);
      i++;
    } else names.push(`${prefix}${register}`);
  }
  return names;
}

function fieldsOf(fields: InstructionField[], lang: DescriptionLang): WordField[] {
  let top = 31;
  return fields.map((field, index) => {
    const from = top;
    const to = top - field.bits.length + 1;
    top = to - 1;
    const kind: WordField["kind"] = index === 0 ? "opcode" : index === fields.length - 1 ? "value" : (`reg${index}` as WordField["kind"]);
    return { ...field, from, to, kind, unused: field.meaning === UNUSED[lang] };
  });
}

/** The definition of TRAP, for its services */
const BY_TRAP = INSTRUCTIONS.find((def) => def.syntax === "trap") as InstructionDef;

/** The services of TRAP; the sentence that all but the first share (where their parameters are) goes apart */
function servicesOf(lang: DescriptionLang): { list: TrapService[]; note: string } {
  const list = [0, 1, 2, 3, 4, 5].map((number) => {
    const description = describe(decode(encode(BY_TRAP, { offset: number })) as Decoded, { address: EXAMPLE_ADDRESS, lang });
    return { number, name: description.summary.replace(/^TRAP \d+: /, ""), text: description.text };
  });
  const rest = list.slice(1).map((service) => service.text);
  let common = rest[0];
  while (common && !rest.every((text) => text.endsWith(common))) common = common.slice(1);
  const note = common.slice(Math.max(0, common.search(/\p{Lu}/u)));
  return {
    list: list.map((service) =>
      note && service.number > 0 && service.text.endsWith(note)
        ? { ...service, text: service.text.slice(0, -note.length).trim() }
        : service,
    ),
    note,
  };
}

export function entryOf(def: InstructionDef, lang: DescriptionLang): CatalogEntry {
  const example = exampleOf(def, lang);
  const word = encode(def, example.fields);
  const decoded = decode(word) as Decoded;
  const description = describe(decoded, { address: EXAMPLE_ADDRESS, labels: exampleLabels(lang), lang });
  const use = registerUse(decoded);
  const pairs = (def.doubles ?? []).length > 0;
  // The trap 0 only ends the program: it neither reads its parameters nor leaves a result (as describe() says)
  const halts = def.syntax === "trap" && (decoded.offset & 0x3ffffff) === 0;
  const reads = halts
    ? []
    : [...registerNames("R", use.intReads, false), ...registerNames("F", use.fpReads, pairs), ...(use.readsFPSR ? ["FPSR"] : [])];
  const writes = halts
    ? []
    : [...registerNames("R", use.intWrites, false), ...registerNames("F", use.fpWrites, pairs), ...(use.writesFPSR ? ["FPSR"] : [])];
  const operands = operandsOf(def, lang);
  const opcode = word >>> 26;
  const func = def.format === "R" || def.format === "F" ? def.code : null;
  const name = nameOf(def, lang);
  const syntax = operands ? `${def.mnemonic} ${operands}` : def.mnemonic;
  const exampleText = example.operands ? `${def.mnemonic} ${example.operands}` : def.mnemonic;
  const codes = [hex2(opcode), ...(func === null ? [] : [hex2(func)])];
  return {
    def,
    mnemonic: def.mnemonic,
    format: def.format,
    unit: def.unit,
    category: categoryOf(def),
    name,
    syntax,
    operands,
    example: exampleText,
    word,
    opcode,
    func,
    description,
    fields: fieldsOf(description.fields, lang),
    reads,
    writes,
    services: def.syntax === "trap" ? servicesOf(lang) : undefined,
    words: wordsOf([def.mnemonic, name, syntax, exampleText, description.summary, description.text, ...codes].join(" ")),
  };
}

/** The order inside some categories: the integer unit before the multiplications and the immediates, the branches before the jumps, TRAP first */
const ORDER: Partial<Record<Category, (def: InstructionDef) => number>> = {
  alu: (def) => (def.format === "I" ? 2 : def.unit === "int" ? 0 : 1),
  control: (def) => (def.syntax === "branch" || def.syntax === "fbranch" ? 0 : 1),
  other: (def) => (def.syntax === "trap" ? 0 : 1),
};

/** Every instruction, by category and, inside each one, in the order of isa.ts (with the exceptions of ORDER) */
export function instructionCatalog(lang: DescriptionLang): CatalogEntry[] {
  const entries = INSTRUCTIONS.map((def) => entryOf(def, lang));
  return CATEGORIES.flatMap((category) => {
    const order = ORDER[category] ?? (() => 0);
    return entries.filter((entry) => entry.category === category).sort((a, b) => order(a.def) - order(b.def));
  });
}

// ─── The search ─────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The entries with every word of the query at the start of one of their words (the mnemonic, the name, the syntax, the
 * example, the formula, the explanation or the codes), the closest to the mnemonic first: LW for "lw", then the rest.
 */
export function searchCatalog(entries: CatalogEntry[], query: string): CatalogEntry[] {
  const words = wordsOf(query);
  if (!words.length) return entries;
  const text = words.join("");
  const phrase = words.join(" ");
  const scored: { entry: CatalogEntry; score: number; index: number }[] = [];
  entries.forEach((entry, index) => {
    if (!words.every((word) => entry.words.some((candidate) => candidate.startsWith(word)))) return;
    const mnemonic = entry.mnemonic.toLowerCase();
    const name = wordsOf(entry.name);
    const score =
      mnemonic === text
        ? 0
        : mnemonic.startsWith(text)
          ? 1
          : name.join(" ").startsWith(phrase)
            ? 2
            : words.every((word) => name.some((candidate) => candidate.startsWith(word)))
              ? 3
              : 4;
    scored.push({ entry, score, index });
  });
  return scored.sort((a, b) => a.score - b.score || a.index - b.index).map((item) => item.entry);
}

/** How many entries there are of each category */
export function countByCategory(entries: CatalogEntry[]): Record<Category, number> {
  const counts = Object.fromEntries(CATEGORIES.map((category) => [category, 0])) as Record<Category, number>;
  for (const entry of entries) counts[entry.category]++;
  return counts;
}

// ─── The maps of the codes ──────────────────────────────────────────────────────────────────────────────────────────

/** A cell of a map: the code, its instruction (or none) and, for the opcodes 0 and 1, the type whose map follows */
export type MatrixCell = { code: number; mnemonic: string | null; category: Category | null; opens?: "R" | "F" };
export type Matrix = { id: "opcode" | "R" | "F"; rows: { bits: string; cells: MatrixCell[] }[] };

const bits3 = (value: number) => value.toString(2).padStart(3, "0");

/** The three maps: the opcode (I and J types; 0 and 1 are the R and F types) and the function codes of R and F */
export function opcodeMatrices(): Matrix[] {
  const matrix = (id: Matrix["id"], find: (code: number) => InstructionDef | undefined, opens: Record<number, "R" | "F"> = {}): Matrix => ({
    id,
    rows: [0, 1, 2, 3, 4, 5, 6, 7].map((row) => ({
      bits: bits3(row),
      cells: [0, 1, 2, 3, 4, 5, 6, 7].map((column) => {
        const code = row * 8 + column;
        const def = find(code);
        return { code, mnemonic: def?.mnemonic ?? null, category: def ? categoryOf(def) : null, opens: opens[code] };
      }),
    })),
  });
  const byCode = (formats: Format[]) => (code: number) => INSTRUCTIONS.find((def) => formats.includes(def.format) && def.code === code);
  return [matrix("opcode", byCode(["I", "J"]), { 0: "R", 1: "F" }), matrix("R", byCode(["R"])), matrix("F", byCode(["F"]))];
}

/** The 3 bits of a row or a column of a map */
export const MATRIX_BITS = [0, 1, 2, 3, 4, 5, 6, 7].map(bits3);
