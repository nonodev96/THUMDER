import { Injectable, inject, signal } from "@angular/core";
import type { TypeData, TypeRegister, TypeRegisterToEdit } from "@app/Types";
import { DOUBLE, decode, encode, numberOf, parseDecimal, SINGLE } from "@core/ieee754";
import { bitsToHex, formatAscii, formatBytes, formatHalfWords } from "@core/numbers";
import { ModalService } from "@shared/directives/bootstrap/modal.directive";

/** The ids of the dialogs (layout-auth.component.html) */
export const EDIT_REGISTER_MODAL = "modal-EditRegister";
export const EDIT_MEMORY_MODAL = "editMemoryModal";

/** The types of data the memory dialog writes */
export type MemoryTypeData = Exclude<TypeData, "ASCII">;

/** What the dialog of the registers opens on: a kind and, optionally, one of its registers */
export type RegisterEditRequest = { kind?: TypeRegister; register?: TypeRegisterToEdit };

/** What the dialog of the memory opens on: an address (an index of the memory) and, optionally, a type of data */
export type MemoryEditRequest = { address?: number; typeData?: MemoryTypeData };

/**
 * Opens the dialogs that edit a register or the memory, on what the view asks for (the toolbar of a card, a row of a
 * table). Each request is a new object, so the dialog sees it also when it asks for the same register again.
 */
@Injectable({
  providedIn: "root",
})
export class EditRequestService {
  private readonly modals = inject(ModalService);
  private readonly registerSignal = signal<RegisterEditRequest | null>(null);
  private readonly memorySignal = signal<MemoryEditRequest | null>(null);

  public readonly register = this.registerSignal.asReadonly();
  public readonly memory = this.memorySignal.asReadonly();

  public editRegister(request: RegisterEditRequest, opener: HTMLElement | null): void {
    this.registerSignal.set({ ...request });
    this.modals.open(EDIT_REGISTER_MODAL, opener);
  }

  public editMemory(request: MemoryEditRequest, opener: HTMLElement | null): void {
    this.memorySignal.set({ ...request });
    this.modals.open(EDIT_MEMORY_MODAL, opener);
  }
}

// ─── The values the dialogs edit ─────────────────────────────────────────────────────────────────────────────────────
// A value is some bits (a string of 0 and 1, the most significant first): an integer of 8, 16, 32 or 64 bits, or a
// number in IEEE 754 of 32 or 64 bits. Each input writes it in its own way; BigInt keeps the 64 bits exact.

export type ValueFormat = { bits: 8 | 16 | 32 | 64; float: boolean };

/** The inputs of a value: hexadecimal, decimal with and without sign, a floating point number and a character */
export type ValueField = "hex" | "signed" | "unsigned" | "float" | "char";

/** A field of a number in IEEE 754 (or of none, for an integer) */
export type BitField = "sign" | "exponent" | "fraction" | null;

/** A line of the list of representations: the key of its name in the translations, and its value */
export type Representation = { label: string; value: string };

const unsignedOf = (bits: string) => (bits === "" ? 0n : BigInt(`0b${bits}`));

const ieeeOf = (format: ValueFormat) => (format.bits === 64 ? DOUBLE : SINGLE);

/** The smallest and the largest integer of an input (in decimal) */
export function rangeOf(field: "signed" | "unsigned", format: ValueFormat): { min: string; max: string } {
  const n = BigInt(format.bits);
  if (field === "unsigned") return { min: "0", max: ((1n << n) - 1n).toString() };
  return { min: (-(1n << (n - 1n))).toString(), max: ((1n << (n - 1n)) - 1n).toString() };
}

