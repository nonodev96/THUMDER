import { Pipe, PipeTransform } from '@angular/core';
import { Utils } from "../../../Utils";

@Pipe({
  name: 'decimal_IEEE754_64'
})
export class Decimal_IEEE754_64_Pipe implements PipeTransform {
  transform(value: string): number {
    return Utils.convertBinaryIEEE754_64bits_ToNumber(value);
  }
}
