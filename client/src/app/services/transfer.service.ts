import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class TransferService {
  public selectedDataSubject = new BehaviorSubject([]);
  public selectedData = this.selectedDataSubject.asObservable();

  constructor() {}

  public addData(data) {
    this.selectedDataSubject.next(data);
  }
}
