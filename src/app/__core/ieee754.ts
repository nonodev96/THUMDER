import { bitsToFloat32, bitsToFloat64, float32ToBits, float64ToBits } from "@core/numbers";

// IEEE 754 for the calculator: the fields of a single or double precision number (sign, exponent and fraction), what
// they mean, and the exact value the bits keep, written in decimal (computed with BigInt, so nothing is rounded)

export type FloatFormat = { bits: 32 | 64; exponent: number; fraction: number; bias: number };

export const SINGLE: FloatFormat = { bits: 32, exponent: 8, fraction: 23, bias: 127 };
export const DOUBLE: FloatFormat = { bits: 64, exponent: 11, fraction: 52, bias: 1023 };

export type FloatKind = "zero" | "subnormal" | "normal" | "infinity" | "nan";

export type Decoded = {
  sign: 0 | 1;
  exponentBits: string;
  fractionBits: string;
  /** The exponent as it is kept (unsigned), and the one it means (without the bias) */
  storedExponent: number;
  exponent: number;
  kind: FloatKind;
  /** The significand: 1.fraction (normal) or 0.fraction (subnormal), exact, in decimal */
  significand: string;
  value: number;
  /** The value the bits keep, exact, in decimal */
  exact: string;
};

/** The bits of a number in a format (the nearest one it can keep) */
export function encode(value: number, format: FloatFormat): string {
  return format.bits === 32 ? float32ToBits(value) : float64ToBits(value);
}

export function numberOf(bits: string, format: FloatFormat): number {
  return format.bits === 32 ? bitsToFloat32(bits) : bitsToFloat64(bits);
}

/** A number written by a person: with a point or a comma, an exponent (1e-3), Infinity or NaN; null if it is not one */
export function parseDecimal(text: string): number | null {
  const clean = text.trim().replace(/\s/g, "").replace(",", ".").toLowerCase();
  if (/^[+-]?(inf|infinity|∞)$/.test(clean)) return clean.startsWith("-") ? -Infinity : Infinity;
  if (clean === "nan") return Number.NaN;
  if (!/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/.test(clean)) return null;
  return Number(clean);
}

/** m × 2^k as an exact decimal: the digits of m × 5^-k with the point -k places from the end */
function exactOf(mantissa: bigint, power: number): string {
  if (power >= 0) return (mantissa << BigInt(power)).toString();
  const places = -power;
  const digits = (mantissa * 5n ** BigInt(places)).toString().padStart(places + 1, "0");
  const integer = digits.slice(0, digits.length - places);
  const fraction = digits.slice(digits.length - places).replace(/0+$/, "");
  return fraction ? `${integer}.${fraction}` : integer;
}

export function decode(bits: string, format: FloatFormat): Decoded {
  const sign = bits[0] === "1" ? 1 : 0;
  const exponentBits = bits.slice(1, 1 + format.exponent);
  const fractionBits = bits.slice(1 + format.exponent);
  const storedExponent = Number.parseInt(exponentBits, 2);
  const fraction = BigInt(`0b${fractionBits}`);
  const allOnes = storedExponent === 2 ** format.exponent - 1;
  const kind: FloatKind = allOnes
    ? fraction === 0n
      ? "infinity"
      : "nan"
    : storedExponent === 0
      ? fraction === 0n
        ? "zero"
        : "subnormal"
      : "normal";
  // Subnormal numbers have the exponent of the smallest normal one and no hidden 1
  const exponent = storedExponent === 0 ? 1 - format.bias : storedExponent - format.bias;
  const mantissa = kind === "normal" ? (1n << BigInt(format.fraction)) | fraction : fraction;
  const finite = kind !== "infinity" && kind !== "nan";
  const significand = finite || kind === "infinity" ? exactOf(mantissa, -format.fraction) : "";
  const magnitude = finite ? exactOf(mantissa, exponent - format.fraction) : kind === "infinity" ? "∞" : "NaN";
  return {
    sign,
    exponentBits,
    fractionBits,
    storedExponent,
    exponent,
    kind,
    significand,
    value: numberOf(bits, format),
    exact: kind === "nan" ? "NaN" : `${sign === 1 ? "-" : ""}${magnitude}`,
  };
}

/** Whether a number written in decimal (without exponent) is exactly the value the bits keep */
export function isExact(text: string, exact: string): boolean | null {
  const clean = text.trim().replace(",", ".");
  if (!/^[+-]?\d*\.?\d*$/.test(clean) || !/\d/.test(clean)) return null;
  const normal = (value: string) => {
    const negative = value.startsWith("-");
    const [integer, fraction = ""] = value.replace(/^[+-]/, "").split(".");
    const digits = `${integer.replace(/^0+(?=\d)/, "") || "0"}${fraction.replace(/0+$/, "") ? `.${fraction.replace(/0+$/, "")}` : ""}`;
    return digits === "0" ? "0" : `${negative ? "-" : ""}${digits}`;
  };
  return normal(clean) === normal(exact);
}
