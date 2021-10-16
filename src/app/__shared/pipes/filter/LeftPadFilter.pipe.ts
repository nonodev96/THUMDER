import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'pad_start'
})
export class PadStartFilterPipe implements PipeTransform {

  transform(value: string, args = {maxLength: 32, fillString: '0'}): string {
    return value.padStart(args.maxLength, args.fillString);
  }

}
