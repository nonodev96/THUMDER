import { Component, OnInit } from '@angular/core';
import { ToastrService } from "ngx-toastr";
import { Utils } from "../../Utils";
import { FileItem } from "../../__core/services/file-system-nonodev96/file-system.service";

import { SocketProviderConnectService } from "../../__core/services/socket-provider-connect.service";
import { DEFAULT_CONFIG_TOAST } from "../../CONSTAST";
import { TypeCode, TypeData, TypeMemoryToUpdate, TypeRegister } from "../../types";

@Component({
  selector: 'app-debug',
  templateUrl: './debug-view.html',
  styleUrls: ['./debug-view.scss']
})
export class DebugView implements OnInit {

  public socketID: string = "";
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

  public testCodeResponse: TypeCode[] = [];

  constructor(private toast: ToastrService,
              public socketProviderConnect: SocketProviderConnectService) {
    console.log("ioSocket: ", this.socketProviderConnect.socket.ioSocket);
  }

  ngOnInit(): void {
    this.socketProviderConnect.socket.on("CodeResponse", (response) => {
      const code = JSON.parse(response) as TypeCode[];
      this.testCodeResponse = code.map((v) => {
        return {
          address: v.address,
          code: v.code,
          text: v.text,
          instruction: v.instruction
        };
      });
    });

    this.socketProviderConnect.socket.on("UpdateRegisterResponse", (response) => {
      const registers = JSON.parse(response) as TypeMemoryToUpdate[];
      console.log("Registers", registers);
    });

    this.socketProviderConnect.socket.on("UpdateMemoryResponse", (response) => {
      const memory = JSON.parse(response) as TypeMemoryToUpdate[];
      console.log("Memory", memory);
    });
  }

  showToast() {
    this.toast.success('Hello world!', 'Toast fun!', DEFAULT_CONFIG_TOAST);
  }

  debugLocalStorage() {
    console.log(localStorage.getItem('FileSystem'));

    const documents = new FileItem('', true, []);
    documents.name = 'Documents';
    documents.key = Utils.uuidv4();
    const pepe = new FileItem('', false, []);
    pepe.name = 'pepe.s';
    pepe.key = Utils.uuidv4();

    const value = JSON.stringify({
      items: [documents, pepe]
    });
    localStorage.setItem('FileSystem', value);
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
      const payload = JSON.stringify({
        typeRegister: typeRegister,
        register: register,
        value: value
      });
      this.socketProviderConnect.emitMessage('UpdateRegisterRequest', payload);
    } catch (error) {
      console.error(error);
      return Promise.reject(error.message);
    }
    return Promise.resolve(true);
  }

  async updateMemoryServer(typeData: TypeData, address: string, value: string): Promise<boolean> {
    try {
      const payload = JSON.stringify({
        typeData: typeData,
        address: address,
        value: value
      });
      this.socketProviderConnect.emitMessage('UpdateMemoryRequest', payload);
    } catch (error) {
      console.error(error);
      return Promise.reject(error.message);
    }
    return Promise.resolve(true);
  }

  async nextStep(): Promise<boolean> {
    try {
      const payload = JSON.stringify({});
      this.socketProviderConnect.emitMessage('UpdateMemoryRequest', payload);
    } catch (error) {
      console.error(error);
      return Promise.reject(error.message);
    }
    return Promise.resolve(true);
  }

  async getSomethingFromRemoteP(): Promise<void> {
    return Promise.resolve();
  }

  tr(value: string): TypeRegister {
    return value as TypeRegister;
  }
}
