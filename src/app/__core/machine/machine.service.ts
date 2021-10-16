import { Injectable } from '@angular/core';
import { Double64, Float32, Int32 } from "../interfaces";
import { PixiTHUMER_Pipeline } from "./PixiTHUMER_Pipeline";
import { PixiTHUMDER_CycleClockDiagram } from "./PixiTHUMDER_CycleClockDiagram";
import { interval, Observable, PartialObserver, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import {
  SimulationResponse,
  StepSimulation,
  TypeCode,
  TypeStage,
  TypeStatusPipeline,
  TypeTableCode
} from "../../types";
import { DEFAULT_BINARY_32_BITS, DEFAULT_BINARY_64_BITS, DEFAULT_TABLE_CODE } from "../../CONSTAST";
import { Utils } from "../../Utils";


const RegexRegisterInteger = /\b(R0|R1|R2|R3|R4|R5|R6|R7|R8|R9|R10|R11|R12|R13|R14|R15|R16|R17|R18|R19|R20|R21|R22|R23|R24|R25|R26|R27|R28|R29|R30|R31)\b/i;
const RegexRegisterFloat = /\b(F0|F1|F2|F3|F4|F5|F6|F7|F8|F9|F10|F11|F12|F13|F14|F15|F16|F17|F18|F19|F20|F21|F22|F23|F24|F25|F26|F27|F28|F29|F30|F31)\b/i;
const RegexRegisterDouble = /\b(D0|D2|D4|D6|D8|D10|D12|D14|D16|D18|D20|D22|D24|D26|D28|D30)\b/i;
const RegexRegisterControl = /(pc|imar|ir|a|ahi|b|bhi|bta|alu|aluhi|fpsr|dmar|sdr|sdrhi|ldr|ldrhi|PC|IMAR|IR|A|AHI|B|BHI|BTA|ALU|ALUHI|FPSR|DMAR|SDR|SDRHI|LDR|LDRHI)/;

class Registers {
  PC: Int32;
  IMAR: Int32;
  IR: Int32;
  A: Int32;
  AHI: Int32;
  B: Int32;
  BHI: Int32;
  BTA: Int32;
  ALU: Int32;
  ALUHI: Int32;
  FPSR: Int32;
  DMAR: Int32;
  SDR: Int32;
  SDRHI: Int32;
  LDR: Int32;
  LDRHI: Int32;
  R: Int32[];
  F: Float32[];
  D: Double64[];

  // $TEXT+0x00 - $TEXT+0xfc
  // 0x00000200 - 0x00007ffc
  // code = Array<Int32>(32764)
  // memory = Array<Int32>(32736)
  constructor() {
    this.PC = new Int32();
    this.IMAR = new Int32();
    this.IR = new Int32();
    this.A = new Int32();
    this.AHI = new Int32();
    this.B = new Int32();
    this.BHI = new Int32();
    this.BTA = new Int32();
    this.ALU = new Int32();
    this.ALUHI = new Int32();
    this.FPSR = new Int32();
    this.DMAR = new Int32();
    this.SDR = new Int32();
    this.SDRHI = new Int32();
    this.LDR = new Int32();
    this.LDRHI = new Int32();

    this.R = Array<Int32>(32);
    this.F = Array<Float32>(32);
    this.D = Array<Double64>(16);
    for (let i = 0; i < 32; i++) {
      this.R[i] = new Int32();
      this.F[i] = new Float32();
    }
    for (let i = 0; i < 16; i++) {
      this.D[i] = new Double64();
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class MachineService {
  // 0x8000 --> 32768
  public currentMemorySize = 32768;
  public floating_point_stage_configuration = {
    addition: {
      count: 1,
      delay: 2
    },
    multiplication: {
      count: 1,
      delay: 5
    },
    division: {
      count: 1,
      delay: 19
    },
  }
  public registers: Registers = new Registers();
  // La memoria se organiza de direcciones de 4 bits en 4 bits
  public memory: Array<Int32> = [...new Array(this.currentMemorySize)].map((v, i, a) => new Int32());
  // address --> TypeTableCode
  public code: Map<string, TypeTableCode> = new Map()

  // public memory: Array<Int32> = Array<Int32>(32764).fill(new Int32());
  // public code: Array<Int32> = Array<Int32>(32764).fill(new Int32());
  public pipeline: PixiTHUMER_Pipeline;
  public cycleClockDiagram: PixiTHUMDER_CycleClockDiagram;

  // Vector con los pasos de la simulación
  private simulation: SimulationResponse;

  public codeSimulation$ = new Subject<TypeCode[]>();
  public stepSimulation$ = new Subject<StepSimulation>();
  public step$ = new Subject<number>();
  private privateStep = -1;
  private timer: Observable<number>;
  private readonly timerObserver: PartialObserver<number>;

  stopClick$ = new Subject();
  pauseClick$ = new Subject();

  // Por defecto parado y sin completar
  isRunning = false;
  isComplete = false;


  // 20 de septiembre: Me quiero morir, este código es una locura y no sé hacerlo bonito y entendible por que no
  // hay forma con js suerte Nono del futuro, que te sea leve 👍
  // 28 de septiembre: Nono del pasado eres un cabron
  // 05 de octubre: Nono del pasado sigues siendo un cabron
  // 15 de octubre: Nono, lo has mejorado un poquito, pero sigues siendo un cabron
  // https://stackblitz.com/edit/angular-play-pause-timer
  constructor() {
    this.pipeline = new PixiTHUMER_Pipeline();
    this.cycleClockDiagram = new PixiTHUMDER_CycleClockDiagram();
    this.memory[0] = new Int32()
    // this.registers.D[0].value = 3.14

    this.timer = interval(1000).pipe(
      takeUntil(this.pauseClick$),
      takeUntil(this.stopClick$)
    );

    this.timerObserver = {
      next: (_: number) => {
        this.log(new Date().getSeconds())
        if (this.isRunning) {
          this.privateStep++;
          this.checkConditions();
          this.clock();
        } else {
          this.stopClick$.next();
          // this.isRunning = false;
          // this.isComplete = true;
        }
      }
    };

    this.timer.subscribe(this.timerObserver);
  }

  // TODO
  public resetMachineStatus(): Promise<boolean> {
    return new Promise(async (resolve) => {
      this.pipeline = new PixiTHUMER_Pipeline();
      this.cycleClockDiagram = new PixiTHUMDER_CycleClockDiagram();
      this.memory = [...new Array(this.currentMemorySize)].map(() => new Int32());
      this.code = new Map();
      this.code.clear();
      this.registers = new Registers();
      this.privateStep = -1;
      this.isComplete = false;
      this.isRunning = false;
      this.stopClick$.next();

      await this.loadExamples();

      resolve(true);
    })
  }

  public getStepObservable(): Observable<number> {
    return this.step$.asObservable();
  }

  public getStepSimulationObservable(): Observable<StepSimulation> {
    return this.stepSimulation$.asObservable();
  }

  public getCodeSimulationObservable(): Observable<TypeCode[]> {
    return this.codeSimulation$.asObservable();
  }

  getListStatusPipeline(stepSimulation: StepSimulation): TypeStatusPipeline[] {
    const {IF, ID, intEX, MEM, WB} = stepSimulation.pipeline;
    let list_elements: TypeStatusPipeline[] = [
      {address: IF, stage: 'IF'},
      {address: ID, stage: 'ID'},
      {address: intEX, stage: 'intEX'},
      {address: MEM, stage: 'MEM'},
      {address: WB, stage: 'WB'}
    ]
    for (const f_a of stepSimulation.pipeline.faddEX) {
      list_elements.push({address: f_a.address, stage: `faddEX_${f_a.unit}` as TypeStage, unit: f_a.unit})
    }
    for (const f_m of stepSimulation.pipeline.fmultEX) {
      list_elements.push({address: f_m.address, stage: `fmultEX_${f_m.unit}` as TypeStage, unit: f_m.unit})
    }
    for (const f_d of stepSimulation.pipeline.fdivEX) {
      list_elements.push({address: f_d.address, stage: `fdivEX_${f_d.unit}` as TypeStage, unit: f_d.unit})
    }
    return list_elements;
  }

  // Navbar
  async play(): Promise<void> {
    return new Promise((resolve, reject) => {
      resolve();
    })
  }

  async reset(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.resetMachineStatus()
      resolve();
    })
  }

  async pause(): Promise<void> {
    return new Promise(resolve => {
      this.pauseClick$.next();
      this.isRunning = false;
      resolve();
    })
  }

  async resume(): Promise<void> {
    return new Promise(resolve => {
      this.isRunning = true;
      if (this.isComplete) {
        this.isComplete = false;
      }
      this.timer.subscribe(this.timerObserver);
      resolve();
    })
  }

  async next(): Promise<void> {
    return new Promise(resolve => {
      this.privateStep++;
      this.checkConditions();
      this.clock();
      resolve();
    })
  }

  async end(): Promise<void> {
    return new Promise(resolve => {
      this.privateStep = -1;

      this.stopClick$.next();
      this.isRunning = false;
      this.isComplete = true;
      resolve();
    })
  }

  clock(): any {
    if (this.isRunning === false) {
      return;
    }
    const statusMachineInStep = this.getStepInRunner(this.privateStep);
    this.step$.next(this.privateStep);
    this.stepSimulation$.next(statusMachineInStep)
    const instructionText = statusMachineInStep.instruction;
    // this.cycleClockDiagram.addInstruction(instructionText);
    // this.cycleClockDiagram.goToStep(this.privateStep);

    if (statusMachineInStep.registers !== []) {
      for (const register_value of statusMachineInStep.registers) {
        const register = register_value.register
        let value, binary;
        if (RegexRegisterInteger.test(register)) {
          const r: number = MachineService.getRegisterNumber(register);
          value = Utils.hexadecimalToDecimal(register_value.value)
          binary = Utils.hexadecimalToBinary(register_value.value)
          this.registers.R[r] = new Int32();
          // this.registers.R[r].value = value;
          this.registers.R[r].binary = binary;
        } else if (RegexRegisterFloat.test(register)) {
          const f: number = MachineService.getRegisterNumber(register);
          value = Utils.hexadecimalToDecimal(register_value.value)
          binary = Utils.hexadecimalToBinary(register_value.value)
          this.registers.F[f] = new Float32();
          // this.registers.F[f].value = value;
          this.registers.F[f].binary = binary;
        } else if (RegexRegisterDouble.test(register)) {
          const d: number = MachineService.getRegisterNumber(register);
          value = Utils.hexadecimalToDecimal(register_value.value)
          binary = Utils.hexadecimalToBinary(register_value.value, {maxLength: 64, fillString: '0'})
          this.registers.D[d] = new Double64();
          // this.registers.D[d].value = value;
          this.registers.D[d].binary = binary;
        } else if (RegexRegisterControl.test(register)) {
          value = Utils.hexadecimalToDecimal(register_value.value)
          binary = Utils.hexadecimalToBinary(register_value.value)
          this.registers[register] = new Int32();
          // this.registers[register].value = value;
          this.registers[register].binary = binary;
        }
        this.log('Registro: ', register, 'con valor', value, 'de la instrucción', instructionText)
      }
    }

    if (statusMachineInStep.memory !== []) {
      for (const memory_value of statusMachineInStep.memory) {
        const address = memory_value.address;
        const value = memory_value.value;
        this.memory[address] = new Int32();
        this.memory[address].value = value;
        this.log('Dirección: ', address, 'con valor', value, 'de la instrucción', instructionText)
      }
    }

    const {IF, ID, intEX, faddEX, fmultEX, fdivEX, MEM, WB} = statusMachineInStep.pipeline;

    const data_code_IF = this.code.get(IF) ?? DEFAULT_TABLE_CODE
    const data_code_ID = this.code.get(ID) ?? DEFAULT_TABLE_CODE
    const data_code_intEX = this.code.get(intEX) ?? DEFAULT_TABLE_CODE
    const data_code_MEM = this.code.get(MEM) ?? DEFAULT_TABLE_CODE
    const data_code_WB = this.code.get(WB) ?? DEFAULT_TABLE_CODE

    this.pipeline.update_IF_text(data_code_IF.instruction);
    this.pipeline.update_ID_text(data_code_ID.instruction);
    this.pipeline.update_intEX_text(data_code_intEX.instruction);
    this.pipeline.update_MEM_text(data_code_MEM.instruction);
    this.pipeline.update_WB_text(data_code_WB.instruction);

    for (const unit_value of faddEX) {
      const {instruction: faddEX_i} = this.code.get(unit_value.address)
      this.pipeline.update_faddEX_text(faddEX_i, unit_value.unit);
    }
    for (const unit_value of fmultEX) {
      const {instruction: fmultEX_i} = this.code.get(unit_value.address)
      this.pipeline.update_fmultEX_text(fmultEX_i, unit_value.unit);
    }
    for (const unit_value of fdivEX) {
      const {instruction: fdivEX_i} = this.code.get(unit_value.address)
      this.pipeline.update_fdivEX_text(fdivEX_i, unit_value.unit);
    }
  }

  private checkConditions() {
    if (this.privateStep > this.simulation.steps) {
      this.isComplete = true;
      this.isRunning = false;
    }
  }

  private static getRegisterNumber(str): number {
    return parseInt(str.replace(/\D/g, ''));
  }

  private log(...msg) {
    console.log(this.privateStep, ...msg)
  }

  /**
   * DEFAULT STEP
   *
   * @param step
   * @private
   */
  private getStepInRunner(step: number): StepSimulation {
    const status = this.simulation.runner.filter((value) => value.step === step)[0];
    if (status === undefined) {
      console.error('No hay nada que simular');
      return;
    } else {
      if (status.pipeline === undefined) {
        status.pipeline = {
          IF: "", ID: "", MEM: "", WB: "", faddEX: [], fdivEX: [], fmultEX: [], intEX: "",
        }
      }
      return status;
    }
  }


  /**
   *
   */
  public getMemory(address: number): Int32 {
    if (this.memory[address] === undefined) {
      this.memory[address] = new Int32()
    }
    return this.memory[address]
  }

  public getTableCode(address: string): TypeTableCode {
    if (this.code.get(address) === undefined) {
      console.warn("Error, dirección de memoria erronea")
      return DEFAULT_TABLE_CODE;
    }
    return this.code.get(address);
  }

  public setMemory(address: number, value: number, binary: string = "00000000000000000000000000000000"): Int32 {
    if (this.memory[address] === undefined) {
      this.memory[address] = new Int32();
    }
    this.memory[address].value = value;
    this.memory[address].binary = binary;
    return this.memory[address]
  }

  getBinaryOfMemory_Byte(address: number, module: 0 | 1 | 2 | 3): string {
    const binary = this.getMemory(address).binary.padStart(32, '0');
    return binary.substr(8 * module, 8);
  }

  getBinaryOfMemory_HalfWord(address: number, module: 0 | 1): string {
    const binary = this.getMemory(address).binary.padStart(32, '0');
    return binary.substr(16 * module, 16)
  }

  getBinaryOfMemory_Word(address: number): string {
    return this.getMemory(address).binary.padStart(32, '0');
  }

  getBinaryOfMemory_Float(address: number): string {
    return this.getMemory(address).binary.padStart(32, '0');
  }

  getBinaryOfMemory_Double(address: number): string {
    const part1 = this.getMemory(address).binary.padStart(32, '0');
    if (part1 === DEFAULT_BINARY_32_BITS) {
      return DEFAULT_BINARY_64_BITS;
    }
    const part2 = this.getMemory(address + 1).binary.padStart(32, '0')
    if (part2 === DEFAULT_BINARY_32_BITS) {
      return DEFAULT_BINARY_64_BITS;
    }
    return part1 + part2;
  }

  defineMemory(address: number) {
    if (this.memory[address] === undefined) {
      this.memory[address] = new Int32();
    }
  }

  private loadExamples(): Promise<void> {
    return new Promise(async (resolve) => {
      const response = await fetch('./assets/examples-dlx/example-runner.json');
      const simulation: SimulationResponse = await response.json()

      this.log(simulation);
      this.simulation = simulation;

      let data_code_array = [];
      for (const ins of this.simulation.code) {
        this.code.set(ins.address, ins);
        data_code_array.push(ins)
      }

      this.codeSimulation$.next(data_code_array)
      resolve()
    })
  }
}
