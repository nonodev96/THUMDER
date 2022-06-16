import { InterfaceRegisters } from "./__core/DLX/interfaces";

declare global {
  interface Window {
    process: any;
    require: any;
    jQuery: any;
    $: any;
  }
}

export enum EnumLogLevel {
  All = 0,
  Debug = 1,
  Info = 2,
  Warn = 3,
  Error = 4,
  Fatal = 5,
  Off = 6
}

export enum EnumSeverity {
  Hint = 1,
  Info = 2,
  Warning = 4,
  Error = 8
}

export type TypeLogger = {
  index: number;
  value: any;
};

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
  $key: string; // ---? Firebase
  f_id: string; //-
  e1_uid: string; //-
  key: string; //-
  pathKeys: string[]; //-
  path: string;
  name: string;
  content: string;
  description: string;
  dateModified: Date;
  size: number;
  isDirectory: boolean;
  hasSubDirectories: boolean;
  thumbnail: string;
  dataItem: any;
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

export type TypeBreakpoints = {
  [line: number]: boolean
};

export type PublicRoutes_SET = {
  [name: string]: {
    lang: string;
    path: string;
    routerLink: string;
    displayName: string;
    data?: any;
    icon?: string;
    children?: PublicRoutes[];
  }
};

export type PublicRoutes = {
  lang: string;
  path: string;
  routerLink: string;
  displayName: string;
  data?: any;
  icon?: string;
  children?: PublicRoutes[];
};

export type TypeMemory = {
  address: string;
  value: number;
};

export type PublicRoutesList = PublicRoutes_SET;

export type TypeLine = number;

export type TypeAddress = `0x${string}`;

export type TypeAddressStage = {
  address: TypeAddress,
  stage: TypeStage
}

export type TypeData = "Byte" | "HalfWord" | "Word" | "Float" | "Double" | "ASCII";

export type TypeRegister = "Control" | "Integer" | "Float" | "Double";

export type TypePipelineStage = "IF" | "ID" | "intEX" | "MEM" | "WB" | "faddEX" | "fmultEX" | "fdivEX";

export type TypeStall = "Aborted" | "R-Stall" | "T-Stall" | "W-Stall" | "S-Stall" | "Stall";

export type TypeDataDisplayColumn = TypeData | "InstructionCode" | "Address-0-1-2-3" | "HalfWord-0-1"

export type TypeDataRepresentation = "Binary" | "Uint8Array";

export type TypeDirective =
  "GLOBAL"
  | "TEXT"
  | "SPACE"
  | "DATA"
  | "ALIGN"
  | "ASCII"
  | "ASCIIZ"
  | "BYTE"
  | "FLOAT"
  | "DOUBLE"
  | "WORD";

export type TypeIdTitleFile = {
  id: string,
  title: string,
  file: string
}

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

export type TypeRegisterControl =
  | "PC"
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
  | "LDRHI";

export type uint8 =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30
  | 31
  | 32
  | 33
  | 34
  | 35
  | 36
  | 37
  | 38
  | 39
  | 40
  | 41
  | 42
  | 43
  | 44
  | 45
  | 46
  | 47
  | 48
  | 49
  | 50
  | 51
  | 52
  | 53
  | 54
  | 55
  | 56
  | 57
  | 58
  | 59
  | 60
  | 61
  | 62
  | 63
  | 64
  | 65
  | 66
  | 67
  | 68
  | 69
  | 70
  | 71
  | 72
  | 73
  | 74
  | 75
  | 76
  | 77
  | 78
  | 79
  | 80
  | 81
  | 82
  | 83
  | 84
  | 85
  | 86
  | 87
  | 88
  | 89
  | 90
  | 91
  | 92
  | 93
  | 94
  | 95
  | 96
  | 97
  | 98
  | 99
  | 100
  | 101
  | 102
  | 103
  | 104
  | 105
  | 106
  | 107
  | 108
  | 109
  | 110
  | 111
  | 112
  | 113
  | 114
  | 115
  | 116
  | 117
  | 118
  | 119
  | 120
  | 121
  | 122
  | 123
  | 124
  | 125
  | 126
  | 127
  | 128
  | 129
  | 130
  | 131
  | 132
  | 133
  | 134
  | 135
  | 136
  | 137
  | 138
  | 139
  | 140
  | 141
  | 142
  | 143
  | 144
  | 145
  | 146
  | 147
  | 148
  | 149
  | 150
  | 151
  | 152
  | 153
  | 154
  | 155
  | 156
  | 157
  | 158
  | 159
  | 160
  | 161
  | 162
  | 163
  | 164
  | 165
  | 166
  | 167
  | 168
  | 169
  | 170
  | 171
  | 172
  | 173
  | 174
  | 175
  | 176
  | 177
  | 178
  | 179
  | 180
  | 181
  | 182
  | 183
  | 184
  | 185
  | 186
  | 187
  | 188
  | 189
  | 190
  | 191
  | 192
  | 193
  | 194
  | 195
  | 196
  | 197
  | 198
  | 199
  | 200
  | 201
  | 202
  | 203
  | 204
  | 205
  | 206
  | 207
  | 208
  | 209
  | 210
  | 211
  | 212
  | 213
  | 214
  | 215
  | 216
  | 217
  | 218
  | 219
  | 220
  | 221
  | 222
  | 223
  | 224
  | 225
  | 226
  | 227
  | 228
  | 229
  | 230
  | 231
  | 232
  | 233
  | 234
  | 235
  | 236
  | 237
  | 238
  | 239
  | 240
  | 241
  | 242
  | 243
  | 244
  | 245
  | 246
  | 247
  | 248
  | 249
  | 250
  | 251
  | 252
  | 253
  | 254;

