import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { SdkService } from 'src/app/services/sdk.service';
import { ImportItem } from './models/interfaces';

@Injectable()
export class ImportProgressService {
  public progressFullsize = false;
  public approximateProgress: number;
  public dataStream: BehaviorSubject<ImportItem[]> = new BehaviorSubject<ImportItem[]>([]);

  constructor(private sdk: SdkService) {
    this.startStream();
  }

  public startStream(): void {
    this.sdk.client.socket.on('file_received', (data: ImportItem) => this.dataProcessor(data));

    this.dataStream.subscribe((data: ImportItem[]): void => {
      const approximateProgressValues = data.map(item => (item.progress.isStopped ? 100 : item.progress.value));
      this.approximateProgress =
        approximateProgressValues.reduce((a, b) => a + b, 0) / approximateProgressValues.length;
    });
  }

  private dataProcessor(data: ImportItem): void {
    const idsInStream = this.dataStream.value.map(item => item.id);

    if (idsInStream.some(id => id === data.id)) {
      const index = this.dataStream.value.findIndex(item => item.id === data.id);
      this.dataStream.value[index] = data;
      this.dataStream.next(this.dataStream.value);
    } else {
      this.dataStream.next(this.dataStream.value.concat(data));
    }
  }

  public stopItemImport(data: ImportItem): void {
    // data.progress.value = 100;
    data.progress.isStopped = true;
    this.sdk.client.socket.emit('stopImport', data.id);
  }

  public controlProgressSize(open: boolean): void {
    this.progressFullsize = open;
  }

  public clearImport(): void {
    const items = this.dataStream.value.filter(
      (item: ImportItem) => item.progress.value < 100 && !item.progress.isStopped
    );
    this.controlProgressSize(items.length > 0);

    this.dataStream.next(items);
  }
}
