import { MachineService } from "./__core/machine/machine.service";
import { ASCII_TABLE } from "./CONSTAST";
import { OPCODES_TYPE_I_J, OPCODES_TYPE_R_OPCODE_0, OPCODES_TYPE_R_OPCODE_1 } from "./__core/DLX/__OPCODES";
import { InterfaceFileItem } from "./types";
import { FileItem } from "./__core/services/file-system-nonodev96/file-system.service";
import firebase from "firebase/app";
import Timestamp = firebase.firestore.Timestamp;


export namespace Utils {

  export async function wait(timeMs: number = 1000): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, timeMs));
    return Promise.resolve();
  }

  export function MapToArray<K, V>(map: Map<K, V>): { key: K; value: V }[] {
    return Array.from(map, ([key, value]) => ({
      key,
      value
    }));
  }

  export function stringFormat(msg: string, ...args: any) {
    return msg.replace(/{([0-9]+)}/g, function (match, index) {
      return typeof args[index] == 'undefined' ? match : args[index];
    });
  }

  export function clone<T>(data: T) {
    return JSON.parse(JSON.stringify(data));
  }


  export function addressToIndex(address: string): number {
    return Math.trunc(this.hexadecimalToDecimal(address) / 4);
  }

  export function orderJSONBy(array, selector, desc = false) {
    return [...array].sort((a, b) => {
      if (desc) {
        return parseFloat(a.selector) - parseFloat(b.selector);
      } else
        return parseFloat(b.selector) - parseFloat(a.selector);
    });
  }

  export function initSynchronousFactory() {
    return () => {
      console.log('initSynchronousFactory');
      // run initialization code here
    };
  }

  export function initLongRunningFactory() {
    return async () => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 5000);
      });
    };
  }

  export function initWithDependencyFactory(service: any) {
    return () => {
      console.log('initWithDependencyFactory - started');
      return service;
    };
  }

  export function initServicesFactory(service: MachineService | any) {
    return async () => {
      // console.log('initServicesFactory - started')
      const finish = await service.resetMachineStatus();
      if (finish === false) {
        console.log('initServicesFactory - completed ', finish);
      }
    };
  }

  export function isNullOrUndefined(object: any): boolean {
    return object == null || false;
  }

  export function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      // tslint:disable-next-line:one-variable-per-declaration no-bitwise
      const r = Math.random() * 16 | 0;
      // tslint:disable-next-line:no-bitwise
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  export function arrayIsEqual(a: any[], b: any[]) {
    // if length is not equal
    if (a.length !== b.length) {
      return false;
    } else {
      // comparing each element of array
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
          return false;
        }
      }
      return true;
    }
  }

  export function isSubsetV2(a, b): boolean {
    return new Set(b).size === new Set(b.concat(a)).size;
  }

  export function modNotNegative(n: number, m: number): number {
    let value = ((n % m)) % m;
    value = value < 0 ? 0 : value;
    return value;
  }

  export function isSubset(arr1: any[], arr2: any[]) {
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < arr2.length; i++) {
      if (arr1.indexOf(arr2[i]) === -1) {
        return false;
      }
    }
    return true;
  }

  export function toBase(base, num) {
    const largest_power = ~~(Math.log(num) / Math.log(base));
    const result = [];
    for (let pow = largest_power; pow >= 0; pow--) {
      const digit = ~~(num / base ** pow);
      num -= digit * base ** pow;
      result.push(digit);
    }
    return result;
  }

  export function numberToHexadecimalString(n: number): string {
    if (n < 0) {
      n = 0xFFFFFFFF + n + 1;
    }
    return "0x" + ("00000000" + n.toString(16).toUpperCase()).substr(-8);
  }

  export function binaryToASCII(binary8: string): string {
    const element = ASCII_TABLE.filter(v => v.binary === binary8);
    if (element[0] === undefined) return "NUL";
    return element[0].ascii;
  }

  export function hexadecimalToBinary(hexadecimal: string, args = {maxLength: 32, fillString: '0'}): string {
    const decimal = hexadecimalToDecimal(hexadecimal);
    return (decimal).toString(2).padStart(args.maxLength, args.fillString);
  }

  export function binaryToHexadecimal(binary: string, args = {maxLength: 8, fillString: '0'}): string {
    return parseInt(binary, 2).toString(16).toUpperCase().padStart(args.maxLength, args.fillString);
  }

  export function hexadecimalToDecimal(hex: string): number {
    return parseInt(hex, 16);
  }

  export function replaceAt(text: string, index: number, replacement: string): string {
    return text.substr(0, index) + replacement + text.substr(index + replacement.length);
  }

  /**
   *
   * @param binary_A  1100-1100-1100-1100
   * @param binary_B       0000
   * @param index          4
   * result =======>  1100-0000-1100-1100
   *
   * @param binary_A  1100-1100-1100-1100
   * @param binary_B            0000-0000
   * @param index               8
   * result =======>  1100-1100-0000-0000
   */
  export function binaryStringSwap(binary_A: string, binary_B: string, index: number): string {
    return replaceAt(binary_A, index, binary_B);
  }

  export function binaryStringSwap_module(oldValueBinaryString: string, newValuePart: string, start: number, end: number, module: number) {
    const result = oldValueBinaryString.split('');
    for (let i = 0; i < 32; i++) {
      if (i >= start && i < end) {
        result[i] = newValuePart[i % module];
      }
    }
    return result.join('');
  }

  export function integer8ToBin(integer8: number) {
    return Math.abs(integer8).toString(2).padStart(8, '0').toString();
  }

  export function integer16ToBin(integer16: number) {
    return Math.abs(integer16).toString(2).padStart(16, '0').toString();
  }

  export function integer32ToBin(integer32: number) {
    return Math.abs(integer32).toString(2).padStart(32, '0').toString();
  }

  export function convertIEEE754_Number_To_Binary32Bits(float32: number): string {
    let str = "";
    const c = new Uint8Array(new Float32Array([float32]).buffer, 0, 4);
    for (const element of Array.from(c).reverse()) {
      str += element.toString(2).padStart(8, '0');
    }
    return str;
  }

  export function convertIEEE754_Number_To_Binary64Bits(double64: number): string {
    let str = "";
    const c = new Uint8Array(new Float64Array([double64]).buffer, 0, 8);
    for (const element of Array.from(c).reverse()) {
      str += element.toString(2).padStart(8, '0');
    }
    return str;
  }

  export function convertBinaryIEEE754_32bits_ToUintArray(float32: number): string {
    const c = new Uint8Array(new Float32Array([float32]).buffer, 0, 4);
    const elements: string[] = [];
    for (const element of Array.from(c).reverse()) {
      elements.push(element.toString().padStart(3, '0'));
    }
    const list = elements.join('-');
    return "[" + list + "]";
  }

  export function convertBinaryIEEE754_64bits_ToUintArray(float64: number): string {
    const c = new Uint8Array(new Float64Array([float64]).buffer, 0, 8);
    const elements: string[] = [];
    for (const element of Array.from(c).reverse()) {
      elements.push(element.toString().padStart(3, '0'));
    }
    const list = elements.join('-');
    return "[" + list + "]";
  }

  export function convertIEEE754_Binary32Bits_To_Number(str: string): number {
    if (str.length !== 32) throw new Error("Binary cannot be converted because the length is not 32.");
    const arr = [];
    for (let i = 0; i < str.length; i += 8) {
      const inner = str.slice(i, i + 8);
      arr.push(parseInt(inner, 2));
    }
    const c = new Uint8Array(arr);
    return new DataView(c.buffer, 0, 4).getFloat32(0);
  }

  export function convertIEEE754_Binary64Bits_To_Number(str: string): number {
    if (str.length !== 64) throw new Error("Binary cannot be converted because the length is not 64.");
    const arr = [];
    for (let i = 0; i < str.length; i += 8) {
      const inner = str.slice(i, i + 8);
      arr.push(parseInt(inner, 2));
    }
    const c = new Uint8Array(arr);
    return new DataView(c.buffer, 0, 8).getFloat64(0);
  }


  export function formatDecimalString(num: number): number {
    const numberFormat = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 10
    });
    return parseFloat(replaceAll(numberFormat.format(num), ",", ""));
  }

  export function formatDecimalNumber(num: number) {
    const numberFormat = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 10
    });
    const text = replaceAll(numberFormat.format(num), ",", "");
    return parseFloat(text);
  }

  export function replaceAll(str: string = "", search = "", replace = "") {
    return str.split(search).join(replace);
  }


  export function convertHexCodeToTextMachineInstructionDLX(hexCode: string): string {
    const binary = parseInt(hexCode, 16).toString(2).padStart(32, '0');
    const opcode = binary.substr(0, 6);
    const func_field = binary.substr(21, 11);
    const func_field_6_last_bits = func_field.substr(-6);

    const rs1 = parseInt(binary.substr(6, 5), 2).toString();
    const rs2 = parseInt(binary.substr(6 + 5, 5), 2).toString();
    const rd0 = parseInt(binary.substr(6 + 5 + 5, 5), 2).toString();

    const rs1F = parseInt(binary.substr(6, 5), 2).toString();
    const rs2F = parseInt(binary.substr(6 + 5, 5), 2).toString();
    const rd0F = parseInt(binary.substr(6 + 5 + 5, 5), 2).toString();

    const rs1I = parseInt(binary.substr(6, 5), 2).toString();
    const rd0I = parseInt(binary.substr(6 + 5, 5), 2).toString();
    const data = parseInt(binary.substr(6 + 5 + 5, 16), 2).toString();
    const data_26 = parseInt(binary.substr(6, 26), 2).toString();

    if (binary === "".padStart(32, '0')) {
      return "NOP";
    }

    const is_OPCODE_0 = opcode === "000000";
    if (is_OPCODE_0) {
      const obj_instruction_type_r_opcode_0 = OPCODES_TYPE_R_OPCODE_0.find(value => {
        return value.bits === func_field_6_last_bits;
      });
      if (obj_instruction_type_r_opcode_0) {
        const instruction_name = obj_instruction_type_r_opcode_0.name;
        // Type R with opcode = 0
        return instruction_name + " R" + rd0 + ", R" + rs1 + ", R" + rs2;
      }
      return "Instruction error #0";
    }

    const is_OPCODE_1 = opcode === "000001";
    if (is_OPCODE_1) {
      const obj_instruction_type_r_opcode_1 = OPCODES_TYPE_R_OPCODE_1.find(value => {
        return value.bits === func_field_6_last_bits;
      });
      if (obj_instruction_type_r_opcode_1) {
        const instruction_name = obj_instruction_type_r_opcode_1.name;
        // Type R with opcode = 1
        return instruction_name + " F" + rd0F + ", F" + rs1F + ", F" + rs2F;
      }
      return "Instruction error #1";
    }

    // Others OPCODES
    const is_OPCODE_TYPE_I_or_J = OPCODES_TYPE_I_J.some(value => {
      return value.bits === opcode;
    });
    if (is_OPCODE_TYPE_I_or_J) {
      const obj_instruction_type_i_or_j = OPCODES_TYPE_I_J.find(value => {
        return value.bits === opcode;
      });

      if (obj_instruction_type_i_or_j) {
        const instruction_name = obj_instruction_type_i_or_j.name;

        // Type I or type J
        if (["ADDI", "ADDUI", "SUBI", "SUBUI", "ANDI", "ORI", "XORI"].includes(instruction_name)) {
          return instruction_name + " R" + rd0I + ", R" + rs1I + ", #" + data;
        }
        if ("LHI" === instruction_name) {
          return instruction_name + " R" + rd0I + ", #" + data;
        }

        // Type J ?
        if (["J", "JAL"].includes(instruction_name)) {
          return instruction_name + " #" + data;
        }
        if (["BEQZ", "BNEZ"].includes(instruction_name)) {
          return instruction_name + " R" + rs1I + ", #" + data;
        }
        if (["BFPT", "BFPF"].includes(instruction_name)) {
          return instruction_name + " #" + data;
        }
        if ("RFE" === instruction_name) {
          return instruction_name;
        }
        if ("TRAP" === instruction_name) {
          return instruction_name + " #" + data_26;
        }

        // No se de que tipo son :3 supongamos que de tipo I
        if (["JR", "JALR"].includes(instruction_name)) {
          return instruction_name + " R" + rs1I;
        }

        if (["SLLI", "SRLI", "SRAI", "SEQI", "SNEI", "SLTI", "SGTI", "SLEI", "SGEI"].includes(instruction_name)) {
          return instruction_name + " R" + rd0I + ", R" + rs1I + ", #" + data;
        }

        if (["LB", "LH", "LW", "LBU", "LHU"].includes(instruction_name)) {
          return instruction_name + " R" + rd0I + ", ##" + data + "(R" + rs1I + ")";
        }
        if (["LF", "LD"].includes(instruction_name)) {
          return instruction_name + " F" + rd0I + ", ##" + data + "(R" + rs1I + ")";
        }

        if (["SB", "SH", "SW"].includes(instruction_name)) {
          return instruction_name + " ##" + data + "(R" + rs1I + "), R" + rd0I;
        }
        if (["SF", "SD"].includes(instruction_name)) {
          return instruction_name + " ##" + data + "(R" + rs1I + "), F" + rd0I;
        }

      }
      return "Instruction error #1";
    }

    return "Instruction error #-1";
  }

  export function MAP_FileItem_TO_InterfaceFileItem(fileItem: FileItem, UID: string): InterfaceFileItem {
    return {
      key: fileItem.key ?? '',
      pathKeys: fileItem.pathKeys ?? [],
      path: fileItem.path ?? '',
      name: fileItem.name ?? '',
      isDirectory: fileItem.isDirectory ?? false,
      hasSubDirectories: fileItem.hasSubDirectories ?? false,
      dateModified: Timestamp.fromDate(fileItem.dateModified ?? new Date()),
      thumbnail: fileItem.thumbnail ?? '',
      size: fileItem.size ?? 0,
      dataItem: fileItem.dataItem ?? {},

      e1_uid: UID,
      f_id: '',
      description: '',
      content: ''
    } as InterfaceFileItem;
  }

  export function MAP_FileItemArray_TO_InterfaceFileItemArray(fileItemArray: FileItem[], UID: string): InterfaceFileItem[] {
    return fileItemArray.map((value) => {
      return this.MAP_FileItem_TO_InterfaceFileItem(value, UID);
    });
  }

  export function MAP_InterfaceFileItem_TO_FileItem(interfaceFileItem: InterfaceFileItem): FileItem {
    const item: FileItem = new FileItem(interfaceFileItem.path, interfaceFileItem.isDirectory, interfaceFileItem.pathKeys);
    item.key = interfaceFileItem.key ?? '';
    item.pathKeys = interfaceFileItem.pathKeys ?? [];
    item.path = interfaceFileItem.path ?? '';
    item.name = interfaceFileItem.name ?? '';
    item.isDirectory = interfaceFileItem.isDirectory ?? false;
    item.hasSubDirectories = interfaceFileItem.hasSubDirectories ?? false;
    if (interfaceFileItem.dateModified) {
      item.dateModified = Timestamp.fromMillis(interfaceFileItem.dateModified.seconds * 1000).toDate();
    } else {
      item.dateModified = new Date();
    }
    item.thumbnail = interfaceFileItem.thumbnail ?? '';
    item.size = interfaceFileItem.size ?? 0;
    item.dataItem = interfaceFileItem.dataItem ?? {};
    return item;
  }

  export function MAP_InterfaceFileItemArray_TO_FileItemArray(interfaceFileItemArray: InterfaceFileItem[]): FileItem[] {
    return interfaceFileItemArray.map((value) => {
      return this.MAP_InterfaceFileItem_TO_FileItem(value);
    });
  }


  export function new_InterfaceFileItem() {
    const {uid} = JSON.parse(localStorage.getItem('user'));
    const fileItem = new FileItem('', false, []);
    const interfaceFileItem: InterfaceFileItem = {
      ...fileItem,
      dateModified: Timestamp.fromDate(new Date()),
      content: "",
      description: "",
      e1_uid: uid,
      f_id: "",
    };
    return interfaceFileItem;
  }
}