export type TypeMemoryIndexValue = {
  index: number;
  value: uint8;
};

export type TypeAllMemory = TypeMemoryIndexValue[];

export type TypeAllRegisters = {
  Control: {
    register: TypeRegisterControl;
    value: string; // 0x 00000000
  }[],
  Integer: {
    register: number;
    value: string; // 0x 00000000
  }[],
  Float: {
    register: number;
    value: string; // 0x 00000000
  }[],
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
  | "faddEX" | "fmultEX" | "fdivEX"
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

export type TypeDirectiveData = {
  address: TypeAddress;      // 0x00000000
  directive: TypeDirective;
  text: string;
  hexValue: string;     // 0x00000000
};

export type TypeInstructionsData = {
  address: TypeAddress;      // 0x00000000
  text: string;
  instruction: string;
  code: string;         // 0x00000000
};

export type TypeInstructionsData_Table = TypeInstructionsData & {
  row: number;
  stage?: TypeStage;
  index?: number;
};

export type TypeMultiviewConfiguration = {
  calculator: boolean;
  pipeline: boolean;
  cycle_clock_diagram: boolean;
  memory: boolean;
  registers: boolean;
  code: boolean;
  statistics: boolean;
  list_1: string[];
  list_2: string[];
};

export type TypeEnabledForwardingConfiguration = boolean;

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

export type TypeWebSocketConfiguration = {
  socket_url: string;
};

export type TypeLang = "en" | "sp";

export type TypeConfigurationMachine = {
  addition: {
    count: number;
    delay: number;
  },
  multiplication: {
    count: number;
    delay: number;
  },
  division: {
    count: number;
    delay: number;
  },
  memorySize: number;
  enabledForwarding: TypeEnabledForwardingConfiguration;
};

// DEBUG

export type TypeStatusMachine = {
  registers: InterfaceRegisters; // TODO Debug
  memory: TypeMemory[];
  breakpoints: TypeBreakpoints;
  [data: string]: any; // any to any
};

export type TypeRegisterToUpdate = {
  typeRegister: TypeRegister;
  register: string | TypeRegisterControl | TypeRegisterToEdit;
  hexadecimalValue: string;
};

export type TypeMemoryToUpdate = {
  address: TypeAddress;
  typeData: TypeData;
  value: string;
};

export type TypeCycleCell = {
  address: TypeAddress;
  addressRow: number;
  draw: boolean | TypeStall;
};

export type TypeCycleCellUnit = TypeCycleCell & {
  unit?: number
};

export type TypePipelineToProcess = TypeCycleCellUnit & {
  stage?: TypeStage;
};

export type TypeInstructionPipelineRepresentation = {
  text: string;
  draw: boolean | TypeStall;
}

export type TypeInstructionPipelineFloatingRepresentation = TypeInstructionPipelineRepresentation & {
  unit: number
}

export type TypeArrowCycle = {
  fromAddressRow: number;
  fromStep: number;
  toAddressRow: number;
  toStep: number;
  color: number; // hexadecimal 0xff00ff rgb
};

export type TypePipeline = {
  IF: TypeCycleCell;
  ID: TypeCycleCell;
  intEX: TypeCycleCell;
  MEM: TypeCycleCell;
  WB: TypeCycleCell;

  faddEX: TypeCycleCellUnit[];
  fmultEX: TypeCycleCellUnit[];
  fdivEX: TypeCycleCellUnit[];
  arrows: TypeArrowCycle[];
};

export type TypePipelineInstructions = {
  IF: { text: string; draw: boolean | TypeStall; };
  ID: { text: string; draw: boolean | TypeStall; };
  intEX: { text: string; draw: boolean | TypeStall; };
  MEM: { text: string; draw: boolean | TypeStall; };
  WB: { text: string; draw: boolean | TypeStall; };
  faddEX: { unit: number; text: string; draw: boolean | TypeStall; }[]
  fmultEX: { unit: number; text: string; draw: boolean | TypeStall; }[]
  fdivEX: { unit: number; text: string; draw: boolean | TypeStall; }[]
};

export type TypeErrorInCode = {
  line: number;
  message: string;
  severity: EnumSeverity;
}

export type TypeSimulationStep = {
  isComplete?: boolean;
  isBreakpoint?: boolean;
  step: number;
  line: number;
  isNewInstruction: boolean;
  // stage: TypeStage;

  pipeline: TypePipeline;
  registers: TypeRegisterToUpdate[];
  memory: TypeMemoryToUpdate[];
  statistics: Partial<TypeDataStatistics>;
};

export type TypeSimulationInitResponse = {
  filename: string;
  id: string;
  date: string;
  lines: number;
  canSimulate: boolean;
  errors: TypeErrorInCode[];

  machineDirectives: TypeDirectiveData[];
  machineInstructions: TypeInstructionsData[];
  runner: TypeSimulationStep[];
};

export type TypeSimulationInitRequest = {
  id: string;
  filename: string;
  date: string;
  content: string;

  breakpoints: TypeLine[];
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
