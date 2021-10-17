import { Injectable } from '@angular/core';
import { BehaviorSubject, from } from 'rxjs';

import { SdkService } from 'src/app/services/sdk.service';
import { IPageQuery } from '../../../../../../../sdk/sdk';

@Injectable()
export class AddDataModalService {
  public selectedItems: Array<any> = new Array();
  public dataStream = new BehaviorSubject<any>([]);
  public сountSubject = new BehaviorSubject<number>(0);
  public loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  public pagesCount$ = this.сountSubject.asObservable();
  public currentPage = 0;

  constructor(private sdk: SdkService) {}

  public loadData(name: string, params?: IPageQuery& { classId?: number }) {
    this.loadingSubject.next(true);
    switch (name) {
      case 'administrators':
        return from(
          this.sdk.client.getAdmins({ ...params, ...{ type: 'ADMINISTRATOR' } })
        );
      case 'courses':
        return from(this.sdk.client.getSubjects(params));
      case 'learners':
        return from(this.sdk.client.getStudents(params));
      case 'parents':
        return from(this.sdk.client.getParents(params));
      case 'institutions':
        return from(this.sdk.client.getSchools(params));
      default:
        break;
    }
  }
}
