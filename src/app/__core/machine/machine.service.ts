import { Injectable } from '@angular/core';
import { Double64, Float32, Int32 } from "../interfaces";


class Registers {
  PC: Int32;
  IMAR: Int32;
  IR: Int32;
  A: Int32;
  AHI: Int32;
  B: Int32;
  BHI: Int32;
  BTA: Int32;
  ALU: Int32;
  ALUHI: Int32;
  FPSR: Int32;
  DMAR: Int32;
  SDR: Int32;
  SDRHI: Int32;
  LDR: Int32;
  LDRHI: Int32;


  R = Array<Int32>(32);
  F = Array<Float32>(32);
  D = Array<Double64>(16);

  // $TEXT+0x00 - $TEXT+0xfc
  // 0x00000200 - 0x00007ffc
  code = Array<Int32>(32764);
  memory = Array<Int32>(32736);

}

@Injectable({
  providedIn: 'root'
})
export class MachineService {

  private static instance: MachineService;
  private registers: Registers;
  private memory: WeakMap<Number, Number>;

  /**
   * The Singleton's constructor should always be private to prevent direct
   * construction calls with the `new` operator.
   */
  private constructor() {
    this.registers = new Registers()
    this.memory = new WeakMap<Number, Number>();
  }

  /**
   * The static method that controls the access to the singleton instance.
   *
   * This implementation let you subclass the Singleton class while keeping
   * just one instance of each subclass around.
   */
  public static getInstance(): MachineService {
    if (!MachineService.instance) {
      MachineService.instance = new MachineService();
    }

    return MachineService.instance;
  }

  /**
   * Finally, any singleton should define some business logic, which can be
   * executed on its instance.
   */
  public someBusinessLogic() {
    console.log(this.registers.D[17])
  }
}
