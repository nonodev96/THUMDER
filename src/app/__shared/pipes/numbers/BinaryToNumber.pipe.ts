import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "binary_to_number"
})
export class BinaryByteToNumberPipe implements PipeTransform {
  transform(binary: string): number {
    return parseInt(binary, 2);
  }
}
