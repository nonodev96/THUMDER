import { Pipe, PipeTransform } from '@angular/core';
import { Utils } from "../../../Utils";

@Pipe({
  name: 'decimal_IEEE754_32'
})
export class Decimal_IEEE754_32_Pipe implements PipeTransform {
  transform(value: string): number {
    return Utils.convertBinaryIEEE754_32bits_ToNumber(value);
  }
}
