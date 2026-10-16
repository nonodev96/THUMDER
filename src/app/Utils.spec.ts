import { Utils } from "@app/Utils";
import { describe, expect, it } from "vitest";

describe("Utils.convertHexCodeToTextMachineInstructionDLX", () => {
  it("writes the instruction of a word as the simulator does, and a .word when it is not one", () => {
    expect(Utils.convertHexCodeToTextMachineInstructionDLX("0x20010000")).toBe("addi R1,R0,0");
    expect(Utils.convertHexCodeToTextMachineInstructionDLX("44000005")).toBe("trap 5");
    expect(Utils.convertHexCodeToTextMachineInstructionDLX("0xFFFFFFFF")).toBe(".word 0xFFFFFFFF");
  });
});

describe("Utils", () => {
  it("writes the addresses of the simulator with 8 digits", () => {
    expect(Utils.stringToAddress("100")).toBe("0x00000100");
    expect(Utils.stringToAddress("0x1004")).toBe("0x00001004");
  });

  it("writes the dates with two digits for each part", () => {
    expect(Utils.dateToStringFormat(new Date(2026, 0, 5, 7, 8, 9))).toBe("2026/01/05 07:08:09");
  });

  it("makes version 4 UUIDs, also without randomUUID (plain HTTP)", () => {
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    expect(Utils.uuidv4()).toMatch(uuid);
    const original = crypto.randomUUID;
    Object.defineProperty(crypto, "randomUUID", { value: undefined, configurable: true });
    try {
      expect(Utils.uuidv4()).toMatch(uuid);
    } finally {
      Object.defineProperty(crypto, "randomUUID", { value: original, configurable: true });
    }
  });
});
