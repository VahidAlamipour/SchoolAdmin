import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as _ from 'lodash';

import { SdkService } from 'src/app/services/sdk.service';
import { ICity } from '../../../../../../sdk/interfaces';

@Injectable()
export class InstitutionsService {
  private citiesSubject: BehaviorSubject<ICity[]> = new BehaviorSubject<
    ICity[]
  >([]);

  public cities$ = this.citiesSubject.asObservable();

  constructor(private sdk: SdkService) {}

  public getCities(): void {
    this.sdk.client
      .getCities({ limit: -1 })
      .then(data => this.citiesSubject.next(data.list));
  }
}
