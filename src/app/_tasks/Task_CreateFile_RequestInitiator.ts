import { AchieveREInitiator, ACLMessage } from "thumder-ontology";

export class Task_CreateFile_RequestInitiator extends AchieveREInitiator {
  constructor(taskName: string, message: ACLMessage) {
    console.log('init')
    super(taskName, message)
    console.log("Task_CreateFile_RequestInitiator")
  }

  handleAgree(agree: ACLMessage): null {
    console.log("Task_CreateFile_RequestInitiator handleAgree")
    return null
  }

  handleRefuse(refuse: ACLMessage): null {
    console.log("Task_CreateFile_RequestInitiator handleRefuse")
    return null
  }

  handleInform(inform: ACLMessage): null {
    console.log("Task_CreateFile_RequestInitiator handleInform")
    return null
  }
}
