import { Pipe, PipeTransform } from "@angular/core";
import { Utils } from "../../../Utils";

@Pipe({
  name: "number_to_binary32_IEEE754"
})
export class NumberToBinary32_IEEE754Pipe implements PipeTransform {
  transform(value: number, ...args: unknown[]): string {
    return Utils.convertIEEE754_Number_To_Binary32Bits(value);
  }
}
