import { AfterViewInit, Component, OnInit } from "@angular/core";
import { ToastrService } from "ngx-toastr";
import { DEFAULT_CONFIG_TOAST } from "../../CONSTANTS";
import { FileItem } from "../../__core/services/file-system-nonodev96/file-system.service";
import { SocketProviderConnectService } from "../../__core/services/socket-provider-connect.service";
import { Utils } from "../../Utils";
import {
  TypeInstructionsData,
  TypeConfigurationMachine,
  TypeData,
  TypeMemoryToUpdate,
  TypeRegister,
  TypeRegisterToUpdate,
  TypeSimulationInitRequest, TypeAddress
} from "../../Types";

@Component({
  selector:    "app-debug",
  templateUrl: "./debug-view.html",
  styleUrls:   ["./debug-view.scss"]
})
export class DebugView implements OnInit, AfterViewInit {

  public testCodeRequest: string = [
    "main:",
    "ADDI   R1, R0, #0",
    "ADDI   R2, R0, #2",
    "ADDI   R16, R0, #16",
    "ADDI   R18, R0, #8",
    "NEXTVALUE:",
    "ADDI   R3, R0, #0",
    "LOOP:",
    "SEQ    R4, R1, R3",
    "BNEZ   R4, ISPRIM",
    "LW     R5, TABLE(R3)",
    "DIVU   R6, R2, R5",
    "MULTU  R7, R6, R5",
    "SUBU   R8, R2, R7",
    "BEQZ   R8, ISNOPRIM",
    "ADDI   R3, R3, #4",
    "DIVU   R20, R16, R18",
    "DIVU   R22, R16, R18",
    "J      LOOP",
    "ISPRIM:",
    "SW     TABLE(R1), R2",
    "ADDI   R1, R1, #4",
    "LW     R9, COUNT",
    "SRLI   R10, R1, #2",
    "SGE    R11, R10, R9",
    "BNEZ   R11, FINISH",
    "ISNOPRIM:",
    "ADDI   R2, R2, #1",
    "J      NEXTVALUE",
    "FINISH:",
    "TRAP   #0"
  ].join("\n");

  public testCodeResponse: TypeInstructionsData[] = [];
  i = 0;

  constructor(private toast: ToastrService,
              public socketProviderConnect: SocketProviderConnectService) {
    console.log("ioSocket: ", this.socketProviderConnect.socketIO.ioSocket);
  }

  ngOnInit(): void {
    this.socketProviderConnect.socketIO.on("CodeResponse", (response) => {
      const code = JSON.parse(response) as TypeInstructionsData[];
      this.testCodeResponse = code.map((v) => {
        return {
          address:     v.address,
          code:        v.code,
          text:        v.text,
          instruction: v.instruction,
        };
      });
    });

    /*
    this.socketProviderConnect.socket.on("SimulationInitResponse", (response) => {
      const simulationInit = JSON.parse(response) as TypeSimulationInitResponse;
      console.log("Simulation Init", simulationInit);
    });
    this.socketProviderConnect.socket.on("SimulationNextStepResponse", (response) => {
      const simulationStep = JSON.parse(response) as TypeSimulationStep;
      console.log("Simulation Step", simulationStep);
    });
    this.socketProviderConnect.socket.on("UpdateRegisterResponse", (response) => {
      const registers = JSON.parse(response) as TypeRegisterToUpdate[];
      console.log("Registers update", registers);
    });
    this.socketProviderConnect.socket.on("UpdateMemoryResponse", (response) => {
      const memory = JSON.parse(response) as TypeMemoryToUpdate[];
      console.log("Memory", memory);
    });
    this.socketProviderConnect.socket.on("GetAllRegistersResponse", (response) => {
      const allRegisters = JSON.parse(response) as TypeAllRegisters;
      console.log("GetAllRegisters", allRegisters);
    });
    this.socketProviderConnect.socket.on("GetAllMemoryResponse", (response) => {
      const allMemory = JSON.parse(response) as TypeAllMemory;
      console.log("GetAllMemory", allMemory);
    });
    this.socketProviderConnect.socket.on("UpdateConfigurationMachineResponse", (response) => {
      const configurationMachine = JSON.parse(response) as TypeConfigurationMachine[];
      console.log("Configuration machine", configurationMachine);
    });
    */
  }

  ngAfterViewInit(): void {
  }

  socketReconnect() {
    this.socketProviderConnect.socketIO.connect();
  }

