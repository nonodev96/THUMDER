import { describe as explain, describeWord } from "@core/engine/describe";
import { BY_MNEMONIC, decode, encode, INSTRUCTIONS } from "@core/engine/isa";
import { describe, expect, it } from "vitest";

const word = (mnemonic: string, fields: Parameters<typeof encode>[1] = {}) => encode(BY_MNEMONIC.get(mnemonic)!, fields);
const es = (mnemonic: string, fields: Parameters<typeof encode>[1] = {}, address = 0x100, labels?: Map<number, string>) =>
  describeWord(word(mnemonic, fields), { address, labels, lang: "es" })!;
const en = (mnemonic: string, fields: Parameters<typeof encode>[1] = {}, address = 0x100, labels?: Map<number, string>) =>
  describeWord(word(mnemonic, fields), { address, labels, lang: "en" })!;

describe("the description of an instruction", () => {
  it("explains every instruction of DLX, in both languages", () => {
    for (const def of INSTRUCTIONS) {
      for (const lang of ["es", "en"] as const) {
        const description = explain(decode(encode(def, { rs1: 1, rs2: 2, rd: 4, imm: 8, offset: 8 }))!, { address: 0, lang });
        expect(description.summary, def.mnemonic).not.toBe("");
        expect(description.text, def.mnemonic).not.toMatch(/undefined|\[object|  /);
        expect(description.stages.map((stage) => stage.stage).slice(0, 2)).toEqual(["IF", "ID"]);
        expect(description.fields.map((field) => field.bits).join("")).toHaveLength(32);
      }
    }
  });

  it("is null for a word that is not an instruction", () => {
    expect(describeWord(0xfc000000, { address: 0 })).toBeNull();
  });

  it("says which registers an operation reads and writes, and which unit computes it", () => {
    const add = es("ADD", { rd: 3, rs1: 1, rs2: 2 });
    expect(add.summary).toBe("R3 ← R1 + R2");
    expect(add.text).toContain("Suma R1 y R2 (enteros con signo) y guarda el resultado en R3");
    expect(add.stages.find((stage) => stage.stage === "ID")?.text).toBe("Se decodifica y se leen R1 y R2.");
    expect(add.stages.find((stage) => stage.stage === "WB")?.text).toBe("Se escribe R3.");
    expect(add.format).toBe("Tipo R (registro-registro)");
    expect(add.fields.map((field) => field.name)).toEqual(["opcode", "rs1", "rs2", "rd", "función"]);

    const mult = en("MULT", { rd: 5, rs1: 1, rs2: 2 });
    expect(mult.summary).toBe("R5 ← R1 × R2");
    expect(mult.stages[2].stage).toBe("fmultEX");
    expect(mult.text).toContain("floating point multiplication unit");

    expect(es("ADD", { rd: 0, rs1: 1, rs2: 2 }).text).toContain("R0 vale siempre 0");
  });

  it("tells how the immediate is extended", () => {
    expect(es("ADDI", { rs2: 1, rs1: 0, imm: -3 }).summary).toBe("R1 ← R0 + -3");
    const addi = es("ADDI", { rs2: 1, rs1: 0, imm: -3 });
    expect(addi.text).toContain("Suma a R0 el inmediato -3 (16 bits, extendido con su signo a 32) y guarda el resultado en R1.");
    expect(addi.text).toContain("Como R0 vale siempre 0, R1 recibe -3");
    expect(en("ORI", { rs2: 1, rs1: 0, imm: 0x10 }).text).toContain("R1 gets 0x0010");
    const andi = es("ANDI", { rs2: 2, rs1: 3, imm: 0xff00 });
    expect(andi.summary).toBe("R2 ← R3 AND 0xFF00");
    expect(andi.text).toContain("extendido con ceros");
    expect(es("SLLI", { rs2: 2, rs1: 2, imm: 3 }).summary).toBe("R2 ← R2 << 3");
    expect(es("SRAI", { rs2: 2, rs1: 2, imm: 1 }).text).toContain("aritmético");
    expect(es("LHI", { rs2: 4, imm: 0x1234 }).text).toContain("R4 = 0x12340000");
    expect(es("SLTU", { rd: 1, rs1: 2, rs2: 3 }).text).toContain("sin signo");
    expect(es("SGEI", { rs2: 1, rs1: 2, imm: 5 }).summary).toBe("R1 ← (R2 ≥ 5) ? 1 : 0");
  });

  it("gives the address of the memory and its size, with the label of the data", () => {
    const lw = es("LW", { rs2: 5, rs1: 3, imm: -8 });
    expect(lw.summary).toBe("R5 ← Mem[R3 - 8]");
    expect(lw.text).toContain("Lee 4 bytes (una palabra) de la memoria, en la dirección R3 - 8");
    expect(lw.stages.find((stage) => stage.stage === "MEM")?.text).toBe("Se leen 4 bytes (una palabra) de la memoria.");

    const labels = new Map([[0x1000, "datos"]]);
    expect(es("LB", { rs2: 1, rs1: 0, imm: 0x1000 }, 0, labels).summary).toBe("R1 ← Mem[0x00001000 «datos»]");
    expect(es("LBU", { rs2: 1, rs1: 2 }).text).toContain("con ceros");
    const ld = en("LD", { rs2: 2, rs1: 1, imm: 16 });
    expect(ld.summary).toBe("F2:F3 ← Mem[R1 + 16]");
    expect(ld.text).toContain("double precision");

    const sb = es("SB", { rs2: 7, rs1: 1, imm: 2 });
    expect(sb.summary).toBe("Mem[R1 + 2] ← R7");
    expect(sb.text).toContain("el byte bajo (8 bits) de R7");
    expect(sb.stages.find((stage) => stage.stage === "WB")?.text).toBe("No escribe ningún registro.");
  });

  it("computes where branches and jumps go", () => {
    const labels = new Map([[0xf0, "bucle"]]);
    const bnez = es("BNEZ", { rs1: 4, imm: -20 }, 0x100, labels);
    expect(bnez.summary).toBe("si R4 ≠ 0: PC ← 0x000000F0 «bucle»");
    expect(bnez.text).toContain("sigue con la instrucción siguiente (0x00000104)");
    expect(bnez.text).toContain("PC + 4 - 20");
    expect(en("BEQZ", { rs1: 4, imm: 8 }).summary).toBe("if R4 = 0: PC ← 0x0000010C");
    expect(es("BFPT", { imm: 0 }).summary).toBe("si FPSR = 1: PC ← 0x00000104");

    const jal = es("JAL", { offset: 0x40 }, 0x100);
    expect(jal.summary).toBe("R31 ← 0x00000104; PC ← 0x00000144");
    expect(jal.stages.find((stage) => stage.stage === "WB")?.text).toBe("Se escribe R31.");
    expect(es("JR", { rs1: 31 }).text).toContain("vuelve de una subrutina");
  });

  it("explains the traps and the floating point operations", () => {
    expect(es("TRAP", { offset: 0 }).summary).toBe("TRAP 0: fin del programa");
    expect(es("TRAP", { offset: 0 }).stages.find((stage) => stage.stage === "WB")?.text).toBe("No escribe ningún registro.");
    expect(es("TRAP", { offset: 5 }).text).toContain("R14");
    expect(en("TRAP", { offset: 9 }).text).toContain("does not exist");

    const addd = es("ADDD", { rd: 0, rs1: 2, rs2: 4 });
    expect(addd.summary).toBe("F0:F1 ← F2:F3 + F4:F5");
    expect(addd.stages[2].stage).toBe("faddEX");
    expect(addd.stages.find((stage) => stage.stage === "ID")?.text).toBe("Se decodifica y se leen F2, F3, F4 y F5.");
    expect(es("LTF", { rs1: 1, rs2: 2 }).summary).toBe("FPSR ← (F1 < F2) ? 1 : 0");
    expect(es("CVTI2D", { rd: 2, rs1: 4 }).summary).toBe("F2:F3 ← double(F4)");
    expect(es("MOVI2FP", { rd: 2, rs1: 4 }).summary).toBe("F2 ← R4");
    expect(es("MOVFP2I", { rd: 2, rs1: 4 }).fields[1].meaning).toBe("F4");
    expect(es("NOP").summary).toBe("nada");
  });
});
