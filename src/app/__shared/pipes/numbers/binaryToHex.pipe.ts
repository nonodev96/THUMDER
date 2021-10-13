import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'binary_to_hex'
})
export class BinaryToHexPipe implements PipeTransform {

  transform(binary: string = "00000000000000000000000000000000"): string {
    return "0x" + parseInt(binary, 2).toString(16).padStart(Math.round(binary.length / 4), '0').toUpperCase();
  }

}