  showToast() {
    this.toast.success("Hello world!", "Toast fun!", DEFAULT_CONFIG_TOAST);
  }

  debugLocalStorage() {
    console.log(localStorage.getItem("FileSystem"));

    const documents = new FileItem("", true, []);
    documents.name = "Documents";
    documents.key = Utils.uuidv4();
    const pepe = new FileItem("", false, []);
    pepe.name = "pepe.s";
    pepe.key = Utils.uuidv4();

    const value = JSON.stringify({
      items: [documents, pepe]
    });
    localStorage.setItem("FileSystem", value);
  }

  debugCodeRequestSocket() {
    try {
      const file = {
        content: this.testCodeRequest
      };
      this.socketProviderConnect.emitMessage("CodeRequest", JSON.stringify(file));
    } catch (error) {
      console.error(error);
    }
  }

  async updateRegisterServer(typeRegister: TypeRegister, register: string, value: string): Promise<boolean> {
    try {
      const payload = JSON.stringify([{
        typeRegister:     typeRegister,
        register:         register,
        hexadecimalValue: value
      }] as TypeRegisterToUpdate[]);
      this.socketProviderConnect.emitMessage("UpdateRegisterRequest", payload);
    } catch (error) {
      console.error(error);
      return Promise.reject(error.message);
    }
    return Promise.resolve(true);
  }

  async updateMemoryServer(memoryTypeData: TypeData, memoryAddress: TypeAddress, memoryValue: string): Promise<boolean> {
    try {
      const payload = JSON.stringify([{
        typeData: memoryTypeData,
        address:  memoryAddress,
        value:    memoryValue
      }] as TypeMemoryToUpdate[]);
      this.socketProviderConnect.emitMessage("UpdateMemoryRequest", payload);
    } catch (error) {
      console.error(error);
      return Promise.reject(error.message);
    }
    return Promise.resolve(true);
  }

  async simulationInit(): Promise<boolean> {
    try {
      const data = await fetch("assets/examples-dlx/prim.s");
      const content = await data.text();
      const payload = JSON.stringify({
        id:        this.socketProviderConnect.socketIO.ioSocket.id,
        filename:  "prim.s",
        date:      new Date().toLocaleDateString(),
        content:   content,
        registers: [],
        memory:    []
      } as TypeSimulationInitRequest);
      console.log(payload);
      this.socketProviderConnect.emitMessage("SimulationInitRequest", payload);
    } catch (error) {
      console.error(error);
      return Promise.reject(error.message);
    }
    return Promise.resolve(true);
  }

  async simulationNextStep(): Promise<boolean> {
    try {
      const payload = JSON.stringify({
        step: this.i++
      });
      this.socketProviderConnect.emitMessage("SimulationNextStepRequest", payload);
    } catch (error) {
      console.error(error);
      return Promise.reject(error.message);
    }
    return Promise.resolve(true);
  }

  async debugUpdateConfigRequestSocket(): Promise<void> {
    try {
      const payload = JSON.stringify(
        {
          addition:       {
            count: 1,
            delay: 2
          },
          multiplication: {
            count: 1,
            delay: 5
          },
          division:       {
            count: 1,
            delay: 19
          },
          memorySize:     32768
        } as TypeConfigurationMachine
      );
      this.socketProviderConnect.emitMessage("UpdateConfigurationMachineRequest", payload);
    } catch (error) {
      console.error(error);
      return Promise.reject(error.message);
    }
    return Promise.resolve();
  }

  async getAllRegisters(): Promise<void> {
    try {
      const payload = JSON.stringify(
        {
          id: this.socketProviderConnect.socketIO.ioSocket.id
        }
      );
      this.socketProviderConnect.emitMessage("GetAllRegistersRequest", payload);
    } catch (error) {
      console.error(error);
      return Promise.reject(error.message);
    }
    return Promise.resolve();
  }

  async getAllMemory(): Promise<void> {
    try {
      const payload = JSON.stringify({
        id: this.socketProviderConnect.socketIO.ioSocket.id
      });
      this.socketProviderConnect.socketIO.emit("GetAllMemoryRequest", payload, (response) => {
        console.log("callback memory", response);
      });
    } catch (error) {
      console.error(error);
      return Promise.reject(error.message);
    }
    return Promise.resolve();
  }

  async getSomethingFromRemoteP(): Promise<void> {
    return Promise.resolve();
  }

  tr(value: string): TypeRegister {
    return value as TypeRegister;
  }
}
