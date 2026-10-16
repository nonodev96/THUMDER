import type { TypeAddress } from "@app/Types";
import { decode, disassemble } from "@core/engine/isa";
import { hexToNumber, toAddress } from "@core/numbers";

// The conversions of numbers are in core/numbers.ts
export namespace Utils {
  /** YYYY/mm/dd HH:MM:SS */
  export function dateToStringFormat(dt: Date): string {
    const two = (n: number) => n.toString().padStart(2, "0");
    return `${dt.getFullYear().toString().padStart(4, "0")}/${two(dt.getMonth() + 1)}/${two(dt.getDate())} ${two(dt.getHours())}:${two(dt.getMinutes())}:${two(dt.getSeconds())}`;
  }

  /** An address written by the simulator (0x100, 00000100) as THUMDER writes it: 0x00000100 */
  export function stringToAddress(str: string): TypeAddress {
    return toAddress(hexToNumber(str));
  }

  export function getRegisterNumber(str: string | number): number {
    return Number.parseInt(str.toString().replace(/\D/g, ""), 10);
  }

  export function clone<T>(data: T) {
    return JSON.parse(JSON.stringify(data));
  }

  export function isNullOrUndefined(object: unknown): boolean {
    return object == null;
  }

  /** A random UUID (version 4). randomUUID needs a secure context, and the web app can be served over plain HTTP */
  export function uuidv4(): string {
    if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  /** The instruction of a word of code, as the simulator writes it (the same decoder as the simulator: engine/isa.ts) */
  export function convertHexCodeToTextMachineInstructionDLX(hexCode: string, address = 0): string {
    const word = hexToNumber(hexCode) >>> 0;
    const decoded = decode(word);
    return decoded ? disassemble(decoded, address) : `.word 0x${word.toString(16).toUpperCase().padStart(8, "0")}`;
  }
}
