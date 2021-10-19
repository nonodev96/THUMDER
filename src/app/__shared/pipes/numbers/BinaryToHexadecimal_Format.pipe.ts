import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'binary_32_64_to_hexadecimal'
})
export class BinaryToHexadecimal_FormatPipe implements PipeTransform {
  transform(binary: string = "00000000000000000000000000000000"): string {
    return "0x" + parseInt(binary, 2).toString(16).padStart(Math.round(binary.length / 4), '0').toUpperCase();
  }
}
