import { Registers } from "./__core/machine/machine.service";
import { Double64, Float32, Int32 } from "./__core/interfaces";
import { TypeCycleType } from "./__core/machine/PixiTHUMDER_CycleClockDiagram";

declare global {
  interface Window {
    process: any;
    require: any;
    jQuery: any;
    $: any;
  }
}

export interface InterfaceRegisters {
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
}

export interface InterfaceMemory {

}

export type TypeTransformDecimalToBase = {
  base: number,
  maxLength?: number,
  fillString?: string
};

export type TypeTags = {
  line: number,
  content: string
}[]

export type PublicRoutes = {
  lang: string,
  path: string,
  routerLink: string,
  displayName: string,
  data?: any;
  children?: PublicRoutes[],
};

export type PublicRoutesList = PublicRoutes[];

export type TypeData = "Byte" | "HalfWord" | "Word" | "Float" | "Double" | "ASCII";

export type TypeRegister = "Control" | "Integer" | "Float" | "Double";

export type TypeDataRegister = {
  Control: {
    registers: number,
    size: number,
    maxLengthHexadecimal: number,
  },
  Integer: {
    registers: number,
    size: number,
    maxLengthHexadecimal: number,
  },
  Float: {
    registers: number,
    size: number,
    maxLengthHexadecimal: number,
  },
  Double: {
    registers: number,
    size: number,
    maxLengthHexadecimal: number,
  },
  DEFAULT: {
    registers: number,
    size: number,
    maxLengthHexadecimal: number,
  }
}

export type TypeRegisterToEdit = "PC"
  | "IMAR"
  | "IR"
  | "A"
  | "AHI"
  | "B"
  | "BHI"
  | "BTA"
  | "ALU"
  | "ALUHI"
  | "FPSR"
  | "DMAR"
  | "SDR"
  | "SDRHI"
  | "LDR"
  | "LDRHI"

  | 0 | 10 | 20 | 30
  | 1 | 11 | 21 | 31
  | 2 | 12 | 22
  | 3 | 13 | 23
  | 4 | 14 | 24
  | 5 | 15 | 25
  | 6 | 16 | 26
  | 7 | 17 | 27
  | 8 | 18 | 28
  | 9 | 19 | 29;

export type TypeStage =
  ""
  | "IF"
  | "ID"
  | "intEX"
  | "MEM"
  | "WB"
  | "trap"
  | "other"
  | "faddEX_0" | "fmultEX_0" | "fdivEX_0"
  | "faddEX_1" | "fmultEX_1" | "fdivEX_1"
  | "faddEX_2" | "fmultEX_2" | "fdivEX_2"
  | "faddEX_3" | "fmultEX_3" | "fdivEX_3"
  | "faddEX_4" | "fmultEX_4" | "fdivEX_4"
  | "faddEX_5" | "fmultEX_5" | "fdivEX_5"
  | "faddEX_6" | "fmultEX_6" | "fdivEX_6"
  | "faddEX_7" | "fmultEX_7" | "fdivEX_7";

export type TypeTableCode = {
  text: string,
  address: string,
  instruction: string
  stage: TypeStage
  binary?: string,
  index?: number,
}

export type TypeFloatingPointStageConfiguration = {
  addition: {
    count: number,
    delay: number
  },
  multiplication: {
    count: number,
    delay: number
  },
  division: {
    count: number,
    delay: number
  }
}
export type TypeLang = 'en' | 'sp';

export type TypeCode = {
  text: string,
  address: string,
  instruction: string
}

export type TypeStatusPipeline = {
  address: string;
  stage: TypeStage,
  unit?: number
}

export type TypeStatusCycleClockDiagram = {
  step: number
  instruction: string;
  cycle: TypeCycleType,
  stepsToWait: number
}


export type TypeStatusMachine = {
  codeText: string,
  registers: InterfaceRegisters,
  memory: InterfaceMemory,
  tagsDebugger: TypeTags,
}

export type StepSimulation = {
  step: number,
  instruction: string,
  steps: number,
  stage: TypeStage;

  IF_stall: number,
  IF: number,
  ID_stall: number,
  ID: number,
  intEX_stall: number,
  intEX: number,
  MEM_stall: number,
  MEM: number,
  WB_stall: number,
  WB: number,

  pipeline: {
    // Address
    IF: string,
    ID: string,
    intEX: string,
    faddEX: { unit: number, address: string }[],
    fmultEX: { unit: number, address: string }[],
    fdivEX: { unit: number, address: string }[],
    MEM: string,
    WB: string,
  },

  registers: { register: string, value: string, }[],

  memory: { address: string, value: string, }[]
};

export type SimulationResponse = {
  name_file: string,
  date: string,
  steps: number,

  code: TypeTableCode[],

  runner: StepSimulation[]
}
