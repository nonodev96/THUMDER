import { Pipe, PipeTransform } from '@angular/core';
import { Utils } from "../../../Utils";

@Pipe({
  name: 'binary64_to_decimal_IEEE754'
})
export class Binary64ToDecimal_IEEE754Pipe implements PipeTransform {
  transform(value: string): number {
    return Utils.convertBinaryIEEE754_64bits_ToNumber(value);
  }
}
