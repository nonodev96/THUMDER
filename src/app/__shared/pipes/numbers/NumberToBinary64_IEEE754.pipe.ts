import { Pipe, PipeTransform } from '@angular/core';
import { Utils } from "../../../Utils";

@Pipe({
  name: 'number_to_binary64_IEEE754'
})
export class NumberToBinary64_IEEE754Pipe implements PipeTransform {
  transform(value: number, ...args: unknown[]): string {
    return Utils.float64ToBin(value);
  }
}
