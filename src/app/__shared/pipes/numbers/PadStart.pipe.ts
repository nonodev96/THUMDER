import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'pad_start'
})
export class PadStartPipe implements PipeTransform {
  transform(value: string, args: { maxLength: number, fillString: string } = {maxLength: 32, fillString: '0'}): string {
    return value.padStart(args.maxLength, args.fillString);
  }
}
