import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'decimalToBasePipe'
})
export class DecimalToBasePipe implements PipeTransform {

  transform(value: number, ...args: unknown[]): string {
    return value.toString(<number>args[0]);
  }

}
