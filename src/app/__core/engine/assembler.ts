// The assembler of WinDLX (docs/manual-simulador-dlx.md, sections 4.2 and 4.3): two passes over the files (in
// alphabetical order, sharing the text and data pointers and the symbols), expressions like those of C and the
// directives .align .ascii .asciiz .byte .data .double .float .global .space .text .word.
import { BY_MNEMONIC, encode, type InstructionDef } from "@core/engine/isa";

export type SourceFile = { name: string; content: string };

export type AssemblyMessage = { file: string; line: number; message: string; severity: "error" | "warning" };

export type AssembledInstruction = {
  address: number;
  word: number;
  /** The instruction as it is written in the file (without label or comment) */
  source: string;
  /** The labels defined at its address */
  labels: string[];
  file: string;
  line: number;
};

export type AssemblyResult = {
  ok: boolean;
  messages: AssemblyMessage[];
  instructions: AssembledInstruction[];
  /** The whole memory with the program and its data */
  memory: Uint8Array;
  /** Addresses written by the data directives (to send them to the views) */
  dataAddresses: number[];
  symbols: Map<string, number>;
  /** The labels of the program (WinDLX: Memory → Symbols): where each one is defined and whether it is global */
  symbolTable: AssemblySymbol[];
  textStart: number;
  dataStart: number;
  /** Where the program starts: the symbol "main" (global or of the main file) or $TEXT */
  entry: number;
};

export type AssemblySymbol = { name: string; value: number; file: string; global: boolean };

export type AssemblyOptions = { memorySize: number; textStart?: number; dataStart?: number; mainFile?: string };

/** $TEXT and $DATA of WinDLX: the code from 0x100 and the data from 0x1000 */
export const TEXT_START = 0x100;
export const DATA_START = 0x1000;

class AssemblyError extends Error {}

type Line = { file: string; number: number; labels: string[]; operation: string; operands: string; text: string };

// ─── Lines ──────────────────────────────────────────────────────────────────────────────────────────────────────────

/** Removes the comment (";" outside quotes) */
function stripComment(text: string): string {
  let quote: string | null = null;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (c === "\\") i++;
      else if (c === quote) quote = null;
    } else if (c === '"' || c === "'") quote = c;
    else if (c === ";") return text.slice(0, i);
  }
  return text;
}

const LABEL = /^\s*([A-Za-z_$.][\w$.]*)\s*:/;

function parseLine(file: string, number: number, raw: string): Line {
  let text = stripComment(raw).replace(/\t/g, " ").trim();
  const labels: string[] = [];
  for (let match = LABEL.exec(text); match; match = LABEL.exec(text)) {
    labels.push(match[1]);
    text = text.slice(match[0].length).trim();
  }
  const space = text.search(/\s/);
  const operation = space === -1 ? text : text.slice(0, space);
  const operands = space === -1 ? "" : text.slice(space + 1).trim();
  return { file, number, labels, operation, operands, text };
}

