import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { catchError, finalize } from 'rxjs/operators';
import { BehaviorSubject, Observable, of, from } from 'rxjs';

import { IParent } from '../../../../../sdk/interfaces';
import { IPageQuery, IPageResponse } from '../../../../../sdk/sdk';
import { SdkService } from 'src/app/services/sdk.service';
import { CookieService } from 'ngx-cookie-service';

export class ParentsDataSource implements DataSource<IParent> {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private parentsSubject = new BehaviorSubject<IParent[]>([]);
  public parentsCountSubject = new BehaviorSubject<number>(0);
  private hasInitDataSubject = new BehaviorSubject<boolean>(true);

  public hasInitData$ = this.hasInitDataSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public parentsSubject$ = this.parentsSubject.asObservable();
  public parentsCount$ = this.parentsCountSubject.asObservable();
  public parentsCount: number;

  constructor(private sdk: SdkService, private cookieService: CookieService) {}

  loadParents(params?: IPageQuery & { classId?: number }, hasFilterData: boolean = false) {
    this.loadingSubject.next(true);
    from(
      this.sdk.client.getParents({
        ...params,
        schoolId: +this.cookieService.get('schoolId')
      })
    )
      .pipe(
        catchError(() => of([])),
        finalize(() => this.loadingSubject.next(false))
      )
      .subscribe((parentsList: IPageResponse<IParent>) => {
        if (!hasFilterData && parentsList) {
          this.hasInitDataSubject.next(parentsList.count !== 0);
        }
        this.parentsSubject.next(parentsList.list);
        this.parentsCountSubject.next(parentsList.count);
        this.parentsCount = parentsList.count;
      });
  }

  connect(collectionViewer: CollectionViewer): Observable<IParent[]> {
    return this.parentsSubject.asObservable();
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this.parentsSubject.complete();
    this.parentsCountSubject.complete();
    this.loadingSubject.complete();
  }
}
