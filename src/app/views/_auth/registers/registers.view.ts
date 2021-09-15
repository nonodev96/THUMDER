import {Component, OnInit} from '@angular/core';
import {MachineService} from "../../../__core/machine/machine.service";
import { Int32 } from 'app/__core/interfaces';

@Component({
  selector: 'app-registers',
  templateUrl: './registers.view.html',
  styleUrls: []
})
export class RegistersView implements OnInit {

  list_first_registers = [
    "PC",
    "IMAR",
    "IR",
    "A",
    "AHI",
    "B",
    "BHI",
    "BTA",
    "ALU",
    "ALUHI",
    "FPSR",
    "DMAR",
    "SDR",
    "SDRHI",
    "LDR",
    "LDRHI"
  ]

  constructor(public machine: MachineService) {
    machine.registers.R[12] = new Int32()
    machine.registers.R[12].value = 12002
  }

  ngOnInit(): void {
  }

}
