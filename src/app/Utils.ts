import { MachineService } from "./__core/machine/machine.service";


export namespace Utils {

  export function hexadecimalToDecimal(value): number {
    return parseInt(value, 16);
  }

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
      return new Promise((resolve) => {
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
}
