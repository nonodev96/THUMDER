import { Pipe, PipeTransform } from '@angular/core';
import { Utils } from "../../../Utils";

@Pipe({
  name: 'binary32_to_decimal_IEEE754'
})
export class Binary32ToDecimal_IEEE754Pipe implements PipeTransform {
  transform(value: string): number {
    return Utils.convertIEEE754_Binary32Bits_To_Number(value);
  }
}
