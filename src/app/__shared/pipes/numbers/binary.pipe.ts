import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'binary'
})
export class BinaryPipe implements PipeTransform {

  transform(value: number, ...args: unknown[]): string {
    const toReturn = value >= 0 ? '0x' : '1x';
    return toReturn + Math.abs(value).toString(2).padStart(<number>args[0] - 1, '0');
  }

}
