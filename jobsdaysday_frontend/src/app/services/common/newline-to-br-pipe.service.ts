import { Injectable, Pipe, PipeTransform } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
@Pipe({ name: 'newlineToBr' })
export class NewlineToBrPipe implements PipeTransform {
  transform(value: string): string {
    return value ? value.replace(/(?:\r\n|\r|\n)/g, '<br>') : '';
  }
}
