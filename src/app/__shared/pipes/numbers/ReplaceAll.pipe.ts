import { Pipe, PipeTransform } from "@angular/core";
import { Utils } from "../../../Utils";

@Pipe({
  name: "replace_all"
})
export class ReplaceAllPipe implements PipeTransform {
  transform(str: string = "", args: { search: string, replace: string } = { search: "", replace: "" }): string {
    return Utils.replaceAll(str.toString(), args.search, args.replace);
  }
}
