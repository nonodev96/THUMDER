import { Injectable } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { type IndividualConfig, ToastrService } from "ngx-toastr";
import { firstValueFrom, interval, type Observable, type PartialObserver, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { CONFIG_WEBSOCKET, DEFAULT_CODE, DEFAULT_ENABLED_FORWARDING_CONFIGURATION, DEFAULT_STEP_SIMULATION } from "../../CONSTANTS";
import {
  EnumLogLevel,
  type InterfaceFileItem,
  type TypeAddress,
  type TypeAllMemory,
  type TypeAllRegisters,
  type TypeBreakpoints,
  type TypeConfigurationMachine,
  type TypeDataStatistics,
  type TypeEnabledForwardingConfiguration,
  type TypeErrorInCode,
  type TypeFloatingPointStageConfiguration,
  type TypeInstructionsData,
  type TypeLogger,
  type TypeMemoryToUpdate,
  type TypePipelineToProcess,
  type TypeRegisterToUpdate,
  type TypeSimulationInitRequest,
  type TypeSimulationInitResponse,
  type TypeSimulationStep,
  type TypeStage,
  type TypeStatusMachine,
} from "../../Types";
import { Utils } from "../../Utils";
import { UtilsDataStructures } from "../../UtilsDataStructures";
import { ManagerBreakpoints } from "../DLX/ManagerBreakpoints";
import { ManagerMemory } from "../DLX/ManagerMemory";
import { ManagerRegisters } from "../DLX/ManagerRegisters";
import { ManagerStatistics } from "../DLX/ManagerStatistics";
import { SocketProviderConnectService } from "../services/socket/socket-provider-connect.service";
import { StorageService } from "../storage/storage.service";
import { PixiTHUMDER_CycleClockDiagram } from "./PixiTHUMDER_CycleClockDiagram";
import { PixiTHUMDER_Pipeline } from "./PixiTHUMDER_Pipeline";

import THUMDER_Map = UtilsDataStructures.THUMDER_Map;

@Injectable({
  providedIn: "root",
})
export class MachineService {
  public floatingPointStageConfiguration: TypeFloatingPointStageConfiguration;
  public pipeline: PixiTHUMDER_Pipeline;
  public cycleClockDiagram: PixiTHUMDER_CycleClockDiagram;

  // La memoria se organiza de directions de 4 bits en 4 bits
  public dataStatistics: ManagerStatistics;
  public registers: ManagerRegisters;
  public memory: ManagerMemory;
  public memorySize: number;
  public enabledForwarding: TypeEnabledForwardingConfiguration = DEFAULT_ENABLED_FORWARDING_CONFIGURATION;

  public breakpointManager: ManagerBreakpoints;
  // address --> TypeCode

  public code: THUMDER_Map<TypeAddress, TypeInstructionsData> = new THUMDER_Map();
  // Vector con los pasos de la simulación
  public canSimulate: boolean;
  private statusMachineInStep: TypeSimulationStep | null = null;
  // Line
  public isBreakpoint$: Subject<number> = new Subject<number>();
  public codeSimulation$: Subject<TypeInstructionsData[]> = new Subject<TypeInstructionsData[]>();
  public stepSimulation$: Subject<TypeSimulationStep> = new Subject<TypeSimulationStep>();
  public dataStatistics$: Subject<TypeDataStatistics> = new Subject<TypeDataStatistics>();
  public errorsInCode$: Subject<TypeErrorInCode[]> = new Subject<TypeErrorInCode[]>();

  public logger: string = "";
  private readonly level: EnumLogLevel;
  private privateStep: number = 0;
  private privateLine: number = 0;
  private timer: Observable<number> | null = null;
  private readonly timerObserver: PartialObserver<number>;

  public reset$: Subject<void> = new Subject<void>();
  public logger$: Subject<string> = new Subject<string>();
  public step$: Subject<number> = new Subject<number>();
  public line$: Subject<number> = new Subject<number>();

  // stopClick$ = new Subject<void>();
  public isRunning$ = new Subject<boolean>();
  public isComplete$ = new Subject<boolean>();

  // Por defecto parado y sin completar
  isRunning: boolean = false;
  isComplete: boolean = false;
  isBreakpoint: boolean = false;

  constructor(
    private store: StorageService,
    private socketProviderConnect: SocketProviderConnectService,
    private translate: TranslateService,
    private toast: ToastrService,
  ) {
    this.level = EnumLogLevel.All;

    this.canSimulate = false;

    this.floatingPointStageConfiguration = this.store.getItem("floating_point_stage_configuration");
    this.pipeline = new PixiTHUMDER_Pipeline(
      this.floatingPointStageConfiguration.addition.count,
      this.floatingPointStageConfiguration.multiplication.count,
      this.floatingPointStageConfiguration.division.count,
    );
    this.cycleClockDiagram = new PixiTHUMDER_CycleClockDiagram();

    this.memorySize = this.store.getItem("memory_size_configuration");
    this.memory = new ManagerMemory(this.memorySize);
    this.registers = new ManagerRegisters();
    this.breakpointManager = new ManagerBreakpoints();
    this.dataStatistics = new ManagerStatistics();

    this.privateStep = 0;
    this.privateLine = 0;

    //  this.socketProviderConnect.socket.on("SimulationInitResponse", (response) => {
    //    const simulationInit = JSON.parse(response) as TypeSimulationInitResponse;
    //    console.debug("Simulation Init", simulationInit);
    //  });
    //  this.socketProviderConnect.socket.on("SimulationNextStepResponse", (response) => {
    //    const simulationStep = JSON.parse(response) as TypeSimulationStep;
    //    console.debug("Simulation Step", simulationStep);
    //  });
    // TODO CHECK
    this.socketProviderConnect.socketIO.on("UpdateRegisterResponse", (response: string) => {
      const registers = JSON.parse(response) as TypeRegisterToUpdate[];
      this.registers.processRegisterToUpdateArray(registers);
      console.debug("Registers update", registers);
    });
    // TODO CHECK
    this.socketProviderConnect.socketIO.on("UpdateMemoryResponse", (response: string) => {
      const memory = JSON.parse(response) as TypeMemoryToUpdate[];
      this.memory.processMemoryToUpdateArray(memory);
      console.debug("Memory update", memory);
    });
    this.socketProviderConnect.socketIO.on("GetAllRegistersResponse", (response: string) => {
      const allRegisters = JSON.parse(response) as TypeAllRegisters;
      console.debug("GetAllRegisters", allRegisters);
    });
    this.socketProviderConnect.socketIO.on("GetAllMemoryResponse", (response: string) => {
      const allMemory = JSON.parse(response) as TypeAllMemory;
      console.debug("GetAllMemory", allMemory);
    });
    this.socketProviderConnect.socketIO.on("UpdateConfigurationMachineResponse", (response: string) => {
      const configurationMachine = JSON.parse(response) as TypeConfigurationMachine;
      console.debug("Configuration machine", configurationMachine);
    });

    const timeSimulation = this.store.getItem("time_simulation_configuration");
    this.timer = interval(timeSimulation).pipe(takeUntil(this.isRunning$), takeUntil(this.isComplete$));

    this.timerObserver = {
      next: async (_: number): Promise<void> => {
        if (this.isRunning === true) {
          await this.SimulationNextStep();
        }
        return Promise.resolve();
      },
    };
  }

  public async resetMachineStatus(): Promise<boolean> {
    try {
      this.writeToLog("RESET");
      await this.toastMessage("TOAST.TITLE_RESET_MACHINE", "TOAST.MESSAGE_RESET_MACHINE");
      await this.SimulationInit();
      this.reset$.next();

      this.breakpointManager.reset();
      const breakpointsSaved = this.store.getItem("breakpoints") as TypeBreakpoints;
      this.breakpointManager.updateManager(breakpointsSaved);

      this.registers.reset();

      this.memorySize = this.store.getItem("memory_size_configuration");
      this.memory.setSize(this.memorySize);
      this.memory.reset();

      this.floatingPointStageConfiguration = this.store.getItem(
        "floating_point_stage_configuration",
      ) as TypeFloatingPointStageConfiguration;
      this.pipeline.reset(
        this.floatingPointStageConfiguration.addition.count,
        this.floatingPointStageConfiguration.multiplication.count,
        this.floatingPointStageConfiguration.division.count,
      );
      this.cycleClockDiagram.reset();

      this.privateStep = 0;
      this.privateLine = 0;
      this.canSimulate = false;

      this.dataStatistics.reset();
      this.dataStatistics$.next(this.dataStatistics.getData());
      this.enabledForwarding = this.store.getItem("enabled_forwarding_configuration") as TypeEnabledForwardingConfiguration;

      const payload: TypeConfigurationMachine = {
        enabledForwarding: this.enabledForwarding,
        memorySize: this.memorySize,
        addition: {
          count: this.floatingPointStageConfiguration.addition.count,
          delay: this.floatingPointStageConfiguration.addition.delay,
        },
        division: {
          count: this.floatingPointStageConfiguration.division.count,
          delay: this.floatingPointStageConfiguration.division.delay,
        },
        multiplication: {
          count: this.floatingPointStageConfiguration.multiplication.count,
          delay: this.floatingPointStageConfiguration.multiplication.delay,
        },
      };
      this.socketProviderConnect.emitMessage("UpdateConfigurationMachineRequest", JSON.stringify(payload), (response: string) => {
        // console.log(response);
        this.writeToLog(JSON.stringify(response));
      });

      // Reset Editor
      this.line$.next(-1);

      this.code = new THUMDER_Map();
      this.code.clear();
      this.code.setDefaultValue(DEFAULT_CODE);
      this.isComplete = false;
      this.isRunning = false;
      this.isBreakpoint = false;

      const timeSimulation = this.store.getItem("time_simulation_configuration") as number;
      this.timer = null;
      this.timer = interval(timeSimulation).pipe(takeUntil(this.isRunning$), takeUntil(this.isComplete$));
      // await this.loadExamples();
      return Promise.resolve(true);
    } catch (error) {
      console.error(error);
      return Promise.reject(error);
    }
  }

  public getResetObservable(): Observable<void> {
    return this.reset$.asObservable();
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

  public getIsCompleteObservable(): Observable<boolean> {
    return this.isComplete$.asObservable();
  }

  public getStepSimulationObservable(): Observable<TypeSimulationStep> {
    return this.stepSimulation$.asObservable();
  }

  public getCodeSimulationObservable(): Observable<TypeInstructionsData[]> {
    return this.codeSimulation$.asObservable();
  }

  public getDebuggerObservable(): Observable<number> {
    return this.isBreakpoint$.asObservable();
  }

  public getDataStatisticsObservable(): Observable<TypeDataStatistics> {
    return this.dataStatistics$.asObservable();
  }

  public getLoggerObservable(): Observable<string> {
    return this.logger$.asObservable();
  }

  public getStatusWebsocketObservable(): Observable<"Connect" | "Disconnect"> {
    return this.socketProviderConnect.connectObservable();
  }

  public getErrorsInCodeObservable(): Observable<TypeErrorInCode[]> {
    return this.errorsInCode$.asObservable();
  }

  public getStatusWebsocket(): "Connect" | "Disconnect" {
    return this.socketProviderConnect.socketIO.ioSocket.id === "" ? "Disconnect" : "Connect";
  }

  public getListStatusPipeline(): TypePipelineToProcess[] {
    if (this.statusMachineInStep === null) return [];
    const { IF, ID, intEX, MEM, WB } = this.statusMachineInStep.pipeline;
    const list_elements: TypePipelineToProcess[] = [];
    if (IF.draw) list_elements.push({ ...IF, stage: "IF" });
    if (ID.draw) list_elements.push({ ...ID, stage: "ID" });
    if (intEX.draw) list_elements.push({ ...intEX, stage: "intEX" });
    if (MEM.draw) list_elements.push({ ...MEM, stage: "MEM" });
    if (WB.draw) list_elements.push({ ...WB, stage: "WB" });
    for (const f_a of this.statusMachineInStep.pipeline.faddEX) {
      if (f_a.draw) list_elements.push({ ...f_a, stage: "addEX" as TypeStage, unit: f_a.unit });
    }
    for (const f_m of this.statusMachineInStep.pipeline.fmultEX) {
      if (f_m.draw) list_elements.push({ ...f_m, stage: "fmultEX" as TypeStage, unit: f_m.unit });
    }
    for (const f_d of this.statusMachineInStep.pipeline.fdivEX) {
      if (f_d.draw) list_elements.push({ ...f_d, stage: "fdivEX" as TypeStage, unit: f_d.unit });
    }
    return list_elements;
  }

  // Navbar
  public async reset(): Promise<void> {
    await this.resetMachineStatus();
    return Promise.resolve();
  }

  public async nextStep(): Promise<void> {
    await this.SimulationNextStep();
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
    this.timer?.subscribe(this.timerObserver);
    return Promise.resolve();
  }

  public async end(): Promise<void> {
    this.privateStep = -1;
    this.isRunning = false;
    this.isComplete = true;

    this.isRunning$.next(this.isRunning);
    return Promise.resolve();
  }

  private async SimulationInit(): Promise<boolean> {
    try {
      this.writeToLog("SimulationInit");
      const file = this.store.getItem("interfaceFileItem") as InterfaceFileItem;
      const content = file.content;
      const payload = JSON.stringify({
        id: this.socketProviderConnect.socketIO.ioSocket.id,
        filename: file.name,
        date: Utils.dateToStringFormat(new Date()),
        content: content,
        registers: [],
        memory: [],
        breakpoints: [],
      } as TypeSimulationInitRequest);
      this.socketProviderConnect.emitMessage("SimulationInitRequest", payload, (response: string) => {
        const simulationInit = JSON.parse(response) as TypeSimulationInitResponse;

        this.errorsInCode$.next(simulationInit.errors);

        this.canSimulate = simulationInit.canSimulate;

        this.memory.processResponseMachineDirectives(simulationInit.machineDirectives);
        this.memory.processResponseMachineInstructions(simulationInit.machineInstructions);

        const code_data_array: TypeInstructionsData[] = [];
        for (const instruction of simulationInit.machineInstructions) {
          this.code.set(Utils.stringToAddress(instruction.address), { ...instruction });
          code_data_array.push({ ...instruction });
        }

        for (const step of simulationInit.runner) {
          this.memory.processMemoryToUpdateArray(step.memory);
          this.registers.processRegisterToUpdateArray(step.registers);
        }

        this.codeSimulation$.next(code_data_array);
        return Promise.resolve(true);
      });
      return Promise.resolve(false);
    } catch (error) {
      console.error(error);
      return Promise.reject((error as Error).message);
    }
  }

  private async SimulationNextStep(): Promise<void> {
    try {
      const payload = JSON.stringify({
        step: this.privateStep + 1,
      });
      this.writeToLog("payload S: {0}", EnumLogLevel.Debug, [{ index: 0, value: this.privateStep }]);
      this.socketProviderConnect.emitMessage("SimulationNextStepRequest", payload, async (response: string) => {
        this.statusMachineInStep = DEFAULT_STEP_SIMULATION;
        this.statusMachineInStep = JSON.parse(response) as TypeSimulationStep;
        const canNextInstruction = await this.CheckConditions();
        if (canNextInstruction) {
          await this.ProcessStep();
          this.writeToLog("SimulationNextStep S: {0} L: {1} JSON: {2}", EnumLogLevel.Debug, [
            { index: 0, value: this.privateStep },
            { index: 1, value: this.privateLine },
            { index: 2, value: this.statusMachineInStep },
          ]);
        }
        // console.log("MachineInStep: ", this.statusMachineInStep);
      });
      return Promise.resolve();
    } catch (error) {
      console.error(error);
      return Promise.reject((error as Error).message);
    }
  }

  private async CheckConditions(): Promise<boolean> {
    if (this.statusMachineInStep === null) {
      console.warn("End of status of machine");
      return Promise.resolve(false);
    }
    this.isComplete = this.statusMachineInStep.isComplete ?? false;
    this.isBreakpoint = this.statusMachineInStep.isBreakpoint || this.breakpointManager.isBreakpoint(this.statusMachineInStep.line);
    this.privateStep = this.statusMachineInStep.step;
    this.privateLine = this.statusMachineInStep.line;
    if (this.isComplete) {
      this.isComplete$.next(this.isComplete);
      this.canSimulate = false;
      this.isRunning = false;
      this.isRunning$.next(this.isRunning);
      await this.toastMessage("TOAST.TITLE_END_SIMULATION", "TOAST.MESSAGE_END_SIMULATION");
      return Promise.resolve(false);
    }
    if (this.isBreakpoint) {
      this.isRunning = false;
      this.line$.next(this.statusMachineInStep.line);
      this.isRunning$.next(this.isRunning);
      this.isBreakpoint$.next(this.statusMachineInStep.line);
      await this.toastMessage("TOAST.TITLE_BREAKPOINT_SIMULATION", "TOAST.MESSAGE_BREAKPOINT_SIMULATION");
      return Promise.resolve(true);
    }
    return Promise.resolve(true);
  }

  private async ProcessStep(): Promise<void> {
    if (this.isComplete === true || this.statusMachineInStep === null) {
      console.warn("isComplete or statusMachineInStep is null");
      return Promise.resolve();
    }
    if (this.statusMachineInStep.pipeline) {
      this.processResponsePipeline();
    }
    if (this.statusMachineInStep.registers && this.statusMachineInStep.registers.length > 0) {
      this.registers.processRegisterToUpdateArray(this.statusMachineInStep.registers);
    }
    if (this.statusMachineInStep.memory && this.statusMachineInStep.memory.length > 0) {
      this.memory.processMemoryToUpdateArray(this.statusMachineInStep.memory);
    }
    if (this.statusMachineInStep.statistics && Object.keys(this.statusMachineInStep.statistics).length > 0) {
      this.dataStatistics.processResponse(this.statusMachineInStep.statistics);
    }
    this.stepSimulation$.next(this.statusMachineInStep);
    this.dataStatistics$.next(this.dataStatistics.getData());
    this.step$.next(this.statusMachineInStep.step);
    this.line$.next(this.statusMachineInStep.line);
    return Promise.resolve();
  }

  public async updateRegisterInServer(registersToUpdate: TypeRegisterToUpdate[]): Promise<boolean> {
    try {
      const payload = JSON.stringify(registersToUpdate);
      this.socketProviderConnect.emitMessage("UpdateRegisterRequest", payload, (response) => {
        console.log(response);
      });
      return Promise.resolve(true);
    } catch (error) {
      console.error(error);
      return Promise.reject((error as Error).message);
    }
  }

  public async updateMemoryInServer(memoryToUpdate: TypeMemoryToUpdate[]): Promise<boolean> {
    try {
      const payload = JSON.stringify(memoryToUpdate);
      this.socketProviderConnect.emitMessage("UpdateMemoryRequest", payload, (response) => {
        console.log(response);
      });
      return Promise.resolve(true);
    } catch (error) {
      console.error(error);
      return Promise.reject((error as Error).message);
    }
  }

  public writeToLog(msg: string, level: EnumLogLevel = EnumLogLevel.Debug, params: TypeLogger[] = []) {
    if (this.shouldLog(level)) {
      this.logger = "";
      this.logger = `${new Date().toLocaleString()} - `;
      this.logger += `Type: ${EnumLogLevel[this.level]}`;
      this.logger += ` - ${this.stringFormat(msg, params)}`;
      console.debug(this.logger);
      this.logger$.next(this.logger);
    }
  }

  private stringFormat(msg: string, params: TypeLogger[]) {
    return msg.replace(/{([0-9]+)}/g, (match: string, index) => {
      const logValue: TypeLogger = params.filter((v) => v.index === index)[0] ?? { index: -1, value: "" };
      // console.log("msg", msg, "params", params, "logValue", logValue, "match", match, "index", index);
      if (typeof logValue.value === "object") {
        return JSON.stringify(logValue.value);
      }
      return typeof logValue.value === "undefined" ? match : logValue.value;
    });
  }

  private shouldLog(level: EnumLogLevel): boolean {
    let ret: boolean = false;
    if ((level >= this.level && level !== EnumLogLevel.Off) || this.level === EnumLogLevel.All) {
      ret = true;
    }
    return ret;
  }

  public getCode(address: TypeAddress): TypeInstructionsData {
    const code = this.code.get(address);
    if (code === undefined) {
      console.warn("Error, address of memory not valid '%s' | %o", address, this.code.get(address));
      console.warn("Code: %o", Array.from(this.code.getMap()));
      return DEFAULT_CODE;
    }
    return code;
  }

  public getAllStatusMachine(): TypeStatusMachine {
    return {
      registers: this.registers,
      memory: this.memory.getAllMemory(),
      breakpoints: this.breakpointManager.getAllBreakpoints(),
      statistics: this.dataStatistics.getData(),
    };
  }

  public resetConnection() {
    this.socketProviderConnect.socketIO.ioSocket.connect(CONFIG_WEBSOCKET.url, { "force new connection": true });
  }

  private async toastMessage(key_title: string = "TOAST.LOGIN_FALSE", key_message: string = "TOAST.ACCESS_DENIED"): Promise<void> {
    const config: Partial<IndividualConfig> = {
      timeOut: 500,
      positionClass: "toast-bottom-left",
    };
    const message = await firstValueFrom(this.translate.get(key_message));
    const title = await firstValueFrom(this.translate.get(key_title));
    this.toast.info(message, title, config);
    return Promise.resolve();
  }

  private processResponsePipeline() {
    Utils.voidF();
  }
}
