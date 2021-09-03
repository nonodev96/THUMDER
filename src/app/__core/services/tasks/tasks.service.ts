import { Injectable } from '@angular/core';
import { ACLMessage, AID, CoreAgentsClient, CreateFile, Ontology, Performative } from "thumder-ontology";
import { Task_CreateFile_RequestInitiator } from "../../../_tasks/Task_CreateFile_RequestInitiator";
import { Socket } from "ngx-socket-io";

@Injectable({
  providedIn: 'root'
})
export class TasksService {

  private coreAgents;

  constructor(private socket: Socket) {
    this.coreAgents = new CoreAgentsClient(<any>this.socket);

    this.socket.on('connect', (args) => {
      console.log(this.socket.ioSocket.id)

      this.socket.on('messages', (message) => {
        console.log(message)
      });

      this.socket.on(this.socket.ioSocket.id, (privateMessage) => {
        console.log("private: ", privateMessage)
      });

    });
  }

  public createNewFile() {
    const createFile = new CreateFile('path/to/folder', 'tests/', 'example_00.s');
    const createFile_string = JSON.stringify(createFile);
    const message = new ACLMessage();
    message.setSender(new AID({
      name: "Client",
      localName: "Client-" + this.coreAgents.id,
      address: this.coreAgents.id
    }));
    message.setPerformative(Performative.REQUEST);
    message.setOntology(new Ontology("Make-File"));
    message.setContent(createFile_string);
    this.coreAgents.addTask(new Task_CreateFile_RequestInitiator("Make-File", message));
  }
}
