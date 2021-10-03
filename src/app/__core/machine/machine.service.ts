import { Injectable } from '@angular/core';
import { Double64, Float32, Int32 } from "../interfaces";
import { PixiTHUMER_Pipeline } from "./PixiTHUMER_Pipeline";
import { PixiTHUMDER_CycleClockDiagram } from "./PixiTHUMDER_CycleClockDiagram";
import { interval, Observable, PartialObserver, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { SimulationResponse, StepSimulation } from "../../types";


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

  // public memory: Map<number, number>;
  // public memory: Array<Int32> = [...new Array(32736)].map(() => new Int32());
  // public code: Array<Int32> = [...new Array(32764)].map(() => new Int32());
  public registers: Registers = new Registers();
  public memory: Array<Int32> = Array<Int32>(32736).fill(new Int32());
  public code: Array<Int32> = Array<Int32>(32764).fill(new Int32());
  public pipeline: PixiTHUMER_Pipeline;
  public cycleClockDiagram: PixiTHUMDER_CycleClockDiagram;
  public step$ = new Subject<number>();
  private privateStep = -1;

  // Vector con los pasos de la simulación
  private simulation: SimulationResponse;

  timer: Observable<number>;
  timerObserver: PartialObserver<number>;


  stopClick$ = new Subject();
  pauseClick$ = new Subject();

  // Por defecto parado y sin completar
  isRunning = false;
  isComplete = false;


  // 20 de septiembre: Me quiero morir, este código es una locura y no sé hacerlo bonito y entendible por que no
  // hay forma con js suerte Nono del futuro, que te sea leve 👍
  // 28 de septiembre: Nono del pasado eres un cabron
  // https://stackblitz.com/edit/angular-play-pause-timer
  constructor() {
    this.pipeline = new PixiTHUMER_Pipeline();
    this.cycleClockDiagram = new PixiTHUMDER_CycleClockDiagram();
    this.memory[0] = new Int32()
    this.code[0] = new Int32()

    this.timer = interval(1000)
      .pipe(
        takeUntil(this.pauseClick$),
        takeUntil(this.stopClick$)
      );

    this.timerObserver = {
      next: (_: number) => {
        if (this.isRunning) {
          // this.clock()
        } else {
          this.stopClick$.next();
          this.isRunning = false;
          this.isComplete = true;
        }
      }
    };

    this.timer.subscribe(this.timerObserver);
  }

  public getStepObservable(): Observable<number> {
    return this.step$.asObservable();
  }

  public resetMachineStatus(): Promise<boolean> {
    return new Promise((resolve) => {
      this.pipeline = new PixiTHUMER_Pipeline();
      this.cycleClockDiagram = new PixiTHUMDER_CycleClockDiagram();
      this.privateStep = -1;

      resolve(true)
    })
  }

  // Navbar
  async play(): Promise<void> {
    return new Promise((resolve, reject) => {
      fetch('./assets/examples-dlx/example-runner.json')
        .then((res) => res.json())
        .then((simulation: SimulationResponse) => {
          this.simulation = simulation

          resolve()
        })
        .catch(() => {
          reject()
        });
    })
  }

  async pause(): Promise<void> {
    return new Promise(resolve => {
      this.isComplete = true;

      this.pauseClick$.next();
      this.isRunning = false;
      resolve()
    })
  }

  async resume(): Promise<void> {
    return new Promise(resolve => {
      this.isRunning = true;
      if (this.isComplete) {
        this.isComplete = false;
      }

      this.timer.subscribe(this.timerObserver);
      resolve()
    })
  }

  async next(): Promise<void> {
    return new Promise(resolve => {
      this.privateStep++;
      this.clock()
      if (this.privateStep === this.simulation.steps) {
        this.isComplete = true;
        this.isRunning = false;
      }
      resolve()
    })
  }

  async end(): Promise<void> {
    return new Promise(resolve => {
      this.privateStep = -1;
      this.pipeline.reset();
      this.cycleClockDiagram.reset();

      this.stopClick$.next();
      this.isRunning = false;

      resolve()
    })
  }

  clock() {
    const statusMachineInStep = this.getStepInRunner(this.privateStep)
    const instructionText = statusMachineInStep.instruction
    // this.cycleClockDiagram.addInstruction(instructionText);
    // this.cycleClockDiagram.goToStep(this.privateStep);

    if (statusMachineInStep.registers !== []) {
      for (const register_value of statusMachineInStep.registers) {
        const register = register_value.register
        const value = register_value.value
        console.log(register)
        if (RegexRegisterInteger.test(register)) {
          console.log('Es R0-R31')
          const r: number = MachineService.getRegisterNumber(register)
          this.registers.R[r] = new Int32()
          this.registers.R[r].value = value
        } else if (RegexRegisterFloat.test(register)) {
          console.log('Es F0-F31')
          const f: number = MachineService.getRegisterNumber(register)
          this.registers.F[f] = new Float32()
          this.registers.F[f].value = value
        } else if (RegexRegisterDouble.test(register)) {
          console.log('Es D0-D30')
          const d: number = MachineService.getRegisterNumber(register)
          this.registers.D[d] = new Double64()
          this.registers.D[d].value = value
        } else if (RegexRegisterControl.test(register)) {
          console.log('ES otro registro')
          this.registers[register] = new Int32()
          this.registers[register].value = value
        }
      }
    }

    if (statusMachineInStep.memory !== []) {
      for (const memory_value of statusMachineInStep.memory) {
        const address = memory_value.address
        const value = memory_value.value
        this.memory[address] = new Int32()
        this.memory[address].value = value
      }
    }

    switch (statusMachineInStep.stage) {
      case "IF":
        this.pipeline.update_IF_text(instructionText)
        break;
      case "ID":
        this.pipeline.update_ID_text(instructionText)
        break;
      case "intEX":
        this.pipeline.update_intEX_text(instructionText)
        break;
      case "faddEX":
        this.pipeline.update_faddEX_text(instructionText)
        break;
      case "fmultEX":
        this.pipeline.update_fmultEX_text(instructionText)
        break;
      case "fdivEX":
        this.pipeline.update_fdivEX_text(instructionText)
        break;
      case "MEM":
        this.pipeline.update_MEM_text(instructionText)
        break;
      case "WB":
        this.pipeline.update_WB_text(instructionText)
        break;
    }
  }

  private static getRegisterNumber(str): number {
    return parseInt(str.replace(/\D/g, ''))
  }

  private getStepInRunner(step: number): StepSimulation {
    const status = this.simulation.runner.filter((value) => value.step === step)[0]
    if (status === undefined) {
      console.error('No hay nada que simular')
    }
    return status
  }
}
