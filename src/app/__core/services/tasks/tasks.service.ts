import { Injectable, OnDestroy } from "@angular/core";
import {
  ACLMessage,
  AID,
  CoreAgentsClient,
  CreateFile, CreateFolder,
  ModifyFile, ModifyFolder,
  EditFile,
  Ontology,
  Performative
} from "thumder-ontology";
import { TaskContainer } from "thumder-ontology/dist/Utils/Types";
import {
  Task_CreateFolder_RequestInitiator,
  Task_CreateFile_RequestInitiator,
  Task_ModifyFile_RequestInitiator, Task_ModifyFolder_RequestInitiator, Task_EditFile_RequestInitiator
} from "../../../_tasks/Tasks";
import { SocketProviderConnectService } from "../socket-provider-connect.service";
import { Subscription } from "rxjs";
import { Socket } from "socket.io";

@Injectable({
  providedIn: "root"
})
export class TasksService implements OnDestroy {

  private coreAgentsClient: CoreAgentsClient;
  private subscription = new Subscription();
  private sender: AID;

  constructor(private socketProviderConnectService: SocketProviderConnectService) {
    this.subscription = this.socketProviderConnectService.connectObservable.subscribe((statusWebsocket) => {
      console.log("socketProviderConnectService connect ", statusWebsocket);
      if (statusWebsocket === "Disconnect") return;
      this.coreAgentsClient = new CoreAgentsClient(this.socketProviderConnectService.socket.ioSocket as Socket);
      this.sender = new AID({
        name: "Client",
        localName: "Client-" + this.coreAgentsClient.clientID,
        address: this.coreAgentsClient.clientID
      });
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  debug() {
    console.log("ioSocket: ", this.socketProviderConnectService.socket.ioSocket);
    console.log("coreAgentsClient: ", this.coreAgentsClient);
  }

  /**
   * TODO tests
   *
   * @param path
   * @param key
   * @param newFile
   */
  async createNewFile(path: string, key: string, newFile: string = "example_00.s"): Promise<TaskContainer> {
    const createFile = new CreateFile(path, key, newFile);
    const createFile_string = JSON.stringify(createFile);

    const message = new ACLMessage();
    message.setSender(this.sender);
    message.setPerformative(Performative.REQUEST);
    message.setOntology(new Ontology("Create-File"));
    message.setAction("CreateFile");
    message.setContent(createFile_string);

    const taskContainer = await this.coreAgentsClient.addTask(
      new Task_CreateFile_RequestInitiator("Create-File", message)
    );
    if (taskContainer.status === "ok") {
      return Promise.resolve(taskContainer);
    } else {
      return Promise.reject(taskContainer);
    }
  }

  /**
   * TODO tests
   *
   * @param path
   * @param key
   * @param newFolder
   */
  async createNewFolder(path: string, key: string, newFolder: string = "example_folder"): Promise<TaskContainer> {
    const createFolder = new CreateFolder(path, key, newFolder);
    const createFolder_string = JSON.stringify(createFolder);

    const message = new ACLMessage();
    message.setSender(this.sender);
    message.setPerformative(Performative.REQUEST);
    message.setOntology(new Ontology("Create-Folder"));
    message.setAction("CreateFolder");
    message.setContent(createFolder_string);

    const taskContainer = await this.coreAgentsClient.addTask(
      new Task_CreateFolder_RequestInitiator("Create-Folder", message)
    );
    if (taskContainer.status === "ok") {
      return Promise.resolve(taskContainer);
    } else {
      return Promise.reject(taskContainer);
    }
  }

  /**
   * TODO tests
   *
   * @param path
   * @param key ==> FileSystemItem.key
   * @param newName
   */
  async modifyFile(path: string, key: string, newName: string): Promise<TaskContainer> {
    const modifyFile = new ModifyFile(path, key, newName);
    const modifyFile_string = JSON.stringify(modifyFile);

    const message = new ACLMessage();
    message.setSender(this.sender);
    message.setPerformative(Performative.REQUEST);
    message.setOntology(new Ontology("Modify-File"));
    message.setAction("ModifyFile");
    message.setContent(modifyFile_string);

    const taskContainer = await this.coreAgentsClient.addTask(
      new Task_ModifyFile_RequestInitiator("Modify-File", message)
    );
    if (taskContainer.status === "ok") {
      return Promise.resolve(taskContainer);
    } else {
      return Promise.reject(taskContainer);
    }

  }

  /**
   * TODO tests
   *
   * @param path
   * @param key ==> FileSystemItem.key
   * @param newName
   */
  async modifyFolder(path: string, key: string, newName: string): Promise<TaskContainer> {
    const modifyFolder = new ModifyFolder(path, key, newName);
    const modifyFolder_string = JSON.stringify(modifyFolder);

    const message = new ACLMessage();
    message.setSender(this.sender);
    message.setPerformative(Performative.REQUEST);
    message.setOntology(new Ontology("Modify-Folder"));
    message.setAction("ModifyFolder");
    message.setContent(modifyFolder_string);

    const taskContainer = await this.coreAgentsClient.addTask(
      new Task_ModifyFolder_RequestInitiator("Modify-Folder", message)
    );
    if (taskContainer.status === "ok") {
      return Promise.resolve(taskContainer);
    } else {
      return Promise.reject(taskContainer);
    }
  }

  /**
   * TODO tests
   *
   * @param path
   * @param key ==> FileSystemItem.key
   * @param newContent
   */
  async editFile(path: string, key: string, newContent: string[]): Promise<TaskContainer> {
    const editFile = new EditFile(path, key, newContent);
    const editFile_string = JSON.stringify(editFile);

    const message = new ACLMessage();
    message.setSender(this.sender);
    message.setPerformative(Performative.REQUEST);
    message.setOntology(new Ontology("Edit-File"));
    message.setAction("EditFile");
    message.setContent(editFile_string);

    const taskContainer = await this.coreAgentsClient.addTask(
      new Task_EditFile_RequestInitiator("Edit-File", message)
    );
    if (taskContainer.status === "ok") {
      return Promise.resolve(taskContainer);
    } else {
      return Promise.reject(taskContainer);
    }
  }
}
