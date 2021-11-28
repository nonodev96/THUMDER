import { IndividualConfig } from "ngx-toastr/toastr/toastr-config";
import {
  PublicRoutes,
  PublicRoutesList,
  TypeCode,
  TypeDataRegister,
  TypeLang,
  TypeFloatingPointStageConfiguration,
  TypeRegister,
  TypeRegisterToEdit,
  TypeTableCode, TypeDataStatistics, TypePipeline, TypeStepSimulation
} from "./types";
import { SocketIoConfig } from "ngx-socket-io";

export const NPM_VERSION = '1.2.6';

export const REGEX_IS_ABSOLUTE_HREF = new RegExp('(?:^[a-z][a-z0-9+.-]*:|\/\/)', 'i');
export const REGEX_HEXADECIMAL_08 = new RegExp('^(0x|0X|)?([a-fA-F0-9]{08})$', 'i');
export const REGEX_HEXADECIMAL_16 = new RegExp('^(0x|0X|)?([a-fA-F0-9]{16})$', 'i');

export const DEFAULT_TIME_SIMULATION: number = 250;
export const DEFAULT_AUTO_SAVE: boolean = true;
export const DEFAULT_LANG: TypeLang = 'en';
// 0x8000 --> 32768
export const DEFAULT_MEMORY_SIZE: number = 32768;
export const DEFAULT_FLOATING_POINT_STAGE_CONFIGURATION: TypeFloatingPointStageConfiguration = {
  addition: {
    count: 1,
    delay: 2
  },
  multiplication: {
    count: 1,
    delay: 5
  },
  division: {
    count: 1,
    delay: 19
  },
};
export const DEFAULT_HEXADECIMAL_08_DIGITS = "".padStart(8, '0');
export const DEFAULT_HEXADECIMAL_16_DIGITS = "".padStart(16, '0');
export const DEFAULT_BINARY_08_BITS = "".padStart(8, '0');
export const DEFAULT_BINARY_16_BITS = "".padStart(16, '0');
export const DEFAULT_BINARY_32_BITS = "".padStart(32, '0');
export const DEFAULT_BINARY_64_BITS = "".padStart(64, '0');

export const DEFAULT_PIPELINE: TypePipeline = {
  IF: "",
  ID: "",
  intEX: "",
  MEM: "",
  WB: "",
  faddEX: [],
  fdivEX: [],
  fmultEX: [],
};

export const DEFAULT_STEP_SIMULATION: TypeStepSimulation = {
  IF: 0,
  IF_stall: 0,
  ID: 0,
  ID_stall: 0,
  intEX: 0,
  intEX_stall: 0,
  MEM: 0,
  MEM_stall: 0,
  WB: 0,
  WB_stall: 0,

  line: 0,
  step: 0,
  stage: "other",
  instruction: "----------",
  codeInstruction: "0x00000000",
  pipeline: DEFAULT_PIPELINE,
  memory: [],
  registers: []
};

export const DEFAULT_DATA_STATISTICS: TypeDataStatistics = {
  TOTAL: {
    CYCLES_EXECUTED: {cycles: 0},
    ID_EXECUTED: {instructions: 0},
    INSTRUCTIONS_IN_PIPELINE: {instructions_in_pipeline: 0}
  },
  HARDWARE: {
    MEMORY_SIZE: {size: 0},
    FADD_EX_STAGES: {num: 0, cycles: 0},
    FMULT_EX_STAGES: {num: 0, cycles: 0},
    FDIV_EX_STAGES: {num: 0, cycles: 0},
    FORWARDING: {enabled: true}
  },
  STALLS: {
    RAW_STALLS: {num: 0, per: 0},
    LD_STALLS: {num: 0, per: 0},
    BRANCH_STALLS: {num: 0, per: 0},
    FLOATING_POINT_STALLS: {num: 0, per: 0},
    WAW_STALLS: {num: 0, per: 0},
    STRUCTURAL_STALLS: {num: 0, per: 0},
    CONTROL_STALLS: {num: 0, per: 0},
    TRAP_STALLS: {num: 0, per: 0},
    TOTAL: {num: 0, per: 0}
  },
  CONDITIONAL: {
    TOTAL: {num: 0, per: 0},
    TAKEN: {num: 0, per: 0},
    NOT_TAKEN: {num: 0, per: 0}
  },
  LOAD_STORE: {
    TOTAL: {num: 0, per: 0},
    LOADS: {num: 0, per: 0},
    STORES: {num: 0, per: 0}
  },
  FLOATING: {
    TOTAL: {num: 0, per: 0},
    ADDITIONS: {num: 0, per: 0},
    MULTIPLICATIONS: {num: 0, per: 0},
    DIVISIONS: {num: 0, per: 0}
  },
  TRAPS: {
    TOTAL: {num: 0, per: 0}
  }
} as const;

