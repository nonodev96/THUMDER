import {
  bitsToFloat32,
  bitsToFloat64,
  bitsToHex,
  bitsToUnsigned,
  byteToAscii,
  changeBase,
  float32Bytes,
  float32ToBits,
  float64Bytes,
  float64ToBits,
  formatAscii,
  formatBytes,
  formatHalfWords,
  formatHex,
  formatWord,
  groupBits,
  hexToBits,
  hexToNumber,
  int8ToBits,
  int16ToBits,
  int32ToBits,
  isHex,
  toAddress,
} from "@core/numbers";
import { describe, expect, it } from "vitest";

// π in double precision and its bits, exact
const PI_HEX = "400921FB54442D18";
const PI_BITS = BigInt(`0x${PI_HEX}`).toString(2).padStart(64, "0");

describe("hexadecimal and binary", () => {
  it("converts 64-bit values without losing the low bits", () => {
    expect(hexToBits(PI_HEX, 64)).toBe(PI_BITS);
    expect(hexToBits(`0x${PI_HEX}`, 64)).toBe(PI_BITS);
    expect(bitsToHex(PI_BITS)).toBe(PI_HEX);
  });

  it("keeps the leading zeros", () => {
    const one = hexToBits("3FF0000000000000", 64);
    expect(one).toHaveLength(64);
    expect(one.startsWith("0011111111110000")).toBe(true);
    expect(hexToBits("0x0000000A")).toBe("1010".padStart(32, "0"));
    expect(hexToBits("A", 8)).toBe("00001010");
    expect(bitsToHex("1010", 8)).toBe("0000000A");
    expect(bitsToHex("", 8)).toBe("00000000");
  });

  it("rejects what is not hexadecimal or binary", () => {
    expect(() => hexToBits("0xG1")).toThrow(/Invalid hexadecimal/);
    expect(() => bitsToHex("102")).toThrow(/Invalid binary/);
    expect([isHex("0x1F"), isHex("1f"), isHex("0x"), isHex("12G")]).toEqual([true, true, false, false]);
  });

  it("reads the limits of a 32-bit word", () => {
    expect(hexToNumber("0x7FFFFFFF")).toBe(2 ** 31 - 1);
    expect(hexToNumber("80000000")).toBe(2 ** 31);
    expect(bitsToUnsigned("1".repeat(32))).toBe(2 ** 32 - 1);
    expect(bitsToUnsigned("")).toBe(0);
  });

  it("writes the addresses with 8 digits, and a negative one wraps around", () => {
    expect(toAddress(0x100)).toBe("0x00000100");
    expect(toAddress(-4)).toBe("0xFFFFFFFC");
    expect(changeBase("ff", 16, 2, 12)).toBe("000011111111");
  });
});

describe("two's complement", () => {
  it("keeps the sign of negative values", () => {
    expect(int8ToBits(-1)).toBe("11111111");
    expect(int8ToBits(-128)).toBe("10000000");
    expect(int16ToBits(-2)).toBe("1111111111111110");
    expect(int32ToBits(-1)).toBe("1".repeat(32));
    expect(int32ToBits(-(2 ** 31))).toBe(`1${"0".repeat(31)}`);
  });

  it("converts positive values", () => {
    expect(int8ToBits(255)).toBe("11111111");
    expect(int16ToBits(258)).toBe("0000000100000010");
    expect(int32ToBits(2 ** 31 - 1)).toBe(`0${"1".repeat(31)}`);
    expect(int32ToBits(2 ** 32 - 1)).toBe("1".repeat(32));
  });
});

describe("IEEE 754", () => {
  it.each([
    [0, "00000000"],
    [-0, "80000000"],
    [1, "3F800000"],
    [-1, "BF800000"],
    [-2.5, "C0200000"],
    [Math.fround(Math.PI), "40490FDB"],
    [Number.POSITIVE_INFINITY, "7F800000"],
    [Number.NEGATIVE_INFINITY, "FF800000"],
    // The smallest subnormal and the largest one
    [2 ** -149, "00000001"],
    [Math.fround(2 ** -126 - 2 ** -149), "007FFFFF"],
  ])("single precision: %s is %s", (value, hex) => {
    const bits = float32ToBits(value);
    expect(bitsToHex(bits)).toBe(hex);
    expect(Object.is(bitsToFloat32(bits), value)).toBe(true);
  });

  it.each([
    [0, "0000000000000000"],
    [-0, "8000000000000000"],
    [1, "3FF0000000000000"],
    [-1, "BFF0000000000000"],
    [Math.PI, PI_HEX],
    [Number.POSITIVE_INFINITY, "7FF0000000000000"],
    [Number.NEGATIVE_INFINITY, "FFF0000000000000"],
    [Number.MIN_VALUE, "0000000000000001"],
  ])("double precision: %s is %s", (value, hex) => {
    const bits = float64ToBits(value);
    expect(bitsToHex(bits)).toBe(hex);
    expect(Object.is(bitsToFloat64(bits), value)).toBe(true);
  });

  it("reads NaN, with or without a payload", () => {
    expect(bitsToHex(float32ToBits(Number.NaN))).toBe("7FC00000");
    expect(bitsToFloat32(hexToBits("7FC00001"))).toBeNaN();
    expect(bitsToFloat64(hexToBits("7FF8000000000001", 64))).toBeNaN();
  });

  it("rejects bits of the wrong length", () => {
    expect(() => bitsToFloat32("1".repeat(31))).toThrow(/not 32/);
    expect(() => bitsToFloat64("1".repeat(32))).toThrow(/not 64/);
  });

  it("lists the bytes in big-endian order", () => {
    expect(float32Bytes(1)).toBe("[063-128-000-000]");
    expect(float64Bytes(Math.PI)).toBe("[064-009-033-251-084-068-045-024]");
  });
});

describe("the columns of the registers and the memory", () => {
  const word = hexToBits("4F6C610A");

  it("shows the bits in bytes, to read them", () => {
    expect(groupBits(word)).toBe("01001111 01101100 01100001 00001010");
    expect(groupBits(PI_BITS).split(" ")).toHaveLength(8);
    expect(groupBits("10101", 4)).toBe("1010 1");
    expect(groupBits("")).toBe("");
  });

  it("shows a word in hexadecimal, as bytes, half words and an unsigned word", () => {
    expect(formatHex(word)).toBe("0x4F6C610A");
    expect(formatHex(PI_BITS)).toBe(`0x${PI_HEX}`);
    expect(formatBytes(word)).toBe("[079-108-097-010]");
    expect(formatHalfWords(word)).toBe("[20332-24842]");
    expect(formatWord(word)).toBe("[1332502794]");
    expect(formatWord("1".repeat(32))).toBe("[4294967295]");
  });

  it("shows the characters of a word, the control ones by name and beyond ASCII in hexadecimal", () => {
    expect(formatAscii(word)).toBe("[  O-  l-  a- LF]");
    expect(byteToAscii("00000000")).toBe("NUL");
    expect(byteToAscii("11111111")).toBe("\\xFF");
  });
});
