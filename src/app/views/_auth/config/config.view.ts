import { Component, OnInit } from '@angular/core';
import { MachineService } from "../../../__core/machine/machine.service";

interface EventTargetInput extends EventTarget {
  value: string | number;
}

@Component({
  selector: 'app-config',
  templateUrl: './config.view.html',
  styleUrls: ['./config.view.scss']
})
export class ConfigView implements OnInit {


  constructor(public machine: MachineService) {
  }

  ngOnInit(): void {
  }

  updateConfiguration() {

  }

  resetConfiguration() {

  }

  checkCount(target: EventTargetInput | any) {
    const count = parseInt(target.value.toString())
    if (count >= 1 && count <= 8) {
      target.value = count;
    }
    target.value = 1;
  }

  checkDelay(target: EventTargetInput | any) {
    const delay = parseInt(target.value.toString())
    if (delay >= 1 && delay <= 50) {
      target.value = delay;
    }
    target.value = 1;
  }

  checkMemorySize(target: EventTargetInput | any) {
    const size = parseInt(target.value.toString())
    if (size >= 512 && size <= 1048576) {
      target.value = size;
    }
    target.value = 1;
  }
}
