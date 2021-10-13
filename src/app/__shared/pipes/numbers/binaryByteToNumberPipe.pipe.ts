import { Pipe, PipeTransform } from '@angular/core';
import { Utils } from "../../../Utils";

@Pipe({
  name: 'binary_byte_to_number'
})
export class BinaryByteToNumberPipe implements PipeTransform {
  transform(binary: string): number {
    return parseInt(binary, 2);
  }
}
