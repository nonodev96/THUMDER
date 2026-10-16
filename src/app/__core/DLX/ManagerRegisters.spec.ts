import { ManagerRegisters } from "@core/DLX/ManagerRegisters";
import { describe, expect, it } from "vitest";

describe("ManagerRegisters", () => {
  it("applies control, integer and float registers", () => {
    const registers = new ManagerRegisters();
    registers.processRegisterToUpdateArray([
      { typeRegister: "Control", register: "PC", hexadecimalValue: "0x00000100" },
      { typeRegister: "Integer", register: "R5", hexadecimalValue: "0xFFFFFFFF" },
      { typeRegister: "Float", register: "F3", hexadecimalValue: "3F800000" },
    ]);
    expect(registers.PC.hexValue).toBe("00000100");
    expect(registers.R[5].binary).toBe("1".repeat(32));
    expect(registers.F[3].value).toBe(1);
  });

  it("applies a double sent by THUMDER-server as two 32-bit halves", () => {
    const registers = new ManagerRegisters();
    registers.processRegisterToUpdateArray([
      { typeRegister: "Double", register: "F4", hexadecimalValue: "400921FB" },
      { typeRegister: "Double", register: "F5", hexadecimalValue: "54442D18" },
    ]);
    expect(registers.F[4].hexValue).toBe("400921FB");
    expect(registers.F[5].hexValue).toBe("54442D18");
  });

  it("applies a whole 64-bit double to the pair of registers", () => {
    const registers = new ManagerRegisters();
    registers.processRegisterToUpdateArray([{ typeRegister: "Double", register: "F2", hexadecimalValue: "0x3FF0000000000000" }]);
    expect(registers.F[2].hexValue).toBe("3FF00000");
    expect(registers.F[3].hexValue).toBe("00000000");
  });

  it("only takes even registers for doubles", () => {
    const registers = new ManagerRegisters();
    expect(() => registers.setRegisterDoubleWithHexadecimal(31, "0")).toThrow(/Register Double/);
    expect(() => registers.setRegisterDoubleWithHexadecimal(3, "0")).toThrow(/Register Double/);
  });

  it("checks the registers", () => {
    const registers = new ManagerRegisters();
    expect(() => registers.setRegisterIntegerWithHexadecimal(32, "0")).toThrow(/Register Integer/);
    // biome-ignore lint/suspicious/noExplicitAny: an unknown register on purpose
    expect(() => registers.setRegisterControlWithHexadecimal("XYZ" as any, "0")).toThrow(/Register Control/);
  });

  it("clears everything on reset", () => {
    const registers = new ManagerRegisters();
    registers.setRegisterIntegerWithHexadecimal(1, "0x10");
    registers.setRegisterFloatWithHexadecimal(1, "0x3F800000");
    registers.reset();
    expect(registers.R[1].hexValue).toBe("00000000");
    expect(registers.F[1].hexValue).toBe("00000000");
  });
});
