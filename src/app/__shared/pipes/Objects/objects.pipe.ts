import { Pipe, type PipeTransform } from "@angular/core";

@Pipe({
  name: "objects_entries",
  standalone: false,
})
export class ObjectsPipe implements PipeTransform {
  transform(value: unknown, ..._args: unknown[]): unknown {
    return Object.entries(value ?? {}).map(([key, value]) => {
      return [key, value];
    });
  }
}
