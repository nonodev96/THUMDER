import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "binary32_to_halfword"
})
export class Binary32ToHalfWordPipe implements PipeTransform {
  transform(binary: string = "00000000000000000000000000000000"): string {
    const e0 = parseInt(binary.substr(0, 16), 2).toString().padStart(5, "0");
    const e2 = parseInt(binary.substr(16, 16), 2).toString().padStart(5, "0");
    return "[" + e0 + "-" + e2 + "]";
  }
}
