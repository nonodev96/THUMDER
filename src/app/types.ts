import { TypeCycleType } from "./__core/machine/PixiTHUMDER_CycleClockDiagram";
import { InterfaceMemory, InterfaceRegisters, InterfaceBreakpoints } from "./__core/DLX/interfaces";
import { ManagerBreakpoints } from "./__core/DLX/ManagerBreakpoints";
import firebase from "firebase/app";
import Timestamp = firebase.firestore.Timestamp;

declare global {
  interface Window {
    process: any;
    require: any;
    jQuery: any;
    $: any;
  }
}

export type TypeComponentStatus = "OnInit" | "AfterViewInit" | "OnDestroy";

export type TypeOnKeyEvent = {
  domEvent: KeyboardEvent;
  key: string;
};

export type TypeExtrasIDE = {
  interfaceFileItem: InterfaceFileItem;
};

export interface InterfaceUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  emailVerified: boolean;
}

export interface InterfaceFileItem {
  $key?: string // ---? Firebase
  f_id: string //-
  e1_uid: string //-

  key: string //-
  pathKeys: string[] //-

  path: string
  name: string
  content: string
  description: string
  dateModified: Timestamp
  size: number
  isDirectory: boolean
  hasSubDirectories: boolean
  thumbnail: string
  dataItem: any
}


export type StringOfLength<Min, Max> = string & {
  readonly StringOfLength: unique symbol // this is the phantom type
};

// This is a type guard function which can be used to assert that a string
// is of type StringOfLength<Min,Max>
function isStringOfLength<Min extends number, Max extends number>(str: string, min: Min, max: Max): str is StringOfLength<Min, Max> {
  return str.length >= min && str.length <= max;
}

// type constructor function
export function stringOfLength<Min extends number, Max extends number>(input: unknown, min: Min, max: Max): StringOfLength<Min, Max> {
  if (typeof input !== "string") {
    throw new Error("invalid input");
  }

  if (!isStringOfLength(input, min, max)) {
    throw new Error("input is not between specified min and max");
  }

  return input;
}

export type TypeTransformDecimalToBase = {
  base: number;
  maxLength?: number;
  fillString?: string
};

export type TypeTags = {
  line: number;
  content: string
}[];

export type PublicRoutes = {
  lang: string;
  path: string;
  routerLink: string;
  displayName: string;
  data?: any;
  children?: PublicRoutes[];
};

export type PublicRoutesList = PublicRoutes[];

export type TypeData = "Byte" | "HalfWord" | "Word" | "Float" | "Double" | "ASCII";

export type TypeRegister = "Control" | "Integer" | "Float" | "Double";

export type TypeDataRegister = {
  Control: {
    registers: number;
    size: number;
    maxLengthHexadecimal: number;
  };
  Integer: {
    registers: number;
    size: number;
    maxLengthHexadecimal: number;
  };
  Float: {
    registers: number;
    size: number;
    maxLengthHexadecimal: number;
  };
  Double: {
    registers: number;
    size: number;
    maxLengthHexadecimal: number;
  };
  DEFAULT: {
    registers: number;
    size: number;
    maxLengthHexadecimal: number;
  }
};

export type TypeRegisterToEdit =
  "PC"
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
  text: string;
  address: string;
  instruction: string;  // 0x00000000
  code: string;         // 0x00000000
  stage?: TypeStage;
  index?: number;
};

export type TypeCode = {
  text: string;
  address: string;      // 0x00000000
  instruction: string;
  code: string;         // 0x00000000
};

export type TypeMultiviewConfiguration = {
  calculator: boolean;
  pipeline: boolean;
  cycle_clock: boolean;
  memory: boolean;
  registers: boolean;
  code: boolean;
  statistics: boolean;
};
export type TypeFloatingPointStageConfiguration = {
  addition: {
    count: number;
    delay: number;
  };
  multiplication: {
    count: number;
    delay: number;
  };
  division: {
    count: number;
    delay: number;
  }
};

export type TypeLang = 'en' | 'sp';

export type TypeStatusPipeline = {
  address: string;
  stage: TypeStage;
  unit?: number;
};

export type TypeStatusCycleClockDiagram = {
  step: number;
  instruction: string;
  cycle: TypeCycleType;
  stepsToWait: number;
};

// DEBUG
export type TypeStatusMachine = {
  registers: InterfaceRegisters;
  memory: InterfaceMemory;
  breakpoints: InterfaceBreakpoints;
  [data: string]: any; // any to any
};

export type TypePipeline = {
  // Address
  IF: string;
  ID: string;
  intEX: string;
  faddEX: { unit: number; address: string }[];
  fmultEX: { unit: number; address: string }[];
  fdivEX: { unit: number; address: string }[];
  MEM: string;
  WB: string;
};

export type TypeRegisterToUpdate = {
  typeRegister: TypeRegister;
  register: string;
  value: string;
};

export type TypeMemoryToUpdate = {
  typeData: TypeData;
  address: string;
  value: string;
};

export type TypeStepSimulation = {
  step: number;
  instruction: string;
  codeInstruction: string;
  line: number;
  isComplete?: boolean;
  stage: TypeStage;

  IF: number;
  IF_stall: number;
  ID: number;
  ID_stall: number;
  intEX: number;
  intEX_stall: number;
  MEM: number;
  MEM_stall: number;
  WB: number;
  WB_stall: number;

  pipeline: TypePipeline;
  registers: TypeRegisterToUpdate[];
  memory: TypeMemoryToUpdate[];
};

export type SimulationResponse = {
  filename: string;
  id: string;
  date: string;
  steps: number;
  lines: number;

  code: TypeTableCode[];
  runner: TypeStepSimulation[];
};

export type SimulationRequest = {
  filename: string;
  id: string;
  date: string;
  content: string;

  registers: TypeRegisterToUpdate[];
  memory: TypeMemoryToUpdate[];
};


export type TypeDataStatistics = {
  TOTAL: {
    CYCLES_EXECUTED: { cycles: number };
    ID_EXECUTED: { instructions: number };
    INSTRUCTIONS_IN_PIPELINE: { instructions_in_pipeline: number };
  };
  HARDWARE: {
    MEMORY_SIZE: { size: number };
    FADD_EX_STAGES: { num: number; cycles: number };
    FMULT_EX_STAGES: { num: number; cycles: number };
    FDIV_EX_STAGES: { num: number; cycles: number };
    FORWARDING: { enabled: boolean };
  };
  STALLS: {
    RAW_STALLS: { num: number; per: number };
    LD_STALLS: { num: number; per: number };
    BRANCH_STALLS: { num: number; per: number };
    FLOATING_POINT_STALLS: { num: number; per: number };
    WAW_STALLS: { num: number; per: number };
    STRUCTURAL_STALLS: { num: number; per: number };
    CONTROL_STALLS: { num: number; per: number };
    TRAP_STALLS: { num: number; per: number };
    TOTAL: { num: number; per: number };
  };
  CONDITIONAL: {
    TOTAL: { num: number; per: number };
    TAKEN: { num: number; per: number };
    NOT_TAKEN: { num: number; per: number };
  };
  LOAD_STORE: {
    TOTAL: { num: number; per: number };
    LOADS: { num: number; per: number };
    STORES: { num: number; per: number };
  };
  FLOATING: {
    TOTAL: { num: number; per: number };
    ADDITIONS: { num: number; per: number };
    MULTIPLICATIONS: { num: number; per: number };
    DIVISIONS: { num: number; per: number };
  };
  TRAPS: {
    TOTAL: { num: number; per: number };
  }
};
