import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'from_base_to_base'
})
export class FromBaseToBasePipe implements PipeTransform {
  transform(value: number | string, args = {from_base: 10, to_base: 10, maxLength: 0, fillString: ''}): string {
    return parseInt(value.toString(), args.from_base).toString(args.to_base).padStart(args.maxLength, args.fillString);
  }
}
