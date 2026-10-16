import { EXAMPLES } from "@core/engine/examples.spec-helper";
import { assemble, evaluate } from "@core/engine/assembler";
import { decode, disassemble } from "@core/engine/isa";
import { describe, expect, it } from "vitest";

const example = (name: string) => EXAMPLES[name];
const MEMORY = 0x8000;
const words = (memory: Uint8Array, address: number, count: number) =>
  Array.from({ length: count }, (_, i) => new DataView(memory.buffer).getUint32(address + 4 * i));

describe("evaluate", () => {
  const symbols = new Map([
    ["Count", 0x1000],
    ["$DATA", 0x1000],
  ]);
  const value = (expression: string) => evaluate(expression, (name) => symbols.get(name) ?? Number.NaN);

  it("follows the precedence of C", () => {
    expect(value("1 + 2 * 3")).toBe(7);
    expect(value("(1 + 2) * 3")).toBe(9);
    expect(value("1 << 4 | 1")).toBe(17);
    expect(value("Count*4")).toBe(0x4000);
    expect(value("-8 >> 1")).toBe(-4);
    expect(value("~0 & 0xff")).toBe(255);
  });

  it("reads decimal, hexadecimal, octal and character numbers, and # immediates", () => {
    expect(value("0x1F")).toBe(31);
    expect(value("017")).toBe(15);
    expect(value("'0'")).toBe(48);
    expect(value("#12")).toBe(12);
  });

  it("rejects bad expressions", () => {
    expect(() => value("1 +")).toThrow();
    expect(() => value("08")).toThrow(/octal/);
  });
});

describe("assemble", () => {
  it("encodes like WinDLX", () => {
    const program = assemble(
      [
        {
          name: "a.s",
          content: `
        .data
Count:  .word 10
Table:  .space 8
        .text
main:   addi r1,r0,0
        seq r4,r1,r3
        lw r5,Table(r3)
        divu r6,r2,r5
        sw Table(r1),r2
        lhi r14,Count>>16
        addd f2,f4,f6
        bnez r4,main
        j main
        trap 0`,
        },
      ],
      { memorySize: MEMORY },
    );
    expect(program.messages).toEqual([]);
    expect(program.symbols.get("Count")).toBe(0x1000);
    expect(program.symbols.get("Table")).toBe(0x1004);
    expect(program.instructions.map((i) => i.word.toString(16).padStart(8, "0"))).toEqual([
      "20010000", // addi r1,r0,0
      "00232028", // seq r4,r1,r3
      "8c651004", // lw r5,0x1004(r3)
      "0045301b", // divu r6,r2,r5
      "ac221004", // sw 0x1004(r1),r2
      "3c0e0000", // lhi r14,0
      "04861004", // addd f2,f4,f6
      "1480ffe0", // bnez r4,main (-32)
      "0bffffdc", // j main (-36)
      "44000000", // trap 0
    ]);
    expect(words(program.memory, 0x1000, 1)).toEqual([10]);
  });

  it("disassembles what it assembles", () => {
    const program = assemble([{ name: "a.s", content: " .text\nloop: subi r2,r2,1\n bnez r2,loop\n ld f0,8(r1)\n sf -4(r2),f3" }], {
      memorySize: MEMORY,
    });
    expect(program.instructions.map((i) => disassemble(decode(i.word)!, i.address))).toEqual([
      "subi R2,R2,1",
      "bnez R2,0x100",
      "ld F0,8(R1)",
      "sf -4(R2),F3",
    ]);
  });

  it("stores the data of the directives", () => {
    const program = assemble(
      [{ name: "a.s", content: ' .data 0x2000\nb: .byte 1, -1\n .align 2\nh: .ascii "AB"\n .asciiz "C"\n .align 3\nd: .double 1.5\nf: .float -2' }],
      { memorySize: MEMORY },
    );
    expect(program.ok).toBe(true);
    expect(Array.from(program.memory.slice(0x2000, 0x2002))).toEqual([1, 255]);
    expect(program.symbols.get("h")).toBe(0x2004);
    expect(String.fromCharCode(...program.memory.slice(0x2004, 0x2008))).toBe("ABC\0");
    expect(program.symbols.get("d")).toBe(0x2008);
    expect(new DataView(program.memory.buffer).getFloat64(0x2008)).toBe(1.5);
    expect(new DataView(program.memory.buffer).getFloat32(0x2010)).toBe(-2);
  });

  it("reports the errors with their line", () => {
    const program = assemble(
      [{ name: "a.s", content: " .text\n addi r1,r0\n foo r1\n lw r1,Nowhere\n addd f1,f2,f4\n ld f0,100000(r1)" }],
      { memorySize: MEMORY },
    );
    expect(program.ok).toBe(false);
    expect(program.messages.map((m) => [m.line, m.message])).toEqual([
      [2, "ADDI expects 3 operand(s), found 2"],
      [3, "Unknown instruction foo"],
      [4, "Undefined symbol: Nowhere"],
      [5, 'A double needs an even register (F0, F2...): "f1"'],
      [6, "The displacement 100000 is out of range (-32768..32767)"],
    ]);
  });

  it("rejects labels defined twice and sizes with later labels", () => {
    expect(assemble([{ name: "a.s", content: "a: nop\na: nop" }], { memorySize: MEMORY }).messages[0].message).toMatch(/already defined/);
    expect(assemble([{ name: "a.s", content: " .space n\nn: nop" }], { memorySize: MEMORY }).messages[0].message).toMatch(/defined before/);
  });

  it("keeps the labels of each file to itself and shares the .global ones", () => {
    const program = assemble(
      [
        { name: "a.s", content: " .text\n .global main\nmain: jal f\nloop: j loop" },
        { name: "b.s", content: " .text\n .global f\nf: jr r31\nloop: nop" },
      ],
      { memorySize: MEMORY },
    );
    expect(program.messages).toEqual([]);
    expect(program.symbols.get("f")).toBe(0x108);
  });

  it.each(["prim.s", "base.s", "win-dlx.s", "fact.s", "gcm.s", "input.s"])("assembles the example %s", (name) => {
    const files = name === "gcm.s" || name === "fact.s" ? [{ name, content: example(name) }, { name: "input.s", content: example("input.s") }] : [{ name, content: example(name) }];
    const program = assemble(files, { memorySize: MEMORY });
    expect(program.messages.filter((m) => m.severity === "error")).toEqual([]);
    expect(program.instructions.length).toBeGreaterThan(5);
  });
});
