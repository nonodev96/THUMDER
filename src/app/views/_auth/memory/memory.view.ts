import {Component, OnInit} from '@angular/core';
import {MachineService} from "../../../__core/machine/machine.service";

@Component({
  selector: 'app-memory',
  templateUrl: './memory.view.html',
  styleUrls: []
})
export class MemoryView implements OnInit {

  constructor(public machine: MachineService) {
  }

  ngOnInit(): void {
    this.machine.registers.R[1].value = -2147483646
  }

  change() {
    this.machine.registers.R[1].value--;
  }

}
