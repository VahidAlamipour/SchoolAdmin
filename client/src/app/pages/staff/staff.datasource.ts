import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { catchError, finalize } from 'rxjs/operators';
import { BehaviorSubject, Observable, of, from } from 'rxjs';
import { SdkService } from 'src/app/services/sdk.service';
import { IAdministrator } from '../../../../../sdk/interfaces';
import { IPageQuery, IPageResponse } from '../../../../../sdk/sdk';

export class StaffDataSource implements DataSource<IAdministrator> {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private adminsSubject = new BehaviorSubject<IAdministrator[]>([]);
  private adminsCountSubject = new BehaviorSubject<number>(0);
  private hasInitDataSubject = new BehaviorSubject<boolean>(true);

  public hasInitData$ = this.hasInitDataSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public adminsSubject$ = this.adminsSubject.asObservable();
  public adminsCount$ = this.adminsCountSubject.asObservable();
  public adminsCount: number;

  constructor(private sdk: SdkService) {}

  public loadAdmins(params?: IPageQuery & { type?: string }, hasFilterData: boolean = false) {
    this.loadingSubject.next(true);
    from(this.sdk.client.getAdmins(params))
      .pipe(
        catchError(() => of([])),
        finalize(() => this.loadingSubject.next(false))
      )
      .subscribe((response: IPageResponse<IAdministrator>) => {
        if (!hasFilterData && response) {
          this.hasInitDataSubject.next(response.count !== 0);
        }
        this.adminsSubject.next(response.list);
        this.adminsCountSubject.next(response.count);
        this.adminsCount = response.count;
      });
  }

  connect(collectionViewer: CollectionViewer): Observable<IAdministrator[]> {
    return this.adminsSubject.asObservable();
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this.adminsSubject.complete();
    this.adminsCountSubject.complete();
    this.loadingSubject.complete();
  }
}
