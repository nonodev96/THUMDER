import { Component, OnInit } from '@angular/core';
import { ToastrService } from "ngx-toastr";
import { Utils } from "../../Utils";
import { FileItem } from "../../__core/services/file-system-nonodev96/file-system.service";
import { SocketProviderConnectService } from "../../__core/services/socket-provider-connect.service";

import { DEFAULT_CONFIG_TOAST } from "../../CONSTAST";
import { TypeCode } from "../../types";

@Component({
  selector: 'app-debug',
  templateUrl: './debug-view.html',
  styleUrls: ['./debug-view.scss']
})
export class DebugView implements OnInit {

  public socketID: string = "";
  public testRequest: string = [
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

  public testResponse: TypeCode[] = [];

  constructor(private toast: ToastrService,
              private socketProviderConnect: SocketProviderConnectService) {
    console.log("ioSocket: ", this.socketProviderConnect.socket.ioSocket);
  }

  ngOnInit(): void {
    this.socketProviderConnect.socket.ioSocket.on("CodeResponse", (response) => {
      const code = JSON.parse(response) as TypeCode[];
      this.testResponse = code.map((v) => {
        return {
          address: v.address,
          code: v.code,
          text: v.text,
          instruction: v.instruction
        };
      });
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

  debugSocket() {
    console.log(this.socketProviderConnect.socket.ioSocket);
    this.socketID = this.socketProviderConnect.socket.ioSocket.id;
    const file = {
      content: this.testRequest
    };
    this.socketProviderConnect.socket.emit("CodeRequest", JSON.stringify(file));
  }

  debugLanguage() {
  }

  async getSomethingFromRemoteP(): Promise<void> {
    return Promise.resolve();
  }
}
