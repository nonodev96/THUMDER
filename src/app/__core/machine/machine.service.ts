import { Injectable } from '@angular/core';
import { Double64, Float32, Int32 } from "../typesData";
// import { PixiTHUMDER_Pipeline } from "./PixiTHUMDER_Pipeline";
// import { PixiTHUMDER_CycleClockDiagram } from "./PixiTHUMDER_CycleClockDiagram";
import { interval, Observable, PartialObserver, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import {
  SimulationResponse,
  TypeStepSimulation,
  TypeCode, TypeDataStatistics,
  TypeFloatingPointStageConfiguration,
  TypeRegister,
  TypeRegisterToEdit,
  TypeStage,
  TypeStatusCycleClockDiagram,
  TypeStatusMachine,
  TypeStatusPipeline,
  TypeTableCode,
  TypeTags
} from "../../types";
import {
  DEFAULT_BINARY_32_BITS,
  DEFAULT_BINARY_64_BITS,
  DEFAULT_DATA_STATISTICS, DEFAULT_PIPELINE,
  DEFAULT_TABLE_CODE
} from "../../CONSTAST";
import { Utils } from "../../Utils";
import { StorageService } from "../storage/storage.service";
import { Registers } from "../DLX/_Registers";
import { Memory } from "../DLX/_Memory";
import { BreakpointManager } from "./debugger/BreakpointManager";
import { ToastrService } from "ngx-toastr";
import { TranslateService } from "@ngx-translate/core";
import { IndividualConfig } from "ngx-toastr/toastr/toastr-config";


const RegexRegisterInteger = /\b(R0|R1|R2|R3|R4|R5|R6|R7|R8|R9|R10|R11|R12|R13|R14|R15|R16|R17|R18|R19|R20|R21|R22|R23|R24|R25|R26|R27|R28|R29|R30|R31)\b/i;
const RegexRegisterFloat = /\b(F0|F1|F2|F3|F4|F5|F6|F7|F8|F9|F10|F11|F12|F13|F14|F15|F16|F17|F18|F19|F20|F21|F22|F23|F24|F25|F26|F27|F28|F29|F30|F31)\b/i;
const RegexRegisterDouble = /\b(D0|D2|D4|D6|D8|D10|D12|D14|D16|D18|D20|D22|D24|D26|D28|D30)\b/i;
const RegexRegisterControl = /(pc|imar|ir|a|ahi|b|bhi|bta|alu|aluhi|fpsr|dmar|sdr|sdrhi|ldr|ldrhi|PC|IMAR|IR|A|AHI|B|BHI|BTA|ALU|ALUHI|FPSR|DMAR|SDR|SDRHI|LDR|LDRHI)/;


@Injectable({
  providedIn: 'root'
})
export class MachineService {
  public memorySize;
  public floatingPointStageConfiguration: TypeFloatingPointStageConfiguration;
  public registers: Registers;
  public breakpointManager: BreakpointManager;
  // La memoria se organiza de directions de 4 bits en 4 bits
  public memory: Memory;
  public logger: string = "";

  // address --> TypeTableCode
  public code: Map<string, TypeTableCode> = new Map();

  // Vector con los pasos de la simulación
  private simulation: SimulationResponse;
  private statusMachineInStep: TypeStepSimulation | null;
  public dataCodeArray;

  // Line
  public isBreakpoint$: Subject<number> = new Subject<number>();
  public codeSimulation$: Subject<TypeCode[]> = new Subject<TypeCode[]>();
  public stepSimulation$: Subject<TypeStepSimulation> = new Subject<TypeStepSimulation>();
  public dataStatistics$: Subject<TypeDataStatistics> = new Subject<TypeDataStatistics>();
  private dataStatistics: TypeDataStatistics = Utils.clone<TypeDataStatistics>(DEFAULT_DATA_STATISTICS);

  private privateStep = 0;
  private privateLine = 0;
  private timer: Observable<number>;
  private readonly timerObserver: PartialObserver<number>;

  public logger$: Subject<string> = new Subject<string>();
  public step$: Subject<number> = new Subject<number>();
  public line$: Subject<number> = new Subject<number>();

  // stopClick$ = new Subject<void>();
  isRunning$ = new Subject<boolean>();
  isComplete$ = new Subject<boolean>();

  // Por defecto parado y sin completar
  isRunning: boolean = false;
  isComplete: boolean = false;
  isBreakpoint: boolean = false;


  // 20 de septiembre: Me quiero morir, este código es una locura y no sé hacerlo bonito y entendible por que no
  // hay forma con js suerte Nono del futuro, que te sea leve 👍
  // 28 de septiembre: Nono del pasado eres un cabron
  // 05 de octubre: Nono del pasado sigues siendo un cabron
  // 15 de octubre: Nono, lo has mejorado un poquito, pero sigues siendo un cabron
  // 22 de octubre: Nono tienes que poner ahora las tags del debugger 😂
  // 7  de noviembre: Nono haz lo que puedas cuando puedas :3
  // 21 de noviembre: Nono haz las tags y el guardar ficheros pls
  // https://stackblitz.com/edit/angular-play-pause-timer
  constructor(private store: StorageService,
              private translate: TranslateService,
              private toast: ToastrService) {
    this.floatingPointStageConfiguration = this.store.getItem('floating_point_stage_configuration');
    // this.pipeline = new PixiTHUMER_Pipeline(
    //   this.floatingPointStageConfiguration.addition.count,
    //   this.floatingPointStageConfiguration.multiplication.count,
    //   this.floatingPointStageConfiguration.division.count
    // );

    this.memorySize = this.store.getItem('memory_size');
    this.memory = new Memory(this.memorySize);
    this.registers = new Registers();
    this.breakpointManager = new BreakpointManager();

    this.privateStep = 0;
    this.privateLine = 0;

    const timeSimulation = this.store.getItem('time_simulation');
    this.timer = interval(timeSimulation).pipe(
      takeUntil(this.isRunning$),
      takeUntil(this.isComplete$),
    );

    this.timerObserver = {
      next: async (_: number): Promise<void> => {
        if (this.isRunning === true) {
          await this.nextStep();
        }
        return Promise.resolve();
      }
    };
  }

  // TODO
  public async resetMachineStatus(): Promise<boolean> {
    try {
      await this.toastMessage('TOAST.TITLE_RESET_MACHINE', 'TOAST.MESSAGE_RESET_MACHINE');
      this.log("RESET");

      this.memorySize = this.store.getItem('memory_size');
      this.memory = new Memory(this.memorySize);

      this.registers = new Registers();

      this.breakpointManager = new BreakpointManager();
      const breakpointsSaved = JSON.parse(localStorage.getItem('breakpoints'));
      this.breakpointManager.updateManager(breakpointsSaved);

      this.floatingPointStageConfiguration = this.store.getItem('floating_point_stage_configuration');
      // this.pipeline = new PixiTHUMER_Pipeline(
      //   this.floatingPointStageConfiguration.addition.count,
      //   this.floatingPointStageConfiguration.multiplication.count,
      //   this.floatingPointStageConfiguration.division.count
      // );
      // this.cycleClockDiagram = new PixiTHUMDER_CycleClockDiagram();
      // this.pipeline = new PixiTHUMDER_Pipeline();

      this.privateStep = 0;
      this.privateLine = 0;

      this.dataStatistics = Utils.clone<TypeDataStatistics>(DEFAULT_DATA_STATISTICS);
      this.dataStatistics$.next(this.dataStatistics);

      this.code = new Map();
      this.code.clear();
      this.isComplete = false;
      this.isRunning = false;
      this.isBreakpoint = false;

      const timeSimulation = this.store.getItem('time_simulation');
      this.timer = null;
      this.timer = interval(timeSimulation).pipe(
        takeUntil(this.isRunning$),
        takeUntil(this.isComplete$),
      );

      await this.loadExamples();
      return Promise.resolve(true);
    } catch (error) {
      console.error(error);
      return Promise.reject(error);
    }
  }

  public getStepObservable(): Observable<number> {
    return this.step$.asObservable();
  }

  public getLineObservable(): Observable<number> {
    return this.line$.asObservable();
  }

  public getIsRunningObservable(): Observable<boolean> {
    return this.isRunning$.asObservable();
  }

  public getStepSimulationObservable(): Observable<TypeStepSimulation> {
    return this.stepSimulation$.asObservable();
  }

  public getCodeSimulationObservable(): Observable<TypeCode[]> {
    return this.codeSimulation$.asObservable();
  }

  // line
  public getDebuggerObservable(): Observable<number> {
    return this.isBreakpoint$.asObservable();
  }

  public getDataStatisticsObservable(): Observable<TypeDataStatistics> {
    return this.dataStatistics$.asObservable();
  }

  getLoggerObservable(): Observable<string> {
    return this.logger$.asObservable();
  }

  public getStatusCycleClockDiagram(stepSimulation: TypeStepSimulation): TypeStatusCycleClockDiagram {
    return {
      step: stepSimulation.step,
      instruction: stepSimulation.instruction,
      cycle: {
        IF_stall: stepSimulation.IF_stall,
        IF: stepSimulation.IF,
        ID_stall: stepSimulation.ID_stall,
        ID: stepSimulation.ID,
        intEX_stall: stepSimulation.intEX_stall,
        intEX: stepSimulation.intEX,
        MEM_stall: stepSimulation.MEM_stall,
        MEM: stepSimulation.MEM,
        WB_stall: stepSimulation.WB_stall,
        WB: stepSimulation.WB,
      },
      stepsToWait: 0
    };
  }

  public getListStatusPipeline(stepSimulation: TypeStepSimulation): TypeStatusPipeline[] {
    const {IF, ID, intEX, MEM, WB} = stepSimulation.pipeline;
    const list_elements: TypeStatusPipeline[] = [];

    if (IF) list_elements.push({address: IF, stage: 'IF'});
    if (ID) list_elements.push({address: ID, stage: 'ID'});
    if (intEX) list_elements.push({address: intEX, stage: 'intEX'});
    if (MEM) list_elements.push({address: MEM, stage: 'MEM'});
    if (WB) list_elements.push({address: WB, stage: 'WB'});

    for (const f_a of stepSimulation.pipeline.faddEX) {
      list_elements.push({address: f_a.address, stage: `faddEX_${f_a.unit}` as TypeStage, unit: f_a.unit});
    }
    for (const f_m of stepSimulation.pipeline.fmultEX) {
      list_elements.push({address: f_m.address, stage: `fmultEX_${f_m.unit}` as TypeStage, unit: f_m.unit});
    }
    for (const f_d of stepSimulation.pipeline.fdivEX) {
      list_elements.push({address: f_d.address, stage: `fdivEX_${f_d.unit}` as TypeStage, unit: f_d.unit});
    }
    return list_elements;
  }

  // Navbar

  public async play(): Promise<void> {
    return Promise.resolve();
  }

  public async reset(): Promise<void> {
    await this.resetMachineStatus();
    return Promise.resolve();
  }

  public async pause(): Promise<void> {
    this.isRunning = false;
    this.isRunning$.next(this.isRunning);
    return Promise.resolve();
  }

  public async resume(): Promise<void> {
    if (this.isComplete) {
      // this.isComplete = false;
      console.warn("this.isComplete, can't resume");
      return Promise.resolve();
    }

    this.isBreakpoint = false;
    this.isRunning = true;
    this.isRunning$.next(this.isRunning);

    this.timer.subscribe(this.timerObserver);
    return Promise.resolve();
  }

  public async nextStep(): Promise<void> {
    this.statusMachineInStep = await MachineService.getStepInRunner(this.privateStep);

    const canNextInstruction = await this.checkConditions();
    if (canNextInstruction) await this.clock();

    this.privateLine++;
    this.privateStep++;
    return Promise.resolve();
  }

  public async end(): Promise<void> {
    this.privateStep = -1;
    this.isRunning = false;
    this.isComplete = true;

    this.isRunning$.next(this.isRunning);
    return Promise.resolve();
  }

  private async checkConditions(): Promise<boolean> {
    if (this.statusMachineInStep === null) {
      console.warn('End of status of machine');
      return Promise.resolve(false);
    }
    this.privateStep = this.statusMachineInStep.step;
    this.privateLine = this.statusMachineInStep.line;
    this.isComplete = this.statusMachineInStep.isComplete ?? false;
    this.isBreakpoint = this.breakpointManager.isBreakpoint(this.privateLine);
    this.log(this.debug());

    if (this.isComplete) {
      this.isComplete = true;
      this.isRunning = false;
      this.isRunning$.next(this.isRunning);
      await this.toastMessage('TOAST.TITLE_END_SIMULATION', 'TOAST.MESSAGE_END_SIMULATION');
      return Promise.resolve(false);
    }

    if (this.isBreakpoint) {
      this.line$.next(this.privateLine);
      this.isRunning = false;
      this.isRunning$.next(this.isRunning);
      this.isBreakpoint$.next(this.privateLine);
      await this.toastMessage('TOAST.TITLE_BREAKPOINT_SIMULATION', 'TOAST.MESSAGE_BREAKPOINT_SIMULATION');
      return Promise.resolve(false);
    }

    if (this.isComplete === false && this.isBreakpoint === false) {
      return Promise.resolve(true);
    }

    return Promise.resolve(false);
  }

  private async clock(): Promise<void> {
    if (this.isComplete === true) {
      console.warn('isComplete', this.isComplete);
      return Promise.resolve();
    }

    if (this.statusMachineInStep.registers !== []) {
      for (const register_value of this.statusMachineInStep.registers) {
        const register = register_value.register;
        let binary;
        if (RegexRegisterInteger.test(register)) {
          const r: number = MachineService.getRegisterNumber(register);
          binary = Utils.hexadecimalToBinary(register_value.value);
          this.registers.R[r] = new Int32();
          this.registers.R[r].binary = binary;
        } else if (RegexRegisterFloat.test(register)) {
          const f: number = MachineService.getRegisterNumber(register);
          binary = Utils.hexadecimalToBinary(register_value.value);
          this.registers.F[f] = new Float32();
          this.registers.F[f].binary = binary;
        } else if (RegexRegisterDouble.test(register)) {
          const d: number = MachineService.getRegisterNumber(register);
          binary = Utils.hexadecimalToBinary(register_value.value, {maxLength: 64, fillString: '0'});
          this.registers.F[d] = new Float32();
          this.registers.F[d].binary = binary.substr(0, 32);
          this.registers.F[d + 1].binary = binary.substr(32, 32);
        } else if (RegexRegisterControl.test(register)) {
          binary = Utils.hexadecimalToBinary(register_value.value);
          this.registers[register] = new Int32();
          this.registers[register].binary = binary;
        }
        // this.log('Registro: ', register, 'con valor', value, 'de la instrucción', instructionText);
      }
    }

    if (this.statusMachineInStep.memory !== []) {
      for (const memory_value of this.statusMachineInStep.memory) {
        const address = memory_value.address;
        const typeData = memory_value.typeData ?? "word";
        switch (typeData) {
          case "byte": {
            const binary08 = Utils.hexadecimalToBinary(memory_value.value);
            this.memory.setMemoryByteBinaryByAddress(address, binary08);
            break;
          }
          case "halfword": {
            const binary16 = Utils.hexadecimalToBinary(memory_value.value);
            this.memory.setMemoryHalfWordBinaryByAddress(address, binary16);
            break;
          }
          case "word": {
            const binary32 = Utils.hexadecimalToBinary(memory_value.value);
            this.memory.setMemoryWordBinaryByAddress(address, binary32);
            break;
          }
          case "float": {
            const binary08 = Utils.hexadecimalToBinary(memory_value.value);
            this.memory.setMemoryFloatBinaryByAddress(address, binary08);
            break;
          }
          case "double": {
            const binary64 = Utils.hexadecimalToBinary(memory_value.value);
            this.memory.setMemoryDoubleBinaryByAddress(address, binary64);
            break;
          }
        }
        // this.log('Dirección: ', address, 'con valor', value, 'de la instrucción', instructionText);
      }
    }

    this.dataStatistics.TOTAL.ID_EXECUTED.instructions++;
    this.dataStatistics$.next(this.dataStatistics);
    this.stepSimulation$.next(this.statusMachineInStep);
    this.step$.next(this.privateStep);
    this.line$.next(this.privateLine);

    /**
     const message = "PrivateLine: " + this.privateLine.toString();
     const title = "CLOCK";
     await this.toastMessage(message, title);
     */
    return Promise.resolve();
  }

  private static getRegisterNumber(str): number {
    return parseInt(str.replace(/\D/g, ''));
  }

  public log(...msg: any) {
    console.debug('Line :', this.privateLine, 'Step: ', this.privateStep, msg);
    this.logger = Utils.stringFormat("Step: {0} Line: {1} | {2} ", this.privateStep, this.privateLine, ...msg);
    this.logger$.next(this.logger);
  }

  private static async getStepInRunner(step: number): Promise<TypeStepSimulation | null> {
    const response = await fetch('./assets/examples-dlx/prime.s/run_' + step + '.json');
    const status: TypeStepSimulation = await response.json();
    //const status = this.simulation.runner.filter((value) => value.step === step)[0];
    if (status === undefined) {
      console.error('No hay nada que simular');
      return Promise.reject('No hay nada que simular');
    } else {
      if (status.pipeline === undefined) {
        status.pipeline = DEFAULT_PIPELINE;
      }
      return Promise.resolve(status);
    }
  }

  public getMemory(index: number): Int32 {
    if (this.memory.getMemoryWordByIndex(index) === undefined) {
      this.memory.setMemoryWordByIndex(index, new Int32());
    }
    return this.memory.getMemoryWordByIndex(index);
  }

  public getRegister(index: TypeRegisterToEdit, typeRegister: TypeRegister): Int32 | Float32 | Double64 {
    let register: Int32 | Float32 | Double64;
    let binary = "";
    switch (typeRegister) {
      case "Control":
        binary = this.registers[index].binary;
        register = new Int32();
        register.binary = binary;
        break;
      case "Integer":
        binary = this.registers.R[index].binary;
        register = new Int32();
        register.binary = binary;
        break;
      case "Float":
        binary = this.registers.F[index].binary;
        register = new Float32();
        register.binary = binary;
        break;
      case "Double":
        binary += this.registers.F[index].binary;
        binary += this.registers.F[index].binary;
        register = new Double64();
        register.binary = binary;
        break;
    }

    return register;
  }

  public getTableCode(address: string): TypeTableCode {
    if (this.code.get(address) === undefined) {
      console.warn("Error, dirección de memoria erronea '%s' | %o", address, this.code.get(address));
      return DEFAULT_TABLE_CODE;
    }
    return this.code.get(address);
  }

  getBinaryOfMemory_Byte(address: number, module: 0 | 1 | 2 | 3): string {
    const binary = this.getMemory(address).binary.padStart(32, '0');
    return binary.substr(8 * module, 8);
  }

  getBinaryOfMemory_HalfWord(address: number, module: 0 | 1): string {
    const binary = this.getMemory(address).binary.padStart(32, '0');
    return binary.substr(16 * module, 16);
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
    const part2 = this.getMemory(address + 1).binary.padStart(32, '0');
    if (part2 === DEFAULT_BINARY_32_BITS) {
      return DEFAULT_BINARY_64_BITS;
    }
    return part1 + part2;
  }

  private async loadExamples(): Promise<void> {
    const response = await fetch('./assets/examples-dlx/example-runner.json');
    const simulation: SimulationResponse = await response.json();
    this.log(simulation);

    this.simulation = simulation;
    const data_code_array: TypeTableCode[] = [];
    for (const ins of this.simulation.code) {
      const address = ins.address;
      const binary32 = Utils.hexadecimalToBinary(ins.code);
      this.memory.setMemoryWordBinaryByAddress(address, binary32);

      this.code.set(ins.address, ins);
      data_code_array.push(ins);
    }
    this.dataCodeArray = data_code_array;
    this.codeSimulation$.next(data_code_array);
    return Promise.resolve();
  }

  private async toastMessage(key_title: string = 'TOAST.LOGIN_FALSE',
                             key_message: string = 'TOAST.ACCESS_DENIED'): Promise<void> {
    const config: Partial<IndividualConfig> = {
      timeOut: 5000,
      positionClass: 'toast-bottom-left'
    };
    const message = await this.translate.get(key_message).toPromise();
    const title = await this.translate.get(key_title).toPromise();
    this.toast.info(message, title, config);
    return Promise.resolve();
  }

  public getAllStatusMachine(): TypeStatusMachine {
    return {
      registers: this.registers,
      memory: this.memory,
      breakpoints: this.breakpointManager,
      hello: ''
    };
  }

  private debug() {
    return {
      'Line: ': this.privateLine,
      'Step: ': this.privateStep,
      'isRunning: ': this.isRunning,
      'isComplete: ': this.isComplete,
      'isBreakpoint: ': this.breakpointManager.isBreakpoint(this.privateLine),
    };
    /*
      console.debug(
        'Line: ', this.privateLine,
        'Step: ', this.privateStep,
        'isRunning: ', this.isRunning,
        'isComplete: ', this.isComplete,
        'isBreakpoint: ', isBreakpoint,
        'isBreakpoint: ', isBreakpoint,
        'Status: ', this.statusMachineInStep
      );
     */
  }
}
