import { Pipe, PipeTransform } from '@angular/core';
import { Utils } from "../../../Utils";

@Pipe({
  name: 'uint_IEEE754_32'
})
export class Uint_IEEE754_32_Pipe implements PipeTransform {
  transform(float32: number): string {
    return Utils.convertBinaryIEEE754_32bits_ToUintArray(float32);
  }
}
