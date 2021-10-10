import { AchieveREInitiator, ACLMessage } from "thumder-ontology";

export class Task_CreateFile_RequestInitiator extends AchieveREInitiator {
  constructor(taskName: string, message: ACLMessage) {
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

export class Task_CreateFolder_RequestInitiator extends AchieveREInitiator {
  constructor(taskName: string, message: ACLMessage) {
    super(taskName, message)
    console.log("Task_CreateFolder_RequestInitiator")
  }

  handleAgree(agree: ACLMessage): null {
    console.log("Task_CreateFolder_RequestInitiator handleAgree")
    return null
  }

  handleRefuse(refuse: ACLMessage): null {
    console.log("Task_CreateFolder_RequestInitiator handleRefuse")
    return null
  }

  handleInform(inform: ACLMessage): null {
    console.log("Task_CreateFolder_RequestInitiator handleInform")
    return null
  }
}

export class Task_ModifyFile_RequestInitiator extends AchieveREInitiator {
  constructor(taskName: string, message: ACLMessage) {
    super(taskName, message)
    console.log("Task_ModifyFile_RequestInitiator")
  }

  handleAgree(agree: ACLMessage): null {
    console.log("Task_ModifyFile_RequestInitiator handleAgree")
    return null
  }

  handleRefuse(refuse: ACLMessage): null {
    console.log("Task_ModifyFile_RequestInitiator handleRefuse")
    return null
  }

  handleInform(inform: ACLMessage): null {
    console.log("Task_ModifyFile_RequestInitiator handleInform")
    return null
  }
}

export class Task_ModifyFolder_RequestInitiator extends AchieveREInitiator {
  constructor(taskName: string, message: ACLMessage) {
    super(taskName, message)
    console.log("Task_ModifyFolder_RequestInitiator")
  }

  handleAgree(agree: ACLMessage): null {
    console.log("Task_ModifyFolder_RequestInitiator handleAgree")
    return null
  }

  handleRefuse(refuse: ACLMessage): null {
    console.log("Task_ModifyFolder_RequestInitiator handleRefuse")
    return null
  }

  handleInform(inform: ACLMessage): null {
    console.log("Task_ModifyFolder_RequestInitiator handleInform")
    return null
  }
}

export class Task_EditFile_RequestInitiator extends AchieveREInitiator {
  constructor(taskName: string, message: ACLMessage) {
    super(taskName, message)
    console.log("Task_EditFile_RequestInitiator")
  }

  handleAgree(agree: ACLMessage): null {
    console.log("Task_EditFile_RequestInitiator handleAgree")
    return null
  }

  handleRefuse(refuse: ACLMessage): null {
    console.log("Task_EditFile_RequestInitiator handleRefuse")
    return null
  }

  handleInform(inform: ACLMessage): null {
    console.log("Task_EditFile_RequestInitiator handleInform")
    return null
  }
}