export const DEFAULT_CODE: TypeCode = {
  text: "",
  instruction: "",
  address: "",
  code: ""
};

export const DEFAULT_TABLE_CODE: TypeTableCode = {
  text: "",
  instruction: "",
  code: "",
  address: "",
  stage: "",
  // binary: "00000000000000000000000000000000"
};

export const DEFAULT_CONFIG_TOAST: Partial<IndividualConfig> = {
  progressBar: true,
  progressAnimation: 'decreasing',
  closeButton: true
};

export const MAX_VALUE_TYPE_DATA = {
  "Byte": 255,
  "HalfWord": 65535,
  "Word": 4294967295,
  "Float": 4294967295,
  "Double": 18446744073709551615
};

export const STEP_TYPE_DATA = {
  "Byte": 1,
  "HalfWord": 1,
  "Word": 1,
  "Float": 0.1,
  "Double": 0.1
};
export const REGISTER_TO_EDIT: TypeRegister = 'Control';

export const REGISTERS_DATA: TypeDataRegister = {
  Control: {
    registers: 32,
    size: 32,
    maxLengthHexadecimal: 8
  },
  Integer: {
    registers: 32,
    size: 32,
    maxLengthHexadecimal: 8
  },
  Float: {
    registers: 32,
    size: 32,
    maxLengthHexadecimal: 8
  },
  Double: {
    registers: 16,
    size: 64,
    maxLengthHexadecimal: 16
  },
  DEFAULT: {
    registers: 32,
    size: 32,
    maxLengthHexadecimal: 8
  }
};

export const MACHINE_TYPE_REGISTERS: TypeRegister[] = [
  "Control", "Integer", "Float", "Double"
];

export const MACHINE_REGISTERS_C: TypeRegisterToEdit[] = [
  "PC", "IMAR", "IR", "A", "AHI", "B", "BHI", "BTA", "ALU", "ALUHI", "FPSR", "DMAR", "SDR", "SDRHI", "LDR", "LDRHI"
];

export const MACHINE_REGISTERS_R: TypeRegisterToEdit[] = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
  10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
  20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
  30, 31
];

export const MACHINE_REGISTERS_F: Partial<TypeRegisterToEdit>[] = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
  10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
  20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
  30, 31
];

export const MACHINE_REGISTERS_D: TypeRegisterToEdit[] = [
  0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30
];