/** Splits the operands by commas outside quotes and parentheses */
function splitOperands(operands: string): string[] {
  const parts: string[] = [];
  let current = "";
  let depth = 0;
  let quote: string | null = null;
  for (let i = 0; i < operands.length; i++) {
    const c = operands[i];
    if (quote) {
      current += c;
      if (c === "\\") current += operands[++i] ?? "";
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") quote = c;
    if (c === "(") depth++;
    if (c === ")") depth--;
    if (c === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else current += c;
  }
  if (current.trim() !== "" || parts.length > 0) parts.push(current.trim());
  return parts;
}

// ─── Expressions ────────────────────────────────────────────────────────────────────────────────────────────────────

type Token = { kind: "number" | "symbol" | "operator"; value: string };

function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  const pattern = /\s*(?:(0[xX][0-9a-fA-F]+|\d+)|('(?:\\.|[^'\\])')|([A-Za-z_$.][\w$.]*)|(<<|>>|[-+*/%&|^~()]))/y;
  let index = 0;
  while (index < expression.length) {
    if (/^\s*$/.test(expression.slice(index))) break;
    pattern.lastIndex = index;
    const match = pattern.exec(expression);
    if (!match) throw new AssemblyError(`Invalid expression: "${expression}"`);
    index = pattern.lastIndex;
    if (match[1] !== undefined) tokens.push({ kind: "number", value: match[1] });
    else if (match[2] !== undefined) tokens.push({ kind: "number", value: String(unescapeString(match[2].slice(1, -1)).charCodeAt(0)) });
    else if (match[3] !== undefined) tokens.push({ kind: "symbol", value: match[3] });
    else tokens.push({ kind: "operator", value: match[4] });
  }
  return tokens;
}

function parseNumber(text: string): number {
  if (/^0[xX]/.test(text)) return parseInt(text, 16);
  if (/^0\d+$/.test(text)) {
    if (/[89]/.test(text)) throw new AssemblyError(`Invalid octal number: ${text}`);
    return parseInt(text, 8);
  }
  return parseInt(text, 10);
}

/** Evaluates an expression with the precedence of C; `symbol` gives the value of each symbol */
export function evaluate(expression: string, symbol: (name: string) => number): number {
  // "#" marks an immediate in many DLX programs ("ADDI R1, R0, #4", "TRAP #0")
  const tokens = tokenize(expression.trim().replace(/^#/, ""));
  if (tokens.length === 0) throw new AssemblyError("Missing expression");
  let position = 0;
  const peek = () => tokens[position];
  const take = (value: string) => {
    if (peek()?.kind === "operator" && peek().value === value) {
      position++;
      return true;
    }
    return false;
  };
  const primary = (): number => {
    const token = tokens[position++];
    if (!token) throw new AssemblyError(`Incomplete expression: "${expression}"`);
    if (token.kind === "number") return parseNumber(token.value);
    if (token.kind === "symbol") return symbol(token.value);
    if (token.value === "(") {
      const value = or();
      if (!take(")")) throw new AssemblyError(`Missing ")" in "${expression}"`);
      return value;
    }
    if (token.value === "-") return -primary() | 0;
    if (token.value === "+") return primary();
    if (token.value === "~") return ~primary();
    throw new AssemblyError(`Unexpected "${token.value}" in "${expression}"`);
  };
  const binary = (next: () => number, operators: Record<string, (a: number, b: number) => number>) => (): number => {
    let value = next();
    for (;;) {
      const token = peek();
      if (token?.kind !== "operator" || !(token.value in operators)) return value;
      position++;
      value = operators[token.value](value, next());
    }
  };
  const multiplicative = binary(primary, {
    "*": (a, b) => Math.imul(a, b),
    "/": (a, b) => {
      if (b === 0) throw new AssemblyError("Division by zero in an expression");
      return (a / b) | 0;
    },
    "%": (a, b) => {
      if (b === 0) throw new AssemblyError("Division by zero in an expression");
      return (a % b) | 0;
    },
  });
  const additive = binary(multiplicative, { "+": (a, b) => (a + b) | 0, "-": (a, b) => (a - b) | 0 });
  const shift = binary(additive, { "<<": (a, b) => a << b, ">>": (a, b) => a >> b });
  const and = binary(shift, { "&": (a, b) => a & b });
  const xor = binary(and, { "^": (a, b) => a ^ b });
  const or = binary(xor, { "|": (a, b) => a | b });
  const value = or();
  if (position < tokens.length) throw new AssemblyError(`Unexpected "${tokens[position].value}" in "${expression}"`);
  return value;
}

function unescapeString(text: string): string {
  return text.replace(/\\(x[0-9a-fA-F]{1,2}|[0-7]{1,3}|.)/g, (_match, sequence: string) => {
    if (sequence[0] === "x") return String.fromCharCode(parseInt(sequence.slice(1), 16));
    if (/^[0-7]+$/.test(sequence)) return String.fromCharCode(parseInt(sequence, 8));
    const map: Record<string, string> = { n: "\n", t: "\t", r: "\r", "0": "\0", a: "\x07", b: "\b", f: "\f", v: "\v" };
    return map[sequence] ?? sequence;
  });
}

function parseString(operand: string): string {
  const match = /^"((?:\\.|[^"\\])*)"$/.exec(operand.trim());
  if (!match) throw new AssemblyError(`Expected a string between quotes: ${operand}`);
  return unescapeString(match[1]);
}

