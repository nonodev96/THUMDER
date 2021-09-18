import { Injectable } from '@angular/core';
import { Double64, Float32, Int32 } from "../interfaces";
import { PixiTHUMER_Pipeline } from "../../components/pixi-pipeline/PixiTHUMER_Pipeline";
import { PixiTHUMDER_CycleClockDiagram } from "../../components/pixi-cycle-clock-diagram/PixiTHUMDER_CycleClockDiagram";


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
  R: Int32[];
  F: Float32[];
  D: Double64[];

  // $TEXT+0x00 - $TEXT+0xfc
  // 0x00000200 - 0x00007ffc
  // code = Array<Int32>(32764)
  // memory = Array<Int32>(32736)
  constructor() {
    this.PC = new Int32();
    this.IMAR = new Int32();
    this.IR = new Int32();
    this.A = new Int32();
    this.AHI = new Int32();
    this.B = new Int32();
    this.BHI = new Int32();
    this.BTA = new Int32();
    this.ALU = new Int32();
    this.ALUHI = new Int32();
    this.FPSR = new Int32();
    this.DMAR = new Int32();
    this.SDR = new Int32();
    this.SDRHI = new Int32();
    this.LDR = new Int32();
    this.LDRHI = new Int32();

    this.R = Array<Int32>(32);
    this.F = Array<Float32>(32);
    this.D = Array<Double64>(16);
    for (let i = 0; i < 32; i++) {
      this.R[i] = new Int32();
      this.F[i] = new Float32();
    }
    for (let i = 0; i < 16; i++) {
      this.D[i] = new Double64();
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class MachineService {

  private static instance: MachineService
  // public memory: Map<number, number>;
  public registers: Registers = new Registers();
  public memory: Array<Int32> = Array<Int32>(32736).fill(new Int32())
  public code: Array<Int32> = Array<Int32>(32764).fill(new Int32())
  public pipeline: PixiTHUMER_Pipeline
  public cycleClockDiagram: PixiTHUMDER_CycleClockDiagram

  /**
   * The Singleton's constructor should always be private to prevent direct
   * construction calls with the `new` operator.
   */
  constructor() {
    this.pipeline = new PixiTHUMER_Pipeline()
    this.cycleClockDiagram = new PixiTHUMDER_CycleClockDiagram()
  }

  public loadConfiguration(): Promise<boolean> {
    return new Promise((resolve) => {

      this.pipeline = new PixiTHUMER_Pipeline()
      this.cycleClockDiagram = new PixiTHUMDER_CycleClockDiagram()

      resolve(true)
    })
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

  next(): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, 2000)
    })
  }

  end(): Promise<void> {
    return new Promise(resolve => {
      resolve()
    })
  }
}