export const ASCII_TABLE = [
  {hex: "00", binary: "00000000", ascii: "NUL"},
  {hex: "01", binary: "00000001", ascii: "SOH"},
  {hex: "02", binary: "00000010", ascii: "STX"},
  {hex: "03", binary: "00000011", ascii: "ETX"},
  {hex: "04", binary: "00000100", ascii: "EOT"},
  {hex: "05", binary: "00000101", ascii: "ENQ"},
  {hex: "06", binary: "00000110", ascii: "ACK"},
  {hex: "07", binary: "00000111", ascii: "BEL"},
  {hex: "08", binary: "00001000", ascii: "BS"},
  {hex: "09", binary: "00001001", ascii: "HT"},
  {hex: "0A", binary: "00001010", ascii: "LF"},
  {hex: "0B", binary: "00001011", ascii: "VT"},
  {hex: "0C", binary: "00001100", ascii: "FF"},
  {hex: "0D", binary: "00001101", ascii: "CR"},
  {hex: "0E", binary: "00001110", ascii: "SO"},
  {hex: "0F", binary: "00001111", ascii: "SI"},
  {hex: "10", binary: "00010000", ascii: "DLE"},
  {hex: "11", binary: "00010001", ascii: "DC1"},
  {hex: "12", binary: "00010010", ascii: "DC2"},
  {hex: "13", binary: "00010011", ascii: "DC3"},
  {hex: "14", binary: "00010100", ascii: "DC4"},
  {hex: "15", binary: "00010101", ascii: "NAK"},
  {hex: "16", binary: "00010110", ascii: "SYN"},
  {hex: "17", binary: "00010111", ascii: "ETB"},
  {hex: "18", binary: "00011000", ascii: "CAN"},
  {hex: "19", binary: "00011001", ascii: "EM"},
  {hex: "1A", binary: "00011010", ascii: "SUB"},
  {hex: "1B", binary: "00011011", ascii: "ESC"},
  {hex: "1C", binary: "00011100", ascii: "FS"},
  {hex: "1D", binary: "00011101", ascii: "GS"},
  {hex: "1E", binary: "00011110", ascii: "RS"},
  {hex: "1F", binary: "00011111", ascii: "US"},
  {hex: "20", binary: "00100000", ascii: "Space"},
  {hex: "21", binary: "00100001", ascii: "!"},
  {hex: "22", binary: "00100010", ascii: "\""},
  {hex: "23", binary: "00100011", ascii: "#"},
  {hex: "24", binary: "00100100", ascii: "$"},
  {hex: "25", binary: "00100101", ascii: "%"},
  {hex: "26", binary: "00100110", ascii: "&"},
  {hex: "27", binary: "00100111", ascii: "'"},
  {hex: "28", binary: "00101000", ascii: "("},
  {hex: "29", binary: "00101001", ascii: ")"},
  {hex: "2A", binary: "00101010", ascii: "*"},
  {hex: "2B", binary: "00101011", ascii: "+"},
  {hex: "2C", binary: "00101100", ascii: ","},
  {hex: "2D", binary: "00101101", ascii: "-"},
  {hex: "2E", binary: "00101110", ascii: "."},
  {hex: "2F", binary: "00101111", ascii: "/"},
  {hex: "30", binary: "00110000", ascii: "0"},
  {hex: "31", binary: "00110001", ascii: "1"},
  {hex: "32", binary: "00110010", ascii: "2"},
  {hex: "33", binary: "00110011", ascii: "3"},
  {hex: "34", binary: "00110100", ascii: "4"},
  {hex: "35", binary: "00110101", ascii: "5"},
  {hex: "36", binary: "00110110", ascii: "6"},
  {hex: "37", binary: "00110111", ascii: "7"},
  {hex: "38", binary: "00111000", ascii: "8"},
  {hex: "39", binary: "00111001", ascii: "9"},
  {hex: "3A", binary: "00111010", ascii: ":"},
  {hex: "3B", binary: "00111011", ascii: ";"},
  {hex: "3C", binary: "00111100", ascii: "<"},
  {hex: "3D", binary: "00111101", ascii: "="},
  {hex: "3E", binary: "00111110", ascii: ">"},
  {hex: "3F", binary: "00111111", ascii: "?"},
  {hex: "40", binary: "01000000", ascii: "@"},
  {hex: "41", binary: "01000001", ascii: "A"},
  {hex: "42", binary: "01000010", ascii: "B"},
  {hex: "43", binary: "01000011", ascii: "C"},
  {hex: "44", binary: "01000100", ascii: "D"},
  {hex: "45", binary: "01000101", ascii: "E"},
  {hex: "46", binary: "01000110", ascii: "F"},
  {hex: "47", binary: "01000111", ascii: "G"},
  {hex: "48", binary: "01001000", ascii: "H"},
  {hex: "49", binary: "01001001", ascii: "I"},
  {hex: "4A", binary: "01001010", ascii: "J"},
  {hex: "4B", binary: "01001011", ascii: "K"},
  {hex: "4C", binary: "01001100", ascii: "L"},
  {hex: "4D", binary: "01001101", ascii: "M"},
  {hex: "4E", binary: "01001110", ascii: "N"},
  {hex: "4F", binary: "01001111", ascii: "O"},
  {hex: "50", binary: "01010000", ascii: "P"},
  {hex: "51", binary: "01010001", ascii: "Q"},
  {hex: "52", binary: "01010010", ascii: "R"},
  {hex: "53", binary: "01010011", ascii: "S"},
  {hex: "54", binary: "01010100", ascii: "T"},
  {hex: "55", binary: "01010101", ascii: "U"},
  {hex: "56", binary: "01010110", ascii: "V"},
  {hex: "57", binary: "01010111", ascii: "W"},
  {hex: "58", binary: "01011000", ascii: "X"},
  {hex: "59", binary: "01011001", ascii: "Y"},
  {hex: "5A", binary: "01011010", ascii: "Z"},
  {hex: "5B", binary: "01011011", ascii: "["},
  {hex: "5C", binary: "01011100", ascii: "\""},
  {hex: "5D", binary: "01011101", ascii: "]"},
  {hex: "5E", binary: "01011110", ascii: "^"},
  {hex: "5F", binary: "01011111", ascii: "_"},
  {hex: "60", binary: "01100000", ascii: "`"},
  {hex: "61", binary: "01100001", ascii: "a"},
  {hex: "62", binary: "01100010", ascii: "b"},
  {hex: "63", binary: "01100011", ascii: "c"},
  {hex: "64", binary: "01100100", ascii: "d"},
  {hex: "65", binary: "01100101", ascii: "e"},
  {hex: "66", binary: "01100110", ascii: "f"},
  {hex: "67", binary: "01100111", ascii: "g"},
  {hex: "68", binary: "01101000", ascii: "h"},
  {hex: "69", binary: "01101001", ascii: "i"},
  {hex: "6A", binary: "01101010", ascii: "j"},
  {hex: "6B", binary: "01101011", ascii: "k"},
  {hex: "6C", binary: "01101100", ascii: "l"},
  {hex: "6D", binary: "01101101", ascii: "m"},
  {hex: "6E", binary: "01101110", ascii: "n"},
  {hex: "6F", binary: "01101111", ascii: "o"},
  {hex: "70", binary: "01110000", ascii: "p"},
  {hex: "71", binary: "01110001", ascii: "q"},
  {hex: "72", binary: "01110010", ascii: "r"},
  {hex: "73", binary: "01110011", ascii: "s"},
  {hex: "74", binary: "01110100", ascii: "t"},
  {hex: "75", binary: "01110101", ascii: "u"},
  {hex: "76", binary: "01110110", ascii: "v"},
  {hex: "77", binary: "01110111", ascii: "w"},
  {hex: "78", binary: "01111000", ascii: "x"},
  {hex: "79", binary: "01111001", ascii: "y"},
  {hex: "7A", binary: "01111010", ascii: "z"},
  {hex: "7B", binary: "01111011", ascii: "{"},
  {hex: "7C", binary: "01111100", ascii: "|"},
  {hex: "7D", binary: "01111101", ascii: "}"},
  {hex: "7E", binary: "01111110", ascii: "~"},
  {hex: "7F", binary: "01111111", ascii: "DEL"}
];