// ─── Registers ──────────────────────────────────────────────────────────────────────────────────────────────────────

function register(operand: string, kind: "R" | "F"): number {
  const match = /^([RrFf])(\d{1,2})$/.exec(operand.trim());
  if (!match || match[1].toUpperCase() !== kind || Number(match[2]) > 31) {
    throw new AssemblyError(`Expected a register ${kind}0..${kind}31: "${operand}"`);
  }
  return Number(match[2]);
}

function doubleRegister(operand: string): number {
  const number = register(operand, "F");
  if (number % 2 !== 0) throw new AssemblyError(`A double needs an even register (F0, F2...): "${operand}"`);
  return number;
}

/** "disp(Rn)", "disp" (absolute, R0) or "(Rn)" */
function memoryOperand(operand: string): { displacement: string; base: number } {
  const match = /^(.*)\(\s*([Rr]\d{1,2})\s*\)$/.exec(operand.trim());
  if (match) return { displacement: match[1].trim() || "0", base: register(match[2], "R") };
  return { displacement: operand, base: 0 };
}

// ─── Assembler ──────────────────────────────────────────────────────────────────────────────────────────────────────

type Segment = "text" | "data";

const DIRECTIVES = new Set([
  ".ALIGN",
  ".ASCII",
  ".ASCIIZ",
  ".BYTE",
  ".DATA",
  ".DOUBLE",
  ".FLOAT",
  ".GLOBAL",
  ".SPACE",
  ".TEXT",
  ".WORD",
  ".HALF",
]);

