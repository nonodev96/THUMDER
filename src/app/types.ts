declare global {
  interface Window {
    process: any;
    require: any;
    jQuery: any;
    $: any;
  }
}

export type PublicRoutes = {
  lang: string,
  path: string,
  routerLink: string,
  displayName: string,
  data?: any;
  children?: PublicRoutes[],
};

export type PublicRoutesList = PublicRoutes[];


export type StepSimulation = {
  step: number,
  instruction: string,
  steps: number,
  stage: 'IF' | 'ID' | 'intEX' | 'faddEX' | 'fmultEX' | 'fdivEX' | 'MEM' | 'WB' | 'other';

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
    IF: string,
    ID: string,
    intEX: string,
    faddEX: string,
    fmultEX: string,
    fdivEX: string,
    MEM: string,
    WB: string,
  },

  registers: {
    register: string,
    value: number,
  }[],

  memory: {
    address: string,
    value: number,
  }[]
};

export type SimulationResponse = {
  name_file: string,
  date: string,
  steps: number,

  runner: StepSimulation[]
}
