import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'objects_entries'
})
export class ObjectsPipe implements PipeTransform {
  transform(value: unknown, ...args: unknown[]): unknown {
    return Object.entries(value ?? {}).map(([key, value]) => {
      return [key, value]
    });
  }
}
