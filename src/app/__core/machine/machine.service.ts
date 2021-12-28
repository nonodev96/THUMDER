import { Injectable } from "@angular/core";
import { interval, Observable, PartialObserver, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ToastrService } from "ngx-toastr";
import { TranslateService } from "@ngx-translate/core";
import { IndividualConfig } from "ngx-toastr/toastr/toastr-config";
import { PixiTHUMDER_Pipeline } from "./PixiTHUMDER_Pipeline";
import { PixiTHUMDER_CycleClockDiagram } from "./PixiTHUMDER_CycleClockDiagram";
import {
  InterfaceFileItem,
  TypeAllMemory,
  TypeAllRegisters,
  TypeCode,
  TypeConfigurationMachine,
  TypeDataStatistics,
  TypeFloatingPointStageConfiguration,
  TypeMemoryToUpdate,
  TypeRegisterToUpdate,
  TypeSimulationInitRequest,
  TypeSimulationInitResponse,
  TypeSimulationStep,
  TypeStage,
  TypeStatusMachine,
  TypePipelineToProcess, TypeData
} from "../../types";
import {
  CONFIG_WEBSOCKET,
  DEFAULT_CODE,
  DEFAULT_PIPELINE,
  DEFAULT_STEP_SIMULATION,
  DEFAULT_TABLE_CODE
} from "../../CONSTAST";
import { Utils } from "../../Utils";
import { StorageService } from "../storage/storage.service";
import { ManagerRegisters } from "../DLX/ManagerRegisters";
import { ManagerMemory } from "../DLX/ManagerMemory";
import { ManagerBreakpoints } from "../DLX/ManagerBreakpoints";
import { TypeBreakpoints } from "../../components/monaco-editor/monaco-editor.component";
import { SocketProviderConnectService } from "../services/socket-provider-connect.service";
import { ManagerStatistics } from "../DLX/ManagerStatistics";
import { UtilsDataStructures } from "../../UtilsDataStructures";
import THUMDER_Map = UtilsDataStructures.THUMDER_Map;


@Injectable({
  providedIn: "root"
})
export class MachineService {
  public floatingPointStageConfiguration: TypeFloatingPointStageConfiguration;
  public pipeline: PixiTHUMDER_Pipeline;
  public cycleClockDiagram: PixiTHUMDER_CycleClockDiagram;

  // La memoria se organiza de directions de 4 bits en 4 bits
  public dataStatistics: ManagerStatistics;
  public registers: ManagerRegisters;
  public memory: ManagerMemory;
  public memorySize;

  public breakpointManager: ManagerBreakpoints;
  // address --> TypeCode

  public code: THUMDER_Map<string, TypeCode> = new THUMDER_Map();
  // Vector con los pasos de la simulación
  private simulation: TypeSimulationInitResponse;
  public canSimulate: boolean;
  private statusMachineInStep: TypeSimulationStep | null;
  // Line
  public isBreakpoint$: Subject<number> = new Subject<number>();
  public codeSimulation$: Subject<TypeCode[]> = new Subject<TypeCode[]>();
  public stepSimulation$: Subject<TypeSimulationStep> = new Subject<TypeSimulationStep>();
  public dataStatistics$: Subject<TypeDataStatistics> = new Subject<TypeDataStatistics>();

  public logger: string = "";
  private privateStep: number = 0;
  private privateLine: number = 0;
  private timer: Observable<number>;
  private readonly timerObserver: PartialObserver<number>;

