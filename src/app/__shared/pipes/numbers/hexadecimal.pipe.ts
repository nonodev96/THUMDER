import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'hexadecimal'
})
export class HexadecimalPipe implements PipeTransform {

  transform(value: number, ...args: unknown[]): string {
     return value.toString(16);
  }

}