export const CONFIG_WEBSOCKET: SocketIoConfig = {
  url: 'http://localhost:3000',
  options: {
    transports: ['websocket'],
    reconnection: false
  }
};

export const AUTH_ROUTES: PublicRoutesList = [
  {
    lang: "CALCULATOR",
    path: "calculator",
    routerLink: '/auth/calculator',
    displayName: 'Calculator',
    data: {breadcrumb: 'calculator'}
  },
  {
    lang: "CODE",
    path: "code",
    routerLink: '/auth/code',
    displayName: 'Code',
    data: {breadcrumb: 'Code'}
  },
  {
    lang: "CONFIG",
    path: "config",
    routerLink: '/auth/config',
    displayName: 'Config',
    data: {breadcrumb: 'config'}
  },
  {
    lang: "DOCUMENTATION",
    path: "documentation",
    routerLink: '/auth/documentation',
    displayName: 'Documentation',
    data: {breadcrumb: 'Documentation'}
  },
  {
    lang: 'FILE-MANAGER',
    path: 'file-manager',
    routerLink: '/auth/file-manager',
    displayName: 'file-manager',
    data: {breadcrumb: 'File Manager'}
  },
  {
    lang: "IDE",
    path: "ide",
    routerLink: '/auth/ide',
    displayName: 'IDE',
    data: {breadcrumb: 'IDE'}
  },
  {
    lang: "LOGGER",
    path: "logger",
    routerLink: '/auth/logger',
    displayName: 'Logger',
    data: {breadcrumb: 'Logger'}
  },
  {
    lang: "MEMORY",
    path: "memory",
    routerLink: '/auth/memory',
    displayName: 'Memory',
    data: {breadcrumb: 'Memory'}
  },
  {
    lang: "CYCLE-CLOCK-DIAGRAM",
    path: "cycle-clock-diagram",
    routerLink: '/auth/cycle-clock-diagram',
    displayName: 'Cycle clock diagram',
    data: {breadcrumb: 'Cycle-clock-diagram'}
  },
  {
    lang: "PIPELINE",
    path: "pipeline",
    routerLink: '/auth/pipeline',
    displayName: 'Pipeline',
    data: {breadcrumb: 'Pipeline'}
  },
  {
    lang: "PROFILE",
    path: "profile",
    routerLink: '/auth/profile',
    displayName: 'Profile',
    data: {breadcrumb: 'Profile'}
  },
  {
    lang: "REGISTERS",
    path: "registers",
    routerLink: '/auth/registers',
    displayName: 'Registers',
    data: {breadcrumb: 'Registers'}
  },
  {
    lang: "STATISTICS",
    path: "statistics",
    routerLink: '/auth/statistics',
    displayName: 'Statistics',
    data: {breadcrumb: 'Statistics'}
  },
  {
    lang: "MULTIVIEW",
    path: "multiview",
    routerLink: '/auth/multiview',
    displayName: 'Multiview',
    data: {breadcrumb: 'Multiview'}
  },
];

