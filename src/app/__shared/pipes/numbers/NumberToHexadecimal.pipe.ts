import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
    name: "number_to_hexadecimal",
    standalone: false
})
export class NumberToHexadecimalPipe implements PipeTransform {
  transform(value: number, ...args: unknown[]): string {
    return value.toString(16);
  }
}
