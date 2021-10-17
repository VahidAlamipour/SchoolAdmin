import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { catchError, finalize } from 'rxjs/operators';
import { BehaviorSubject, Observable, of, from } from 'rxjs';

import { SdkService } from 'src/app/services/sdk.service';
import { ITeacher } from '../../../../../sdk/interfaces';
import { IPageQuery, IPageResponse } from '../../../../../sdk/sdk';

export class EducatorsDataSource implements DataSource<ITeacher> {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private educatorsSubject = new BehaviorSubject<ITeacher[]>([]);
  private educatorsCountSubject = new BehaviorSubject<number>(0);
  private hasInitDataSubject = new BehaviorSubject<boolean>(true);

  public hasInitData$ = this.hasInitDataSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public educatorsSubject$ = this.educatorsSubject.asObservable();
  public educatorsCount$ = this.educatorsCountSubject.asObservable();
  public educatorsCount: number;

  constructor(private sdk: SdkService) {}

  loadEducators(params?: IPageQuery & { type?: string , schoolId?:number }, hasFilterData: boolean = false) {
    this.loadingSubject.next(true);

    from(this.sdk.client.getTeachers(params))
      .pipe(
        catchError(() => of([])),
        finalize(() => this.loadingSubject.next(false))
      )
      .subscribe((educatorsData: IPageResponse<ITeacher>) => {
        if (!hasFilterData && educatorsData) {
          this.hasInitDataSubject.next(educatorsData.count !== 0);
        }
        this.educatorsSubject.next(educatorsData.list);
        this.educatorsCountSubject.next(educatorsData.count);
        this.educatorsCount = educatorsData.count;
      });
  }

  connect(collectionViewer: CollectionViewer): Observable<ITeacher[]> {
    return this.educatorsSubject.asObservable();
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this.educatorsSubject.complete();
    this.educatorsCountSubject.complete();
    this.loadingSubject.complete();
  }
}
