import { valueToBinary } from "@core/DLX/typeDataValues";
import { describe, expect, it } from "vitest";

const toBinary = valueToBinary;

describe("valueToBinary", () => {
  it("writes integers with the width of their type, negatives in two's complement", () => {
    expect(toBinary("Byte", 65)).toBe("01000001");
    expect(toBinary("Byte", -1)).toBe("11111111");
    expect(toBinary("HalfWord", 65535)).toBe("1".repeat(16));
    expect(toBinary("Word", -2)).toBe(`${"1".repeat(31)}0`);
  });

  it("rejects integers that do not fit", () => {
    expect(toBinary("Byte", 256)).toBeNull();
    expect(toBinary("Byte", -129)).toBeNull();
    expect(toBinary("HalfWord", 1.5)).toBeNull();
  });

  it("writes floating point numbers in IEEE 754", () => {
    expect(toBinary("Float", 1)).toBe(`0011111110000000${"0".repeat(16)}`);
    expect(toBinary("Double", -2)).toBe(`1100000000000000${"0".repeat(48)}`);
  });
});
