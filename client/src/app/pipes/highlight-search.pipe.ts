import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'highlight'
})
export class HighlightSearch implements PipeTransform {
  transform(value: any, args: any): any {
    const re = new RegExp(args, 'gi');
    return value ? value.replace(re, '<mark>' + args + '</mark>') : null;
  }
}
