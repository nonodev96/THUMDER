import { Pipe, type PipeTransform } from "@angular/core";
import type { TypeTransformDecimalToBase } from "../../../Types";

@Pipe({
  name: "number_to_base",
  standalone: false,
})
export class NumberToBasePipe implements PipeTransform {
  transform(value: number, args: TypeTransformDecimalToBase = { base: 10, maxLength: 0, fillString: "" }): string {
    return value.toString(args.base).padStart(args.maxLength ?? 0, args.fillString ?? "");
  }
}
