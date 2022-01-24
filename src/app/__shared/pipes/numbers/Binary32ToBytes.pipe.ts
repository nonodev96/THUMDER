import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "binary32_to_bytes"
})
export class Binary32ToBytesPipe implements PipeTransform {
  transform(binary: string = "00000000000000000000000000000000"): string {
    const e0 = parseInt(binary.substr(0, 8), 2).toString().padStart(3, "0");
    const e1 = parseInt(binary.substr(8, 8), 2).toString().padStart(3, "0");
    const e2 = parseInt(binary.substr(16, 8), 2).toString().padStart(3, "0");
    const e3 = parseInt(binary.substr(24, 8), 2).toString().padStart(3, "0");
    return "[" + e0 + "-" + e1 + "-" + e2 + "-" + e3 + "]";
  }
}
