import { DOUBLE, decode, encode, isExact, parseDecimal, SINGLE } from "@core/ieee754";
import { describe, expect, it } from "vitest";

describe("IEEE 754 in the calculator", () => {
  it("splits a single precision number in its fields and says what they mean", () => {
    const three = decode(encode(3, SINGLE), SINGLE);
    expect(three).toMatchObject({
      sign: 0,
      exponentBits: "10000000",
      storedExponent: 128,
      exponent: 1,
      kind: "normal",
      significand: "1.5",
      value: 3,
      exact: "3",
    });
    expect(three.fractionBits).toBe(`1${"0".repeat(22)}`);
    expect(decode(encode(-0.75, SINGLE), SINGLE)).toMatchObject({ sign: 1, exponent: -1, significand: "1.5", exact: "-0.75" });
  });

  it("keeps the exact value: 0.1 is not 0.1", () => {
    expect(decode(encode(0.1, SINGLE), SINGLE).exact).toBe("0.100000001490116119384765625");
    expect(decode(encode(0.1, DOUBLE), DOUBLE).exact).toBe("0.1000000000000000055511151231257827021181583404541015625");
    expect(isExact("0.1", decode(encode(0.1, SINGLE), SINGLE).exact)).toBe(false);
    expect(isExact("0,500", decode(encode(0.5, SINGLE), SINGLE).exact)).toBe(true);
    expect(isExact("1e3", "1000")).toBeNull();
  });

  it("tells zeros, subnormal numbers, infinities and NaN", () => {
    expect(decode(encode(0, SINGLE), SINGLE).kind).toBe("zero");
    expect(decode(encode(-0, DOUBLE), DOUBLE)).toMatchObject({ kind: "zero", sign: 1, exact: "-0" });
    const tiny = decode(`0${"0".repeat(8)}${"0".repeat(22)}1`, SINGLE);
    expect(tiny).toMatchObject({ kind: "subnormal", exponent: -126, significand: "0.00000011920928955078125" });
    expect(tiny.value).toBe(2 ** -149);
    expect(decode(encode(Number.NEGATIVE_INFINITY, DOUBLE), DOUBLE)).toMatchObject({ kind: "infinity", exact: "-∞" });
    expect(decode(encode(Number.NaN, SINGLE), SINGLE)).toMatchObject({ kind: "nan", exact: "NaN" });
  });

  it("reads what a person writes", () => {
    expect(parseDecimal("1,5")).toBe(1.5);
    expect(parseDecimal(" -2.5e-3 ")).toBe(-0.0025);
    expect(parseDecimal(".5")).toBe(0.5);
    expect(parseDecimal("-Infinity")).toBe(Number.NEGATIVE_INFINITY);
    expect(parseDecimal("NaN")).toBeNaN();
    expect(parseDecimal("1.2.3")).toBeNull();
    expect(parseDecimal("")).toBeNull();
  });
});
