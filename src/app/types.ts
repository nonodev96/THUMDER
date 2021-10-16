declare global {
  interface Window {
    process: any;
    require: any;
    jQuery: any;
    $: any;
  }
}

export type TypeTransformDecimalToBase = {
  base: number,
  maxLength?: number,
  fillString?: string
};

export type PublicRoutes = {
  lang: string,
  path: string,
  routerLink: string,
  displayName: string,
  data?: any;
  children?: PublicRoutes[],
};

export type PublicRoutesList = PublicRoutes[];

export type TypeData = "byte" | "h-word" | "word" | "s-f-point" | "d-f-point" | "ascii";

export type TypeStage =
  ""
  | "IF"
  | "ID"
  | "intEX"
  | "MEM"
  | "WB"
  | "trap"
  | "other"
  | "faddEX_1" | "fmultEX_1" | "fdivEX_1"
  | "faddEX_2" | "fmultEX_2" | "fdivEX_2"
  | "faddEX_3" | "fmultEX_3" | "fdivEX_3"
  | "faddEX_4" | "fmultEX_4" | "fdivEX_4"
  | "faddEX_5" | "fmultEX_5" | "fdivEX_5"
  | "faddEX_6" | "fmultEX_6" | "fdivEX_6"
  | "faddEX_7" | "fmultEX_7" | "fdivEX_7"
  | "faddEX_8" | "fmultEX_8" | "fdivEX_8";

export type TypeTableCode = {
  text: string,
  address: string,
  instruction: string
  stage: TypeStage
  binary?: string,
}

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
