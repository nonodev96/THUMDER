import { MachineService } from "./__core/machine/machine.service";
import { ASCII_TABLE } from "./CONSTAST";


export namespace Utils {

  export function orderJSONBy(array, selector, desc = false) {
    return [...array].sort((a, b) => {
      if (desc) {
        return parseFloat(a.selector) - parseFloat(b.selector)
      } else
        return parseFloat(b.selector) - parseFloat(a.selector)
    });
  }

  export function initSynchronousFactory() {
    return () => {
      console.log('initSynchronousFactory');
      // run initialization code here
    };
  }

  export function initLongRunningFactory() {
    return () => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 5000);
      });
    };
  }

  export function initWithDependencyFactory(service: Object) {
    return () => {
      console.log('initWithDependencyFactory - started');
      return service
    };
  }

  export function initServicesFactory(service: MachineService | any) {
    return async () => {
      // console.log('initServicesFactory - started')
      const finish = await service.resetMachineStatus();
      if (finish === false) {
        console.log('initServicesFactory - completed ', finish)
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
    return new Set(b).size === new Set(b.concat(a)).size
  }

  export function modNotNegative(n: number, m: number): number {
    let value = ((n % m)) % m;
    value = value < 0 ? 0 : value
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
    const decimal = hexadecimalToDecimal(hexadecimal)
    return (decimal).toString(2).padStart(args.maxLength, args.fillString)
  }

  export function binaryToHexadecimal(binary: string, args = {maxLength: 8, fillString: '0'}): string {
    return parseInt(binary, 2).toString(16).toUpperCase().padStart(args.maxLength, args.fillString)
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
    return replaceAt(binary_A, index, binary_B)
  }

  export function binaryStringSwap_module(oldValueBinaryString: string, newValuePart: string, start: number, end: number, module: number) {
    let result = oldValueBinaryString.split('');
    for (let i = 0; i < 32; i++) {
      if (i >= start && i < end) {
        result[i] = newValuePart[i % module];
      }
    }
    return result.join('');
  }

  export function integer8ToBin(integer8: number) {
    return Math.abs(integer8).toString(2).padStart(8, '0').toString()
  }

  export function integer16ToBin(integer16: number) {
    return Math.abs(integer16).toString(2).padStart(16, '0').toString()
  }

  export function integer32ToBin(integer32: number) {
    return Math.abs(integer32).toString(2).padStart(32, '0').toString()
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
    if (str.length !== 32) throw new Error("Binary cannot be converted because the length is not 32.")
    const arr = [];
    for (let i = 0; i < str.length; i += 8) {
      const inner = str.slice(i, i + 8);
      arr.push(parseInt(inner, 2));
    }
    const c = new Uint8Array(arr);
    return new DataView(c.buffer, 0, 4).getFloat32(0);
  }

  export function convertIEEE754_Binary64Bits_To_Number(str: string): number {
    if (str.length !== 64) throw new Error("Binary cannot be converted because the length is not 64.")
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
}
