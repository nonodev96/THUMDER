import { assemble } from "@core/engine/assembler";
import { decode, INSTRUCTIONS } from "@core/engine/isa";
import { describe, expect, it } from "vitest";
import {
  CATEGORIES,
  type CatalogEntry,
  countByCategory,
  EXAMPLE_ADDRESS,
  exampleLabels,
  instructionCatalog,
  nameOf,
  normalize,
  opcodeMatrices,
  searchCatalog,
} from "./instruction-table.catalog";

const es = instructionCatalog("es");
const en = instructionCatalog("en");
const entry = (entries: CatalogEntry[], mnemonic: string) => entries.find((item) => item.mnemonic === mnemonic) as CatalogEntry;

describe("the instruction table", () => {
  it("has every instruction of the engine once, with a category and a name in both languages", () => {
    expect(es.length).toBe(INSTRUCTIONS.length);
    expect(new Set(es.map((item) => item.mnemonic)).size).toBe(INSTRUCTIONS.length);
    for (const item of [...es, ...en]) {
      expect(CATEGORIES, item.mnemonic).toContain(item.category);
      expect(item.name, item.mnemonic).toMatch(/^\p{Lu}/u);
      expect(item.name, item.mnemonic).not.toContain("undefined");
    }
    const counts = countByCategory(es);
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(INSTRUCTIONS.length);
    expect(counts.memory).toBe(12);
    expect(counts.control).toBe(8);
    expect(counts.shift).toBe(6);
  });

  it("names the instructions from their mnemonic", () => {
    const def = (mnemonic: string) => INSTRUCTIONS.find((item) => item.mnemonic === mnemonic)!;
    expect(nameOf(def("ADD"), "es")).toBe("Suma");
    expect(nameOf(def("ADDUI"), "es")).toBe("Suma (sin signo, inmediato)");
    expect(nameOf(def("ADDUI"), "en")).toBe("Add (unsigned, immediate)");
    expect(nameOf(def("SLL"), "en")).toBe("Shift left");
    expect(nameOf(def("SRAI"), "es")).toBe("Desplaza a la derecha (aritmético, inmediato)");
    expect(nameOf(def("SLTU"), "en")).toBe("Set if less than (unsigned)");
    expect(nameOf(def("SGEI"), "es")).toBe("Pone a 1 si es mayor o igual (inmediato)");
    expect(nameOf(def("MULTD"), "es")).toBe("Multiplica (doble precisión)");
    expect(nameOf(def("LTF"), "en")).toBe("Compare if less than (single precision)");
    expect(nameOf(def("LW"), "en")).toBe("Load word");
  });

  it("gives each instruction its syntax, an example and what describe() says of it", () => {
    const add = entry(es, "ADD");
    expect(add.syntax).toBe("ADD rd, rs1, rs2");
    expect(add.example).toBe("ADD R3, R1, R2");
    expect(add.description.summary).toBe("R3 ← R1 + R2");
    expect(add.reads).toEqual(["R1", "R2"]);
    expect(add.writes).toEqual(["R3"]);
    expect(add.opcode).toBe(0);
    expect(add.func).toBe(0x20);
    expect(add.fields.map((field) => [field.name, field.from, field.to, field.kind])).toEqual([
      ["opcode", 31, 26, "opcode"],
      ["rs1", 25, 21, "reg1"],
      ["rs2", 20, 16, "reg2"],
      ["rd", 15, 11, "reg3"],
      ["función", 10, 0, "value"],
    ]);
    const lw = entry(en, "LW");
    expect(lw.syntax).toBe("LW rd, imm(rs1)");
    expect(lw.example).toBe("LW R2, 8(R1)");
    expect(lw.description.summary).toBe("R2 ← Mem[R1 + 8]");
    expect(lw.opcode).toBe(0x23);
    expect(lw.func).toBeNull();
    const addd = entry(en, "ADDD");
    expect(addd.description.summary).toBe("F0:F1 ← F2:F3 + F4:F5");
    expect(addd.reads).toEqual(["F2:F3", "F4:F5"]);
    expect(addd.writes).toEqual(["F0:F1"]);
    expect(addd.unit).toBe("fadd");
    expect(entry(es, "BEQZ").syntax).toBe("BEQZ rs1, etiqueta");
    expect(entry(es, "BEQZ").description.summary).toBe("si R1 = 0: PC ← 0x00000110 «fin»");
    expect(entry(en, "JAL").writes).toEqual(["R31"]);
    expect(entry(en, "BFPT").reads).toEqual(["FPSR"]);
    // The fields that the instruction does not use
    expect(entry(es, "NOP").fields.slice(1, 4).every((field) => field.unused)).toBe(true);
    expect(entry(en, "JR").fields.map((field) => field.unused)).toEqual([false, false, true, true]);
  });

  it("writes examples that THUMDER assembles into the word it describes", () => {
    for (const lang of ["es", "en"] as const) {
      const labels = [...exampleLabels(lang)].map(([address, label]) => `        .text 0x${address.toString(16)}\n${label}:  nop`).join("\n");
      for (const item of instructionCatalog(lang)) {
        const program = `        .text 0x${EXAMPLE_ADDRESS.toString(16)}\n        ${item.example}\n${labels}\n`;
        const result = assemble([{ name: "example.s", content: program }], { memorySize: 0x8000 });
        expect(result.messages.filter((message) => message.severity === "error"), item.example).toEqual([]);
        expect(result.instructions[0].word >>> 0, item.example).toBe(item.word);
        expect(decode(item.word)?.def.mnemonic).toBe(item.mnemonic);
      }
    }
  });

  it("lists the services of TRAP and says once where their parameters are", () => {
    const trap = entry(es, "TRAP");
    expect(trap.services?.list.map((service) => service.name)).toEqual(["fin del programa", "open()", "close()", "read()", "write()", "printf()"]);
    expect(trap.services?.note).toMatch(/^Los parámetros están en la memoria/);
    expect(trap.services?.list[5].text).not.toContain("R14");
    expect(entry(en, "TRAP").services?.note).toMatch(/^The parameters are in memory/);
    expect(trap.reads).toEqual([]);
  });

  it("searches by mnemonic, words of the explanation and codes, the closest mnemonic first", () => {
    expect(searchCatalog(es, "lw")[0].mnemonic).toBe("LW");
    expect(searchCatalog(es, "add").slice(0, 2).map((item) => item.mnemonic)).toEqual(["ADD", "ADDU"]);
    expect(searchCatalog(es, "multiplicacion").map((item) => item.mnemonic)).toContain("MULT");
    expect(searchCatalog(es, "carga palabra").map((item) => item.mnemonic)).toContain("LW");
    expect(searchCatalog(en, "load word")[0].mnemonic).toBe("LW");
    expect(searchCatalog(es, "0x23").map((item) => item.mnemonic)).toEqual(expect.arrayContaining(["LW", "SUBU"]));
    expect(searchCatalog(es, "R31").map((item) => item.mnemonic)).toEqual(expect.arrayContaining(["JAL", "JALR", "JR"]));
    expect(searchCatalog(es, "zzz")).toEqual([]);
    expect(searchCatalog(es, "  ")).toBe(es);
    expect(normalize("División")).toBe("division");
  });

  it("draws the maps of the codes with every instruction once", () => {
    const [opcode, r, f] = opcodeMatrices();
    const cells = [opcode, r, f].flatMap((matrix) => matrix.rows.flatMap((row) => row.cells));
    const mnemonics = cells.map((cell) => cell.mnemonic).filter(Boolean);
    expect(mnemonics.sort()).toEqual(INSTRUCTIONS.map((def) => def.mnemonic).sort());
    expect(opcode.rows[0].cells[0].opens).toBe("R");
    expect(opcode.rows[0].cells[1].opens).toBe("F");
    expect(opcode.rows[1].cells[0].mnemonic).toBe("ADDI");
    expect(opcode.rows[4].cells[3].mnemonic).toBe("LW");
    expect(r.rows[4].cells[0].mnemonic).toBe("ADD");
    expect(f.rows[0].cells[4].mnemonic).toBe("ADDD");
    expect(r.rows[4].cells[0].category).toBe("alu");
  });
});
