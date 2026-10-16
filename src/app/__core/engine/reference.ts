// The reference executor: one instruction after another, with no pipeline. Whatever the pipeline (pipeline.ts) does
// with its stalls and forwarding, the program must end in the same state as here.
import type { AssemblyResult } from "@core/engine/assembler";
import { accessMemory, execute, Memory, Registers, readOperands, SimulationError, writeBack } from "@core/engine/cpu";
import { decode } from "@core/engine/isa";
import { type ProgramIO, runTrap } from "@core/engine/traps";

export type ReferenceRun = {
  registers: Registers;
  memory: Memory;
  instructions: number;
  halted: boolean;
  waitingForInput: boolean;
  error?: string;
};

export function runReference(program: AssemblyResult, io: ProgramIO, maxInstructions = 1_000_000): ReferenceRun {
  const memory = new Memory(program.memory.length);
  memory.bytes.set(program.memory);
  const registers = new Registers();
  registers.PC = program.entry;
  let instructions = 0;
  try {
    while (instructions < maxInstructions) {
      const pc = registers.PC;
      const decoded = decode(memory.readU32(pc));
      if (decoded === null) throw new SimulationError(`Invalid instruction at 0x${pc.toString(16).toUpperCase().padStart(8, "0")}`);
      const execution = execute(decoded, readOperands(decoded, registers), pc);
      if (execution.trap !== undefined) {
        const trap = runTrap(execution.trap, registers, memory, io);
        if (trap.waitingForInput) return { registers, memory, instructions, halted: false, waitingForInput: true };
        instructions++;
        if (trap.halt) return { registers, memory, instructions, halted: true, waitingForInput: false };
        if (trap.r1 !== undefined) registers.setR(1, trap.r1);
        registers.PC = pc + 4;
        continue;
      }
      const loaded = accessMemory(execution, memory);
      writeBack(decoded, { ...execution, ...loaded }, registers);
      registers.PC = execution.branch?.taken ? execution.branch.target : pc + 4;
      instructions++;
    }
    return { registers, memory, instructions, halted: false, waitingForInput: false };
  } catch (error) {
    return { registers, memory, instructions, halted: false, waitingForInput: false, error: (error as Error).message };
  }
}
