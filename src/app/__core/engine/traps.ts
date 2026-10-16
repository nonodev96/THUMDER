// The traps of WinDLX (docs/manual-simulador-dlx.md, section 5): the interface of the programs with input and output.
// The address of the first parameter is in R14 (the next ones at R14+4, R14+8...) and the result goes to R1.
// In the browser there are no files: only the descriptors 0 (stdin), 1 (stdout) and 2 (stderr) exist.
import { doubleFromBits, type Memory, type Registers, SimulationError } from "@core/engine/cpu";

/** The console of the simulated program (the DLX-I/O window) */
export interface ProgramIO {
  write(text: string, descriptor: 1 | 2): void;
  /** The next line typed by the user (with its "\n"), or null if there is none yet */
  readLine(): string | null;
}

export type TrapResult = {
  /** Value for R1 */
  r1?: number;
  halt?: boolean;
  /** Trap 3 on stdin with no input: the trap must run again when there is a line */
  waitingForInput?: boolean;
};

export function runTrap(trap: number, registers: Registers, memory: Memory, io: ProgramIO): TrapResult {
  const parameter = (index: number) => memory.readU32((registers.R[14] + 4 * index) >>> 0);
  switch (trap) {
    case 0:
      return { halt: true };
    case 1: {
      // open(): there are no files in the browser
      io.write("Trap #1: files cannot be opened in THUMDER\n", 2);
      return { r1: -1 };
    }
    case 2: {
      const descriptor = parameter(0);
      return { r1: descriptor <= 2 ? 0 : -1 };
    }
    case 3: {
      const [descriptor, buffer, size] = [parameter(0), parameter(1), parameter(2)];
      if (descriptor !== 0) return { r1: -1 };
      const line = io.readLine();
      if (line === null) return { waitingForInput: true };
      const bytes = Math.min(size, line.length);
      for (let i = 0; i < bytes; i++) memory.writeU8(buffer + i, line.charCodeAt(i));
      return { r1: bytes };
    }
    case 4: {
      const [descriptor, buffer, size] = [parameter(0), parameter(1), parameter(2)];
      if (descriptor !== 1 && descriptor !== 2) return { r1: -1 };
      let text = "";
      for (let i = 0; i < size; i++) text += String.fromCharCode(memory.readU8(buffer + i));
      io.write(text, descriptor);
      return { r1: size };
    }
    case 5: {
      const text = printf(memory, (registers.R[14] >>> 0) as number);
      io.write(text, 1);
      return { r1: text.length };
    }
    default:
      throw new SimulationError(`Undefined trap #${trap}`);
  }
}

/** C printf(): the format string is at the address in memory[args] and the arguments follow it */
export function printf(memory: Memory, args: number): string {
  const format = memory.readString(memory.readU32(args));
  let next = args + 4;
  const word = () => {
    const value = memory.readU32(next);
    next += 4;
    return value;
  };
  const double = () => {
    const value = doubleFromBits(memory.readU32(next), memory.readU32(next + 4));
    next += 8;
    return value;
  };
  return format.replace(
    /%([-+ 0#]*)(\d+)?(?:\.(\d+))?(?:hh|h|ll|l|L)?([diouxXcsfFeEgG%])/g,
    (_match, flags: string, width, precision, conversion) => {
      if (conversion === "%") return "%";
      const p = precision === undefined ? undefined : Number(precision);
      let body: string;
      let sign = "";
      switch (conversion) {
        case "d":
        case "i": {
          const value = word() | 0;
          sign = value < 0 ? "-" : flags.includes("+") ? "+" : flags.includes(" ") ? " " : "";
          body = Math.abs(value).toString();
          if (p !== undefined) body = body.padStart(p, "0");
          break;
        }
        case "u":
          body = word().toString();
          break;
        case "o":
          body = word().toString(8);
          break;
        case "x":
          body = word().toString(16);
          break;
        case "X":
          body = word().toString(16).toUpperCase();
          break;
        case "c":
          body = String.fromCharCode(word() & 0xff);
          break;
        case "s": {
          const text = memory.readString(word());
          body = p === undefined ? text : text.slice(0, p);
          break;
        }
        default: {
          const value = double();
          sign = value < 0 || Object.is(value, -0) ? "-" : flags.includes("+") ? "+" : flags.includes(" ") ? " " : "";
          body = formatFloat(Math.abs(value), conversion, p ?? 6, flags.includes("#"));
        }
      }
      const minimum = width === undefined ? 0 : Number(width);
      const padding = Math.max(0, minimum - sign.length - body.length);
      if (flags.includes("-")) return sign + body + " ".repeat(padding);
      if (flags.includes("0") && !/[cs]/.test(conversion)) return sign + "0".repeat(padding) + body;
      return " ".repeat(padding) + sign + body;
    },
  );
}

// %f, %e and %g of C for a non negative number
function formatFloat(value: number, conversion: string, precision: number, alternate: boolean): string {
  if (!Number.isFinite(value)) return Number.isNaN(value) ? "nan" : "inf";
  const exponential = (digits: number) => {
    const [mantissa, exponent] = value.toExponential(digits).split("e");
    const e = Number(exponent);
    return `${mantissa}e${e < 0 ? "-" : "+"}${Math.abs(e).toString().padStart(2, "0")}`;
  };
  let text: string;
  switch (conversion) {
    case "f":
    case "F":
      text = value.toFixed(precision);
      break;
    case "e":
    case "E":
      text = exponential(precision);
      break;
    default: {
      // %g: the shorter of %e and %f with `precision` significant digits, without trailing zeros
      const significant = precision === 0 ? 1 : precision;
      const exponent = value === 0 ? 0 : Math.floor(Math.log10(Number(value.toExponential(significant - 1))));
      text =
        exponent < -4 || exponent >= significant ? exponential(significant - 1) : value.toFixed(Math.max(0, significant - 1 - exponent));
      // Trailing zeros of the decimals (and the point, if nothing is left after it)
      if (!alternate && text.includes(".")) text = text.replace(/(\.\d*?)0+(e|$)/, "$1$2").replace(/\.(e|$)/, "$1");
    }
  }
  return conversion === conversion.toUpperCase() ? text.toUpperCase() : text;
}
