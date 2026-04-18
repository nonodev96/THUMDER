import { Pipe, type PipeTransform } from "@angular/core";
import { Utils } from "@app/Utils";

@Pipe({
  name: "number_to_binary32_IEEE754",
  standalone: false,
})
export class NumberToBinary32_IEEE754Pipe implements PipeTransform {
  transform(value: number, ..._args: unknown[]): string {
    return Utils.convertIEEE754_Number_To_Binary32Bits(value);
  }
}
