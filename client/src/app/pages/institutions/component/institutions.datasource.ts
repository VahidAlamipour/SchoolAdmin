import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { catchError, finalize } from 'rxjs/operators';
import { BehaviorSubject, Observable, of, from } from 'rxjs';

import { SdkService } from '../../../services/sdk.service';
import { IPageQuery, IPageResponse } from '../../../../../../sdk/sdk';
import { ISchool } from '../../../../../../sdk/interfaces';

export class InstitutionsDataSource implements DataSource<ISchool> {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private institutionsSubject = new BehaviorSubject<ISchool[]>([]);
  public institutionsCountSubject = new BehaviorSubject<number>(0);

  public loading$ = this.loadingSubject.asObservable();
  public institutionsCount$ = this.institutionsCountSubject.asObservable();

  constructor(private sdk: SdkService) {}

  public loadInstitutions(params?: IPageQuery & { cityId?: number }) {
    this.loadingSubject.next(true);
    if (params.cityId === null) {
      this.institutionsSubject.next([]);
      this.institutionsCountSubject.next(null);
    } else {
      from(this.sdk.client.getSchools(params))
        .pipe(
          catchError(() => of([])),
          finalize(() => this.loadingSubject.next(false))
        )
        .subscribe((institutions: IPageResponse<ISchool>) => {
          this.institutionsSubject.next(institutions.list);
          this.institutionsCountSubject.next(institutions.count.length);
        });
    }
  }

  connect(collectionViewer: CollectionViewer): Observable<ISchool[]> {
    return this.institutionsSubject.asObservable();
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this.institutionsSubject.complete();
    this.institutionsCountSubject.complete();
    this.loadingSubject.complete();
  }
}
