import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'leftPadFilter'
})
export class LeftPadFilterPipe implements PipeTransform {

  transform(value: string, ...args: unknown[]): string {
    return value.padStart(<number>args[0], '0');
  }

}
