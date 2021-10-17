import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { catchError, finalize } from 'rxjs/operators';
import { BehaviorSubject, Observable, of, from } from 'rxjs';

import { IRoom } from '../../../../../sdk/interfaces';
import { IPageQuery, IPageResponse } from '../../../../../sdk/sdk';
import { SdkService } from '../../services/sdk.service';

export class FacilitiesDataSource implements DataSource<IRoom> {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private facilitiesSubject = new BehaviorSubject<IRoom[]>([]);
  public facilitiesCountSubject = new BehaviorSubject<number>(0);
  private hasInitDataSubject = new BehaviorSubject<boolean>(true);

  public hasInitData$ = this.hasInitDataSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public facilitiesCount$ = this.facilitiesCountSubject.asObservable();
  public facilitiesCount: number;

  constructor(private sdk: SdkService) {}

  loadFacilities(
    params?: IPageQuery & { subject?: number },
    hasFilterData: boolean = false
  ) {
    this.loadingSubject.next(true);
    from(this.sdk.client.getRooms(params))
      .pipe(
        catchError(() => of([])),
        finalize(() => this.loadingSubject.next(false))
      )
      .subscribe((response: IPageResponse<IRoom>) => {
        if (!hasFilterData && response) {
          this.hasInitDataSubject.next(response.count !== 0);
        }
        this.facilitiesSubject.next(response['list']);
        this.facilitiesCountSubject.next(response['count']);
        this.facilitiesCount = response['count'];
      });
  }

  connect(collectionViewer: CollectionViewer): Observable<IRoom[]> {
    return this.facilitiesSubject.asObservable();
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this.facilitiesSubject.complete();
    this.facilitiesCountSubject.complete();
    this.loadingSubject.complete();
  }
}