export function assemble(files: SourceFile[], options: AssemblyOptions): AssemblyResult {
  const textStart = options.textStart ?? TEXT_START;
  const dataStart = options.dataStart ?? DATA_START;
  const messages: AssemblyMessage[] = [];
  // As in WinDLX, the labels of a file are its own; only those declared with .global are seen from the others
  const builtins = new Map<string, number>([
    ["$TEXT", textStart],
    ["$DATA", dataStart],
  ]);
  const locals = new Map<string, Map<string, number>>(files.map((file) => [file.name, new Map()]));
  const declaredGlobals = new Map<string, Line>();
  const globals = new Map<string, number>();
  const lookup = (file: string, name: string) => locals.get(file)?.get(name) ?? globals.get(name) ?? builtins.get(name);
  const memory = new Uint8Array(options.memorySize);
  const written = new Uint8Array(options.memorySize);
  const instructions: AssembledInstruction[] = [];
  const dataAddresses = new Set<number>();
  const sorted = [...files].sort((a, b) => a.name.localeCompare(b.name));
  const lines = sorted.flatMap((file) => file.content.split(/\r?\n/).map((raw, index) => parseLine(file.name, index + 1, raw)));

  const report = (line: Line, error: unknown, severity: "error" | "warning" = "error") => {
    const message = error instanceof Error ? error.message : String(error);
    messages.push({ file: line.file, line: line.number, message, severity });
  };

  // Both passes walk the lines the same way: the first defines the labels, the second writes the memory
  for (const pass of [1, 2] as const) {
    const pointer: Record<Segment, number> = { text: textStart, data: dataStart };
    let segment: Segment = "text";
    let file = "";
    const symbolValue = (name: string) => {
      const value = lookup(file, name);
      if (value === undefined) throw new AssemblyError(`Undefined symbol: ${name}`);
      return value;
    };
    // In the first pass the operands may use labels defined later: they count as 0
    const value = (expression: string) => evaluate(expression, pass === 1 ? (name) => lookup(file, name) ?? 0 : symbolValue);
    // Sizes and addresses must be known in the first pass: only symbols defined before
    const size = (expression: string) =>
      evaluate(expression, (name) => {
        const known = lookup(file, name);
        if (known === undefined) throw new AssemblyError(`${name} must be defined before it is used in a size or an address`);
        return known;
      });

    const write = (line: Line, address: number, bytes: number[], isData: boolean) => {
      if (pass === 1) return;
      if (address < 0 || address + bytes.length > options.memorySize) {
        throw new AssemblyError(`Address 0x${address.toString(16).toUpperCase()} is out of memory (${options.memorySize} bytes)`);
      }
      bytes.forEach((byte, i) => {
        if (written[address + i]) report(line, `Overwrites the address 0x${(address + i).toString(16).toUpperCase()}`, "warning");
        memory[address + i] = byte & 0xff;
        written[address + i] = 1;
        if (isData) dataAddresses.add((address + i) & ~3);
      });
    };

    for (const line of lines) {
      file = line.file;
      try {
        const directive = line.operation.toUpperCase();
        // .text/.data with an address and .align move the pointer before the labels of the line take it
        if (directive === ".TEXT" || directive === ".DATA") {
          segment = directive === ".TEXT" ? "text" : "data";
          if (line.operands) pointer[segment] = size(line.operands);
        }
        if (directive === ".ALIGN") {
          const n = size(line.operands);
          if (n < 0 || n > 16) throw new AssemblyError(`.align ${n}: expected 0..16`);
          const alignment = 2 ** n;
          pointer[segment] = Math.ceil(pointer[segment] / alignment) * alignment;
        }
        // Instructions always start at a multiple of 4
        const isInstruction = line.operation !== "" && !line.operation.startsWith(".");
        if (isInstruction && segment === "text") pointer.text = Math.ceil(pointer.text / 4) * 4;

        if (pass === 1) {
          const own = locals.get(file) as Map<string, number>;
          for (const label of line.labels) {
            if (own.has(label) || builtins.has(label)) throw new AssemblyError(`The symbol ${label} is already defined`);
            own.set(label, pointer[segment]);
          }
        }
        if (line.operation === "") continue;

        if (line.operation.startsWith(".")) {
          if (!DIRECTIVES.has(directive)) throw new AssemblyError(`Unknown directive ${line.operation}`);
          const operands = line.operands === "" ? [] : splitOperands(line.operands);
          const isData = true;
          switch (directive) {
            case ".TEXT":
            case ".DATA":
            case ".ALIGN":
              break;
            case ".GLOBAL":
              if (pass === 1) for (const name of operands) declaredGlobals.set(name, line);
              break;
            case ".SPACE": {
              const bytes = size(line.operands);
              if (bytes < 0) throw new AssemblyError(".space needs a positive size");
              pointer[segment] += bytes;
              break;
            }
            case ".ASCII":
            case ".ASCIIZ":
              for (const operand of operands) {
                const text = parseString(operand) + (directive === ".ASCIIZ" ? "\0" : "");
                write(
                  line,
                  pointer[segment],
                  [...text].map((c) => c.charCodeAt(0)),
                  isData,
                );
                pointer[segment] += text.length;
              }
              break;
            case ".BYTE":
              for (const operand of operands) {
                const byte = value(operand);
                if (pass === 2 && (byte < -128 || byte > 255)) throw new AssemblyError(`${byte} does not fit in a byte (-128..255)`);
                write(line, pointer[segment], [byte], isData);
                pointer[segment] += 1;
              }
              break;
            case ".HALF":
              for (const operand of operands) {
                const half = value(operand);
                if (pass === 2 && (half < -32768 || half > 65535)) throw new AssemblyError(`${half} does not fit in a half word`);
                write(line, pointer[segment], [half >> 8, half], isData);
                pointer[segment] += 2;
              }
              break;
            case ".WORD":
              for (const operand of operands) {
                const word = value(operand);
                write(line, pointer[segment], [word >>> 24, word >>> 16, word >>> 8, word], isData);
                pointer[segment] += 4;
              }
              break;
            case ".FLOAT":
            case ".DOUBLE":
              for (const operand of operands) {
                const number = Number(operand);
                if (operand.trim() === "" || Number.isNaN(number)) throw new AssemblyError(`Expected a number: "${operand}"`);
                const view = new DataView(new ArrayBuffer(8));
                const bytes = directive === ".FLOAT" ? 4 : 8;
                if (bytes === 4) view.setFloat32(0, number);
                else view.setFloat64(0, number);
                write(line, pointer[segment], Array.from(new Uint8Array(view.buffer, 0, bytes)), isData);
                pointer[segment] += bytes;
              }
              break;
          }
          continue;
        }

        // An instruction
        // An unknown instruction also takes its 4 bytes, so the addresses of the next labels do not move
        const address = pointer[segment];
        pointer[segment] += 4;
        const def = BY_MNEMONIC.get(line.operation.toUpperCase());
        if (def === undefined) throw new AssemblyError(`Unknown instruction ${line.operation}`);
        if (pass === 1) continue;
        const word = encodeInstruction(def, splitOperands(line.operands), address, value);
        write(line, address, [word >>> 24, word >>> 16, word >>> 8, word], segment === "data");
        instructions.push({
          address,
          word,
          source: line.text,
          labels: line.labels,
          file: line.file,
          line: line.number,
        });
      } catch (error) {
        report(line, error);
      }
    }
    // The global symbols, once every file has defined its labels
    if (pass === 1) {
      for (const [name, line] of declaredGlobals) {
        const own = locals.get(line.file)?.get(name);
        if (own === undefined) report(line, `Undefined symbol: ${name}`);
        else if (globals.has(name)) report(line, `The global symbol ${name} is defined in more than one file`);
        else globals.set(name, own);
      }
    }
  }
  const symbols = new Map([...builtins, ...[...locals.values()].flatMap((own) => [...own]), ...globals]);
  const symbolTable: AssemblySymbol[] = [...locals]
    .flatMap(([file, own]) =>
      [...own].map(([name, value]) => ({ name, value, file, global: declaredGlobals.get(name)?.file === file && globals.has(name) })),
    )
    .sort((a, b) => a.value - b.value || a.name.localeCompare(b.name));
  const mainFile = options.mainFile ?? files[0]?.name;
  const entry = globals.get("main") ?? (mainFile ? locals.get(mainFile)?.get("main") : undefined) ?? textStart;

  // The same error can come from both passes
  const unique = messages.filter(
    (message, index) =>
      messages.findIndex((other) => other.line === message.line && other.file === message.file && other.message === message.message) ===
      index,
  );
  unique.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
  instructions.sort((a, b) => a.address - b.address);
  // The labels of each instruction, also those written alone on a line before it
  for (const instruction of instructions) {
    const own = locals.get(instruction.file) ?? new Map<string, number>();
    instruction.labels = [...own].filter(([, value]) => value === instruction.address).map(([name]) => name);
  }
  return {
    ok: !unique.some((message) => message.severity === "error"),
    messages: unique,
    instructions,
    memory,
    dataAddresses: [...dataAddresses].sort((a, b) => a - b),
    symbols,
    symbolTable,
    textStart,
    dataStart,
    entry,
  };
}