/** The bits a text of an input means, or null when it is not a valid value for the format */
export function parseValue(field: ValueField, text: string, format: ValueFormat): string | null {
  const clean = text.trim().replace(/[\s_]/g, "");
  const width = format.bits;
  switch (field) {
    case "hex": {
      const digits = clean.replace(/^0x/i, "");
      if (!/^[0-9a-f]+$/i.test(digits) || digits.length > width / 4) return null;
      return BigInt(`0x${digits}`).toString(2).padStart(width, "0");
    }
    case "signed":
    case "unsigned": {
      if (!(field === "signed" ? /^[+-]?\d+$/ : /^\+?\d+$/).test(clean)) return null;
      const value = BigInt(clean);
      const { min, max } = rangeOf(field, format);
      if (value < BigInt(min) || value > BigInt(max)) return null;
      return BigInt.asUintN(width, value).toString(2).padStart(width, "0");
    }
    case "float": {
      const value = parseDecimal(text);
      return value === null ? null : encode(value, ieeeOf(format));
    }
    case "char": {
      const chars = Array.from(text);
      const code = chars.length === 1 ? (chars[0].codePointAt(0) ?? 256) : 256;
      return code < 2 ** width ? code.toString(2).padStart(width, "0") : null;
    }
  }
}

/** The shortest decimal that gives back the same number of 32 bits (0.1, not 0.10000000149011612) */
function shortestFloat32(value: number): string {
  if (!Number.isFinite(value) || value === 0) return Object.is(value, -0) ? "-0" : String(value);
  for (let digits = 1; digits <= 9; digits++) {
    const text = value.toPrecision(digits);
    if (Math.fround(Number(text)) === value) return String(Number(text));
  }
  return String(value);
}

/** How some bits are written in an input */
export function formatValue(field: ValueField, bits: string, format: ValueFormat): string {
  switch (field) {
    case "hex":
      return bitsToHex(bits, format.bits / 4);
    case "unsigned":
      return unsignedOf(bits).toString();
    case "signed":
      return BigInt.asIntN(format.bits, unsignedOf(bits)).toString();
    case "float": {
      const value = numberOf(bits, ieeeOf(format));
      if (format.bits === 32) return shortestFloat32(value);
      return Object.is(value, -0) ? "-0" : String(value);
    }
    case "char": {
      // Only the characters that can be seen: the others are written in the other inputs
      const code = Number(unsignedOf(bits));
      return (code >= 32 && code < 127) || code >= 161 ? String.fromCharCode(code) : "";
    }
  }
}

/** The IEEE 754 field of each bit of a number (or null for every bit of an integer) */
export function fieldOf(index: number, format: ValueFormat): BitField {
  if (!format.float) return null;
  const exponent = format.bits === 64 ? 11 : 8;
  return index === 0 ? "sign" : index <= exponent ? "exponent" : "fraction";
}

/** The value in all the ways the tables of THUMDER show it */
export function representations(bits: string, format: ValueFormat): Representation[] {
  const value = unsignedOf(bits);
  const list: Representation[] = [
    { label: "MACHINE.HEXADECIMAL", value: `0x${bitsToHex(bits, format.bits / 4)}` },
    { label: "EDIT_VALUE.UNSIGNED", value: value.toString() },
    { label: "EDIT_VALUE.SIGNED", value: BigInt.asIntN(format.bits, value).toString() },
    { label: "MACHINE.OCTAL", value: value.toString(8) },
  ];
  if (format.bits >= 16) list.push({ label: "MACHINE.BYTES", value: formatBytes(bits) });
  if (format.bits >= 32) list.push({ label: "MACHINE.TYPE_HALF_WORDS", value: formatHalfWords(bits) });
  if (format.bits === 64) {
    list.push({ label: "EDIT_VALUE.WORDS", value: `[0x${bitsToHex(bits.slice(0, 32))}-0x${bitsToHex(bits.slice(32))}]` });
  }
  list.push({ label: "MACHINE.ASCII", value: formatAscii(bits) });
  if (format.bits >= 32) {
    const ieee = ieeeOf(format);
    list.push({ label: format.bits === 64 ? "TYPE_DATA.IEEE754_64" : "TYPE_DATA.IEEE754", value: String(numberOf(bits, ieee)) });
  }
  return list;
}

/** What the fields of a number in IEEE 754 mean (sign, exponent, fraction, kind and exact value) */
export function ieeeOfBits(bits: string, format: ValueFormat) {
  const ieee = ieeeOf(format);
  return { ...decode(bits, ieee), bias: ieee.bias };
}
