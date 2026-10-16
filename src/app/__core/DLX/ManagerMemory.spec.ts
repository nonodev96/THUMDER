import { ManagerMemory } from "@core/DLX/ManagerMemory";
import { describe, expect, it } from "vitest";

const bytesAt = (memory: ManagerMemory, index: number, count: number) => Array.from(memory._memoryInt8Array.slice(index, index + count));

describe("ManagerMemory", () => {
  it("stores words in big-endian order", () => {
    const memory = new ManagerMemory(64);
    memory.setMemoryWordBinaryByAddress("0x00000004", "00010010001101000101011001111000"); // 0x12345678
    expect(bytesAt(memory, 4, 4)).toEqual([0x12, 0x34, 0x56, 0x78]);
    expect(memory.getMemoryWordBinaryByIndex(4)).toBe("00010010001101000101011001111000");
    expect(memory.getMemoryHalfWordBinaryByIndex(6)).toBe("0101011001111000");
    expect(memory.getMemoryByteBinaryByIndex(5)).toBe("00110100");
  });

  it("writes every byte of a double (and not all of them at the same address)", () => {
    const memory = new ManagerMemory(64);
    memory.processMemoryToUpdateArray([{ typeData: "Double", address: "0x00000008", value: "400921FB54442D18" }]);
    expect(bytesAt(memory, 8, 8)).toEqual([0x40, 0x09, 0x21, 0xfb, 0x54, 0x44, 0x2d, 0x18]);
  });

  it("writes a double with leading zeros in its place", () => {
    const memory = new ManagerMemory(64);
    memory.processMemoryToUpdateArray([{ typeData: "Double", address: "0x00000000", value: "3FF0000000000000" }]);
    expect(bytesAt(memory, 0, 8)).toEqual([0x3f, 0xf0, 0, 0, 0, 0, 0, 0]);
  });

  it("writes floats, half words and bytes with their width", () => {
    const memory = new ManagerMemory(64);
    memory.processMemoryToUpdateArray([
      { typeData: "Float", address: "0x00000000", value: "0x3F800000" },
      { typeData: "HalfWord", address: "0x00000004", value: "0x0000ABCD" },
      { typeData: "Byte", address: "0x00000007", value: "0x00000041" },
    ]);
    expect(bytesAt(memory, 0, 8)).toEqual([0x3f, 0x80, 0, 0, 0xab, 0xcd, 0, 0x41]);
  });

  it("fails clearly outside the memory", () => {
    const memory = new ManagerMemory(16);
    expect(() => memory.getMemoryWordBinaryByIndex(64)).toThrow(RangeError);
    expect(() => memory.setMemoryWordBinaryByIndex(-4, "0".repeat(32))).toThrow(RangeError);
    expect(memory.isInMemory(12, 4)).toBe(true);
    expect(memory.isInMemory(13, 4)).toBe(false);
  });

  it("checks the width of the value", () => {
    const memory = new ManagerMemory(16);
    expect(() => memory.setMemoryWordBinaryByIndex(0, "101")).toThrow(/Expected 32 bits/);
  });

  it("lists one word per 4 bytes of memory", () => {
    const memory = new ManagerMemory(32);
    expect(memory.memorySizeBytes).toBe(32);
    expect(memory.getAllIndexByWord()).toEqual([0, 4, 8, 12, 16, 20, 24, 28]);
    expect(memory.getAllMemoryWord()).toHaveLength(8);
  });

  it("empties the memory when its size changes", () => {
    const memory = new ManagerMemory(16);
    memory.setMemoryByteBinaryByIndex(0, "11111111");
    memory.setSize(32);
    expect(memory.memorySizeBytes).toBe(32);
    expect(memory.getMemoryByteBinaryByIndex(0)).toBe("00000000");
    expect(memory.getAllMemoryWord()).toHaveLength(8);
  });

  it("reads and writes any width", () => {
    const memory = new ManagerMemory(16);
    memory.setMemoryBinaryByIndex(2, "1111000011110000");
    expect(memory.getMemoryBinaryByIndex(2, 2)).toBe("1111000011110000");
  });
});