/** The names a file makes global (.global) */
export function globalNames(content: string): string[] {
  return [...content.matchAll(/^[^;\n]*?\.global\s+([^;\n]+)/gim)].flatMap((match) =>
    match[1]
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean),
  );
}

function checkRange(value: number, min: number, max: number, what: string): number {
  if (value < min || value > max) throw new AssemblyError(`${what} ${value} is out of range (${min}..${max})`);
  return value;
}

function encodeInstruction(def: InstructionDef, operands: string[], address: number, value: (expression: string) => number): number {
  const count: Record<string, number> = {
    none: 0,
    rrr: 3,
    rri: 3,
    ri: 2,
    load: 2,
    store: 2,
    fload: 2,
    fstore: 2,
    branch: 2,
    fbranch: 1,
    jump: 1,
    jreg: 1,
    trap: 1,
    fff: 3,
    ff: 2,
    fcmp: 2,
    fr: 2,
    rf: 2,
  };
  if (operands.length !== count[def.syntax]) {
    throw new AssemblyError(`${def.mnemonic} expects ${count[def.syntax]} operand(s), found ${operands.length}`);
  }
  const doubles = def.doubles ?? [];
  const fp = (operand: string, slot: "d" | "s1" | "s2") => (doubles.includes(slot) ? doubleRegister(operand) : register(operand, "F"));
  const immediate = (expression: string) => checkRange(value(expression), -32768, 65535, "The immediate");
  const displacement = (expression: string) => checkRange(value(expression), -32768, 32767, "The displacement");
  const relative = (expression: string, bits: number) => {
    const target = value(expression);
    if (target % 4 !== 0) throw new AssemblyError(`The target ${target} is not a multiple of 4`);
    return checkRange(target - (address + 4), -(2 ** (bits - 1)), 2 ** (bits - 1) - 1, "The jump");
  };
  const [a, b, c] = operands;
  switch (def.syntax) {
    case "none":
      return encode(def, {});
    case "rrr":
      return encode(def, { rd: register(a, "R"), rs1: register(b, "R"), rs2: register(c, "R") });
    case "rri":
      return encode(def, { rs2: register(a, "R"), rs1: register(b, "R"), imm: immediate(c) });
    case "ri":
      return encode(def, { rs2: register(a, "R"), imm: immediate(b) });
    case "load": {
      const { displacement: d, base } = memoryOperand(b);
      return encode(def, { rs2: register(a, "R"), rs1: base, imm: displacement(d) });
    }
    case "fload": {
      const { displacement: d, base } = memoryOperand(b);
      return encode(def, { rs2: fp(a, "d"), rs1: base, imm: displacement(d) });
    }
    case "store": {
      const { displacement: d, base } = memoryOperand(a);
      return encode(def, { rs1: base, rs2: register(b, "R"), imm: displacement(d) });
    }
    case "fstore": {
      const { displacement: d, base } = memoryOperand(a);
      return encode(def, { rs1: base, rs2: fp(b, "d"), imm: displacement(d) });
    }
    case "branch":
      return encode(def, { rs1: register(a, "R"), imm: relative(b, 16) });
    case "fbranch":
      return encode(def, { imm: relative(a, 16) });
    case "jump":
      return encode(def, { offset: relative(a, 26) });
    case "jreg":
      return encode(def, { rs1: register(a, "R") });
    case "trap":
      return encode(def, { offset: checkRange(value(a), 0, 2 ** 26 - 1, "The trap") });
    case "fff":
      return encode(def, { rd: fp(a, "d"), rs1: fp(b, "s1"), rs2: fp(c, "s2") });
    case "ff":
      return encode(def, { rd: fp(a, "d"), rs1: fp(b, "s1") });
    case "fcmp":
      return encode(def, { rs1: fp(a, "s1"), rs2: fp(b, "s2") });
    case "fr":
      return encode(def, { rd: register(a, "F"), rs1: register(b, "R") });
    case "rf":
      return encode(def, { rd: register(a, "R"), rs1: register(b, "F") });
  }
}