  public reset$: Subject<void> = new Subject<void>();
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
              private socketProviderConnect: SocketProviderConnectService,
              private translate: TranslateService,
              private toast: ToastrService) {
    // this.pipeline = new PixiTHUDER_Pipeline(
    //   this.floatingPointStageConfiguration.addition.count,
    //   this.floatingPointStageConfiguration.multiplication.count,
    //   this.floatingPointStageConfiguration.division.count
    // );
    this.canSimulate = false;

    this.floatingPointStageConfiguration = this.store.getItem("floating_point_stage_configuration");
    this.pipeline = new PixiTHUMDER_Pipeline(
      this.floatingPointStageConfiguration.addition.count,
      this.floatingPointStageConfiguration.multiplication.count,
      this.floatingPointStageConfiguration.division.count
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
    //    console.log("Simulation Init", simulationInit);
    //  });
    //  this.socketProviderConnect.socket.on("SimulationNextStepResponse", (response) => {
    //    const simulationStep = JSON.parse(response) as TypeSimulationStep;
    //    console.log("Simulation Step", simulationStep);
    //  });
    // TODO CHECK
    this.socketProviderConnect.socketIO.on("UpdateRegisterResponse", (response) => {
      const registers = JSON.parse(response) as TypeRegisterToUpdate[];
      this.registers.processResponse(registers);
      console.log("Registers update", registers);
    });
    // TODO CHECK
    this.socketProviderConnect.socketIO.on("UpdateMemoryResponse", (response) => {
      const memory = JSON.parse(response) as TypeMemoryToUpdate[];
      this.memory.processResponse(memory);
      console.log("Memory update", memory);
    });
    this.socketProviderConnect.socketIO.on("GetAllRegistersResponse", (response) => {
      const allRegisters = JSON.parse(response) as TypeAllRegisters;
      console.log("GetAllRegisters", allRegisters);
    });
    this.socketProviderConnect.socketIO.on("GetAllMemoryResponse", (response) => {
      const allMemory = JSON.parse(response) as TypeAllMemory;
      console.log("GetAllMemory", allMemory);
    });
    this.socketProviderConnect.socketIO.on("UpdateConfigurationMachineResponse", (response) => {
      const configurationMachine = JSON.parse(response) as TypeConfigurationMachine[];
      console.log("Configuration machine", configurationMachine);
    });

    const timeSimulation = this.store.getItem("time_simulation_configuration");
    this.timer = interval(timeSimulation).pipe(
      takeUntil(this.isRunning$),
      takeUntil(this.isComplete$)
    );

    this.timerObserver = {
      next: async (_: number): Promise<void> => {
        if (this.isRunning === true) {
          await this.SimulationNextStep();
        }
        return Promise.resolve();
      }
    };
  }

  // TODO
  public async resetMachineStatus(): Promise<boolean> {
    try {
      await this.toastMessage("TOAST.TITLE_RESET_MACHINE", "TOAST.MESSAGE_RESET_MACHINE");
      await this.SimulationInit();
      this.log("RESET");
      this.reset$.next();

      this.breakpointManager.reset();
      const breakpointsSaved = this.store.getItem("breakpoints") as TypeBreakpoints;
      this.breakpointManager.updateManager(breakpointsSaved);

      this.registers.reset();

      this.memorySize = this.store.getItem("memory_size_configuration");
      this.memory.setSize(this.memorySize);
      this.memory.reset();

      this.floatingPointStageConfiguration = this.store.getItem("floating_point_stage_configuration") as TypeFloatingPointStageConfiguration;
      this.pipeline.reset(
        this.floatingPointStageConfiguration.addition.count,
        this.floatingPointStageConfiguration.multiplication.count,
        this.floatingPointStageConfiguration.division.count
      );
      this.cycleClockDiagram.reset();

      this.privateStep = 0;
      this.privateLine = 0;
      this.canSimulate = false;

      this.dataStatistics.reset();
      this.dataStatistics$.next(this.dataStatistics.getData());

      this.code = new THUMDER_Map();
      this.code.clear();
      this.code.setDefaultValue(DEFAULT_CODE);
      this.isComplete = false;
      this.isRunning = false;
      this.isBreakpoint = false;

      const timeSimulation = this.store.getItem("time_simulation_configuration") as number;
      this.timer = null;
      this.timer = interval(timeSimulation).pipe(
        takeUntil(this.isRunning$),
        takeUntil(this.isComplete$)
      );
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

  public getStepSimulationObservable(): Observable<TypeSimulationStep> {
    return this.stepSimulation$.asObservable();
  }

  public getCodeSimulationObservable(): Observable<TypeCode[]> {
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
    return this.socketProviderConnect.connectObservable;
  }

  public getStatusWebsocket(): "Connect" | "Disconnect" {
    return this.socketProviderConnect.socketIO.ioSocket.id === "" ? "Disconnect" : "Connect";
  }


  public getListStatusPipeline(): TypePipelineToProcess[] {
    const {IF, ID, intEX, MEM, WB} = this.statusMachineInStep.pipeline;
    const list_elements: TypePipelineToProcess[] = [];
    if (IF.draw) list_elements.push({...IF, stage: "IF"});
    if (ID.draw) list_elements.push({...ID, stage: "ID"});
    if (intEX.draw) list_elements.push({...intEX, stage: "intEX"});
    if (MEM.draw) list_elements.push({...MEM, stage: "MEM"});
    if (WB.draw) list_elements.push({...WB, stage: "WB"});
    for (const f_a of this.statusMachineInStep.pipeline.faddEX) {
      if (f_a.draw) list_elements.push({...f_a, stage: "addEX" as TypeStage, unit: f_a.unit});
    }
    for (const f_m of this.statusMachineInStep.pipeline.fmultEX) {
      if (f_m.draw) list_elements.push({...f_m, stage: "fmultEX" as TypeStage, unit: f_m.unit});
    }
    for (const f_d of this.statusMachineInStep.pipeline.fdivEX) {
      if (f_d.draw) list_elements.push({...f_d, stage: "fdivEX" as TypeStage, unit: f_d.unit});
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
    this.timer.subscribe(this.timerObserver);
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
      // const data = await fetch("assets/examples-dlx/prim.s");
      // const content = await data.text();
      const file = this.store.getItem("interfaceFileItem") as InterfaceFileItem;
      const content = file.content;
      const payload = JSON.stringify({
        id:        this.socketProviderConnect.socketIO.ioSocket.id,
        filename:  "prim.s",
        date:      new Date().toLocaleDateString(),
        content:   content,
        registers: [],
        memory:    []
      } as TypeSimulationInitRequest);
      this.socketProviderConnect.emitMessage("SimulationInitRequest", payload, (response) => {
        const simulationInit = JSON.parse(response) as TypeSimulationInitResponse;
        console.log("Simulation init", simulationInit);
        this.canSimulate = simulationInit.canSimulate;
        const data_code_array: TypeCode[] = [];
        for (const instruction of simulationInit.code) {
          const address = instruction.address;
          const binary32 = Utils.hexadecimalToBinary(instruction.code);
          this.memory.setMemoryWordBinaryByAddress(address, binary32);
          this.code.set(instruction.address, {...instruction});
          data_code_array.push({...instruction});
        }

        for (const step of simulationInit.runner) {
          this.memory.processResponse(step.memory);
          this.registers.processResponse(step.registers);
        }

        this.codeSimulation$.next(data_code_array);

        return Promise.resolve(true);
      });
    } catch (error) {
      console.error(error);
      return Promise.reject(error.message);
    }
  }

  private async SimulationNextStep(): Promise<void> {
    try {
      const payload = JSON.stringify({
        step: this.privateStep + 1
      });
      this.socketProviderConnect.emitMessage("SimulationNextStepRequest", payload, async (response) => {
        this.statusMachineInStep = DEFAULT_STEP_SIMULATION;
        this.statusMachineInStep = JSON.parse(response) as TypeSimulationStep;
        const canNextInstruction = await this.CheckConditions();
        if (canNextInstruction) await this.ProcessStep();
        console.log("MachineInStep: ", this.statusMachineInStep);
      });
      return Promise.resolve();
    } catch (error) {
      console.error(error);
      return Promise.reject(error.message);
    }
  }

  private async CheckConditions(): Promise<boolean> {
    if (this.statusMachineInStep === null) {
      console.warn("End of status of machine");
      return Promise.resolve(false);
    }
    this.privateStep = this.statusMachineInStep.step;
    this.privateLine = this.statusMachineInStep.line;
    this.isComplete = this.statusMachineInStep.isComplete ?? false;
    this.isBreakpoint = this.breakpointManager.isBreakpoint(this.privateLine);
    // this.log(this.debug());
    if (this.isComplete) {
      this.canSimulate = false;
      this.isComplete = true;
      this.isRunning = false;
      this.isRunning$.next(this.isRunning);
      await this.toastMessage("TOAST.TITLE_END_SIMULATION", "TOAST.MESSAGE_END_SIMULATION");
      return Promise.resolve(false);
    }
    if (this.isBreakpoint) {
      this.line$.next(this.privateLine);
      this.isRunning = false;
      this.isRunning$.next(this.isRunning);
      this.isBreakpoint$.next(this.privateLine);
      await this.toastMessage("TOAST.TITLE_BREAKPOINT_SIMULATION", "TOAST.MESSAGE_BREAKPOINT_SIMULATION");
      return Promise.resolve(false);
    }
    if (this.isComplete === false && this.isBreakpoint === false) {
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }

  private async ProcessStep(): Promise<void> {
    if (this.isComplete === true) {
      console.warn("isComplete", this.isComplete);
      return Promise.resolve();
    }
    if (this.statusMachineInStep.pipeline) {
      this.processResponsePipeline();
    }
    if (this.statusMachineInStep.registers !== []) {
      this.registers.processResponse(this.statusMachineInStep.registers);
    }
    if (this.statusMachineInStep.memory !== []) {
      this.memory.processResponse(this.statusMachineInStep.memory);
    }
    if (this.statusMachineInStep.statistics !== {}) {
      this.dataStatistics.processResponse(this.statusMachineInStep.statistics);
    }
    this.dataStatistics$.next(this.dataStatistics.getData());
    this.stepSimulation$.next(this.statusMachineInStep);
    this.step$.next(this.privateStep);
    this.line$.next(this.privateLine);
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
      return Promise.reject(error.message);
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
      return Promise.reject(error.message);
    }
  }

  public log(...msg: any) {
    console.debug("Line :", this.privateLine, "Step: ", this.privateStep, msg);
    this.logger = Utils.stringFormat("Step: {0} Line: {1} | {2} ", this.privateStep, this.privateLine, ...msg);
    this.logger$.next(this.logger);
  }

  public getCode(address: string): TypeCode {
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
      registers:   this.registers,
      memory:      this.memory.getAllMemory(),
      breakpoints: this.breakpointManager.getAllBreakpoints(),
      statistics:  this.dataStatistics.getData()
    };
  }

  public resetConnection() {
    this.socketProviderConnect.socketIO.ioSocket.connect(CONFIG_WEBSOCKET.url, {"force new connection": true});
  }


  private async toastMessage(key_title: string = "TOAST.LOGIN_FALSE",
                             key_message: string = "TOAST.ACCESS_DENIED"): Promise<void> {
    const config: Partial<IndividualConfig> = {
      timeOut:       5000,
      positionClass: "toast-bottom-left"
    };
    const message = await this.translate.get(key_message).toPromise();
    const title = await this.translate.get(key_title).toPromise();
    this.toast.info(message, title, config);
    return Promise.resolve();
  }

  private processResponsePipeline() {

  }
}
