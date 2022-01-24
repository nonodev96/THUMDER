import { Pipe, PipeTransform } from "@angular/core";
import { Utils } from "../../../Utils";

@Pipe({
  name: "binary32_to_ascii"
})
export class Binary32ToASCIIPipe implements PipeTransform {
  transform(binary: string = "00000000000000000000000000000000"): string {
    const e0 = Utils.binaryToASCII(binary.substr(0, 8)).padStart(3, " ");
    const e1 = Utils.binaryToASCII(binary.substr(8, 8)).padStart(3, " ");
    const e2 = Utils.binaryToASCII(binary.substr(16, 8)).padStart(3, " ");
    const e3 = Utils.binaryToASCII(binary.substr(24, 8)).padStart(3, " ");
    return ("[" + e0 + "-" + e1 + "-" + e2 + "-" + e3 + "]").trim();
  }
}
