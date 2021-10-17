import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { catchError, finalize } from 'rxjs/operators';
import { BehaviorSubject, Observable, of, from } from 'rxjs';

import { IGroup } from '../../../../../../../sdk/interfaces';
import { IPageQuery, IPageResponse } from '../../../../../../../sdk/sdk';
import { SdkService } from '../../../../services/sdk.service';

export class SubclassesDataSource implements DataSource<IGroup> {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private subclassesSubject = new BehaviorSubject<IGroup[]>([]);
  public groupsCountSubject = new BehaviorSubject<number>(0);
  private hasInitDataSubject = new BehaviorSubject<boolean>(true);

  public hasInitData$ = this.hasInitDataSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public groupsCount$ = this.groupsCountSubject.asObservable();

  constructor(private sdk: SdkService) {}

  public loadSubclasses(
    params?: IPageQuery & { classId: number },
    hasFilterData: boolean = false
  ) {
    this.loadingSubject.next(true);
    if (params.classId === null) {
      this.subclassesSubject.next([]);
      this.groupsCountSubject.next(null);
    } else {
      from(this.sdk.client.getGroups(params))
        .pipe(
          catchError(() => of([])),
          finalize(() => this.loadingSubject.next(false))
        )
        .subscribe((subclasses: IPageResponse<IGroup>) => {
          if (!hasFilterData && subclasses) {
            this.hasInitDataSubject.next(subclasses.count !== 0);
          }
          this.subclassesSubject.next(subclasses.list);
          this.groupsCountSubject.next(subclasses.count);
        });
    }
  }

  connect(collectionViewer: CollectionViewer): Observable<IGroup[]> {
    return this.subclassesSubject.asObservable();
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this.subclassesSubject.complete();
    this.groupsCountSubject.complete();
    this.loadingSubject.complete();
  }
}
