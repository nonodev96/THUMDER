import { Double64, Float32, Int32 } from "@core/TypesData";
import { describe, expect, it } from "vitest";

describe("Float32", () => {
  it("gives the hexadecimal of its IEEE 754 bits", () => {
    const float = new Float32();
    float.binary = "01000000010010001111010111000011"; // 3.14
    expect(float.hexValue).toBe("4048F5C3");
    expect(float.value).toBeCloseTo(3.14, 6);
  });

  it("reads the IEEE 754 bits from hexadecimal", () => {
    const float = new Float32();
    float.hexValue = "0xC0200000";
    expect(float.value).toBe(-2.5);
  });

  it("keeps the bits of a NaN with payload", () => {
    const float = new Float32();
    float.hexValue = "7FC00001";
    expect(float.hexValue).toBe("7FC00001");
    expect(Number.isNaN(float.value)).toBe(true);
  });

  it("only accepts 32 bits", () => {
    expect(() => {
      new Float32().binary = "101";
    }).toThrow();
  });
});

describe("Double64", () => {
  it("keeps all the bits", () => {
    const double = new Double64();
    double.hexValue = "400921FB54442D18";
    expect(double.value).toBe(Math.PI);
    expect(double.hexValue).toBe("400921FB54442D18");
  });
});

describe("Int32", () => {
  it("converts between binary and hexadecimal", () => {
    const int = new Int32();
    int.hexValue = "FFFFFFFF";
    expect(int.binary).toBe("1".repeat(32));
    int.binary = "1010";
    expect(int.hexValue).toBe("0000000a");
  });
});
