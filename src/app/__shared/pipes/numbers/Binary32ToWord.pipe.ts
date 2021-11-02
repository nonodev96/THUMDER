import { Pipe, PipeTransform } from '@angular/core';
import { DEFAULT_BINARY_32_BITS } from "../../../CONSTAST";

@Pipe({
  name: 'binary32_to_word'
})
export class Binary32ToWordPipe implements PipeTransform {
  transform(binary: string = DEFAULT_BINARY_32_BITS): string {
    const e0 = parseInt(binary.substr(0, 32), 2).toString().padStart(10, '0');
    return "[" + e0 + "]"
  }
}
