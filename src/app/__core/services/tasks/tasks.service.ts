import { Injectable } from '@angular/core';
import { ACLMessage, AID, CoreAgentsClient, CreateFile, CreateFolder, Ontology, Performative } from "thumder-ontology";
import { TaskContainer } from "thumder-ontology/dist/Utils/Types";
import {
  Task_CreateFolder_RequestInitiator,
  Task_CreateFile_RequestInitiator
} from "../../../_tasks/Tasks";
import { SocketProviderConnectService } from "../socket-provider-connect.service";

@Injectable({
  providedIn: 'root'
})
export class TasksService {

  private coreAgentsClient: CoreAgentsClient;

  constructor(private socketProviderConnectService: SocketProviderConnectService) {
    this.socketProviderConnectService.connectObservable.subscribe((connect) => {
      console.log('tarda mucho', connect)
      this.coreAgentsClient = new CoreAgentsClient(<any>this.socketProviderConnectService.socket.ioSocket);
    })
  }

  debug() {
    console.log("ioSocket: ", this.socketProviderConnectService.socket.ioSocket)
    console.log("coreAgentsClient: ", this.coreAgentsClient)
  }

  createNewFile(path: string = 'path/to/folder',
                folderName: string = 'tests/',
                newFile: string = 'example_00.s'): Promise<TaskContainer> {
    return new Promise(async (resolve) => {
      const createFile = new CreateFile(path, folderName, newFile);
      const createFile_string = JSON.stringify(createFile);
      const message = new ACLMessage();
      message.setSender(new AID({
        name: "Client",
        localName: "Client-" + this.coreAgentsClient.clientID,
        address: this.coreAgentsClient.clientID
      }));
      message.setPerformative(Performative.REQUEST);
      message.setOntology(new Ontology("Create-File"));
      message.setContent(createFile_string);

      const taskContainer = await this.coreAgentsClient.addTask(
        new Task_CreateFile_RequestInitiator("Create-File", message)
      );

      resolve(taskContainer)
    })
  }

  createNewFolder(path: string = 'path/to/folder',
                  folderName: string = 'tests/',
                  newFolder: string = 'example_folder'): Promise<TaskContainer> {
    return new Promise(async (resolve) => {
      const createFolder = new CreateFolder(path, folderName, newFolder);
      const createFolder_string = JSON.stringify(createFolder);
      const message = new ACLMessage();
      message.setSender(new AID({
        name: "Client",
        localName: "Client-" + this.coreAgentsClient.clientID,
        address: this.coreAgentsClient.clientID
      }));
      message.setPerformative(Performative.REQUEST);
      message.setOntology(new Ontology("Create-Folder"));
      message.setContent(createFolder_string);

      const taskContainer = await this.coreAgentsClient.addTask(
        new Task_CreateFolder_RequestInitiator("Create-Folder", message)
      );

      resolve(taskContainer)
    })
  }

}