export const PUBLIC_ROUTES: PublicRoutes = {
  lang: '/',
  path: '/',
  routerLink: '/',
  displayName: 'Home',
  data: {},
  children: [
    {
      lang: "DEBUG",
      path: "debug",
      routerLink: '/debug',
      displayName: 'Debug',
    },
    {
      lang: "LOGIN",
      path: "login",
      routerLink: '/login',
      displayName: 'Login',
    },
    {
      lang: "FORGOT-PASSWORD",
      path: "forgot-password",
      routerLink: '/forgot-password',
      displayName: 'Forgot password',
    },
    {
      lang: "REGISTER",
      path: "register",
      routerLink: '/register',
      displayName: 'Register',
    },
    // no layout views
    {
      lang: "LANDING",
      path: "landing",
      routerLink: '/landing/landing',
      displayName: 'Landing',
    },
    {
      lang: "ABOUT",
      path: "about",
      routerLink: '/landing/about',
      displayName: 'About',
    },
    // _admin views
    {
      lang: 'ADMIN',
      path: 'admin',
      routerLink: '/admin',
      displayName: 'Admin',
      data: {},
      children: []
    },
    // _auth views
    {
      lang: 'AUTH',
      path: 'auth',
      routerLink: '/auth',
      displayName: 'Auth',
      data: {breadcrumb: 'Auth'},
      children: AUTH_ROUTES,
    },
  ],

};
