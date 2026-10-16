import { ASCII_TABLE } from "@app/CONSTANTS";
import type { TypeAddress } from "@app/Types";

// The conversions of the simulator, in one place. The registers and the memory keep their values as bits: strings of 0
// and 1, the most significant bit first. Hexadecimal and binary go through BigInt (exact for 64 bits, which do not fit
// in a Number), and IEEE 754 through DataView (big-endian, whatever the endianness of the machine).

const BITS = /^[01]*$/;
const HEX = /^[0-9a-f]*$/i;

/** Whether a text is a hexadecimal number, with or without 0x */
export function isHex(text: string): boolean {
  return /^(0x)?[0-9a-f]+$/i.test(text.trim());
}

export function hexToBigInt(hex: string): bigint {
  const digits = hex.trim().replace(/^0x/i, "");
  if (!HEX.test(digits)) throw new Error(`Invalid hexadecimal value: "${hex}"`);
  return digits === "" ? 0n : BigInt(`0x${digits}`);
}

/** A hexadecimal number as a Number (an address, an index of the memory) */
export function hexToNumber(hex: string): number {
  return Number(hexToBigInt(hex));
}

/** The bits of a hexadecimal number, `width` bits with the leading zeros */
export function hexToBits(hex: string, width = 32): string {
  return hexToBigInt(hex).toString(2).padStart(width, "0");
}

/** The hexadecimal digits of some bits (in capitals, no 0x), `digits` digits with the leading zeros */
export function bitsToHex(bits: string, digits = Math.ceil(bits.length / 4)): string {
  if (!BITS.test(bits)) throw new Error(`Invalid binary value: "${bits}"`);
  return (bits === "" ? 0n : BigInt(`0b${bits}`)).toString(16).toUpperCase().padStart(digits, "0");
}

/** Some bits as an unsigned number (exact up to 53 bits) */
export function bitsToUnsigned(bits: string): number {
  return Number(bits === "" ? 0n : BigInt(`0b${bits}`));
}

/** An address (or an index of the memory) as THUMDER writes it: 0x and 8 digits. A negative value wraps around */
export function toAddress(value: number): TypeAddress {
  return `0x${(value >>> 0).toString(16).toUpperCase().padStart(8, "0")}`;
}

// Two's complement: a negative value keeps its sign bit (-1 is all ones)
export function int8ToBits(value: number): string {
  return (value & 0xff).toString(2).padStart(8, "0");
}

export function int16ToBits(value: number): string {
  return (value & 0xffff).toString(2).padStart(16, "0");
}

export function int32ToBits(value: number): string {
  return (value >>> 0).toString(2).padStart(32, "0");
}

/** The bytes of a number in IEEE 754 (big-endian) */
function ieee754Bytes(value: number, bytes: 4 | 8): number[] {
  const view = new DataView(new ArrayBuffer(bytes));
  if (bytes === 4) view.setFloat32(0, value);
  else view.setFloat64(0, value);
  return Array.from(new Uint8Array(view.buffer));
}

function bitsToView(bits: string, width: 32 | 64): DataView {
  if (bits.length !== width || !BITS.test(bits)) throw new Error(`Binary cannot be converted because the length is not ${width}.`);
  const view = new DataView(new ArrayBuffer(width / 8));
  for (let i = 0; i < width / 8; i++) view.setUint8(i, Number.parseInt(bits.slice(i * 8, i * 8 + 8), 2));
  return view;
}

const byteBits = (byte: number) => byte.toString(2).padStart(8, "0");
const byteList = (bytes: number[]) => `[${bytes.map((byte) => byte.toString().padStart(3, "0")).join("-")}]`;

export function float32ToBits(value: number): string {
  return ieee754Bytes(value, 4).map(byteBits).join("");
}

export function float64ToBits(value: number): string {
  return ieee754Bytes(value, 8).map(byteBits).join("");
}

export function bitsToFloat32(bits: string): number {
  return bitsToView(bits, 32).getFloat32(0);
}

export function bitsToFloat64(bits: string): number {
  return bitsToView(bits, 64).getFloat64(0);
}

/** The bytes of a single precision number, in decimal: [063-128-000-000] for 1 */
export function float32Bytes(value: number): string {
  return byteList(ieee754Bytes(value, 4));
}

export function float64Bytes(value: number): string {
  return byteList(ieee754Bytes(value, 8));
}

/** The pieces of `size` bits of some bits, as unsigned numbers */
function pieces(bits: string, size: number): number[] {
  const list: number[] = [];
  for (let i = 0; i < bits.length; i += size) list.push(bitsToUnsigned(bits.slice(i, i + size)));
  return list;
}

/** 0x and the hexadecimal digits: 0x0000000A */
export function formatHex(bits: string): string {
  return `0x${bitsToHex(bits)}`;
}

/** The bytes of a word, in decimal: [000-001-002-255] */
export function formatBytes(bits: string): string {
  return byteList(pieces(bits, 8));
}

/** The two half words of a word, in decimal: [00001-65535] */
export function formatHalfWords(bits: string): string {
  return `[${pieces(bits, 16)
    .map((half) => half.toString().padStart(5, "0"))
    .join("-")}]`;
}

/** A word, unsigned, in decimal: [0000000010] */
export function formatWord(bits: string): string {
  return `[${bitsToUnsigned(bits).toString().padStart(10, "0")}]`;
}

const ASCII = new Map(ASCII_TABLE.map(({ binary, ascii }) => [Number.parseInt(binary, 2), ascii]));

/** The character of a byte: its name for the control ones (NUL, LF) and \xNN beyond ASCII */
export function byteToAscii(bits: string): string {
  const byte = bitsToUnsigned(bits);
  return ASCII.get(byte) ?? `\\x${byte.toString(16).toUpperCase().padStart(2, "0")}`;
}

/** The characters of a word: [  H-  o-  l-  a] */
export function formatAscii(bits: string): string {
  const chars: string[] = [];
  for (let i = 0; i < bits.length; i += 8) chars.push(byteToAscii(bits.slice(i, i + 8)).padStart(3, " "));
  return `[${chars.join("-")}]`;
}

/** A number from a base to another one, with `length` digits at least */
export function changeBase(value: number | string, from: number, to: number, length = 0, fill = "0"): string {
  return Number.parseInt(value.toString(), from).toString(to).padStart(length, fill);
}
