import { Pipe, PipeTransform } from '@angular/core';
import { Utils } from "../../../Utils";

@Pipe({
  name: 'uint_IEEE754_64'
})
export class Uint_IEEE754_64_Pipe implements PipeTransform {
  transform(double64: number): string {
    return Utils.convertBinaryIEEE754_64bits_ToUintArray(double64);
  }
}
