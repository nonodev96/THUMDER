import { Pipe, PipeTransform } from '@angular/core';
import { TypeTransformDecimalToBase } from "../../../types";

@Pipe({
  name: 'number_to_base'
})
export class NumberToBasePipe implements PipeTransform {
  transform(value: number, args: TypeTransformDecimalToBase = {base: 10, maxLength: 0, fillString: ""}): string {
    return value.toString(args.base).padStart(args.maxLength, args.fillString);
  }
}
