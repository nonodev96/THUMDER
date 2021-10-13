import { Pipe, PipeTransform } from '@angular/core';
import { Utils } from "../../../Utils";

@Pipe({
  name: 'binary_IEEE754_32'
})
export class Binary_IEEE754_32_Pipe implements PipeTransform {
  transform(value: number, ...args: unknown[]): string {
    return Utils.float32ToBin(value);
  }
}
