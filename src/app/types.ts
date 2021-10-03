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
  pipeline: string,
  instruction: string,

  stage: 'IF' | 'ID' | 'intEX' | 'faddEX' | 'fmultEX' | 'fdivEX' | 'MEM' | 'WB'| 'other';
  IF: number,
  IF_stall: number,
  ID: number,
  ID_stall: number,
  intEX: number,
  intEX_stall: number,
  MEM: number,
  MEM_stall: number,
  WB: number,
  WB_stall: number,

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
