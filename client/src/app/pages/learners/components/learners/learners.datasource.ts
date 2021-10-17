import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { catchError, finalize } from 'rxjs/operators';
import { BehaviorSubject, Observable, of, from } from 'rxjs';

import { IStudent } from '../../../../../../../sdk/interfaces';
import { IPageQuery, IPageResponse } from '../../../../../../../sdk/sdk';
import { SdkService } from '../../../../services/sdk.service';

export class LearnersDataSource implements DataSource<IStudent> {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private learnersSubject = new BehaviorSubject<IStudent[]>([]);
  public learnersCountSubject = new BehaviorSubject<number>(0);
  private hasInitDataSubject = new BehaviorSubject<boolean>(true);

  public hasInitData$ = this.hasInitDataSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public learnersSubject$ = this.learnersSubject.asObservable();
  public learnersCount$ = this.learnersCountSubject.asObservable();

  constructor(private sdk: SdkService) {}

  public loadLearners(params?: IPageQuery & { classId?: number }, hasFilterData: boolean = false) {
    this.loadingSubject.next(true);
    if (params.classId === null) {
      this.learnersSubject.next([]);
      this.learnersCountSubject.next(null);
    } else {
      from(this.sdk.client.getStudents(params))
        .pipe(
          catchError(() => of([])),
          finalize(() => this.loadingSubject.next(false))
        )
        .subscribe((res: IPageResponse<IStudent>) => {
          if (!hasFilterData && res) {
            this.hasInitDataSubject.next(res.count !== 0);
          }
          this.learnersSubject.next(res.list);
          this.learnersCountSubject.next(res.count);
        });
    }
  }

  connect(collectionViewer: CollectionViewer): Observable<IStudent[]> {
    return this.learnersSubject.asObservable();
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this.learnersSubject.complete();
    this.learnersCountSubject.complete();
    this.loadingSubject.complete();
  }
}
