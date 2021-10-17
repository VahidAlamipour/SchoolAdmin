import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { catchError, finalize } from 'rxjs/operators';
import { BehaviorSubject, Observable, of, from } from 'rxjs';

import { ISubject } from '../../../../../sdk/interfaces';
import { IPageQuery, IPageResponse } from '../../../../../sdk/sdk';
import { SdkService } from '../../services/sdk.service';

export class CoursesDataSource implements DataSource<ISubject> {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private coursesSubject = new BehaviorSubject<ISubject[]>([]);
  private coursesCountSubject = new BehaviorSubject<number>(0);
  private hasInitDataSubject = new BehaviorSubject<boolean>(true);

  public hasInitData$ = this.hasInitDataSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public coursesCount$ = this.coursesCountSubject.asObservable();

  constructor(private sdk: SdkService) {}

  public loadCourses(
    params?: IPageQuery & { subject?: number },
    hasFilterData: boolean = false
  ) {
    this.loadingSubject.next(true);
    from(this.sdk.client.getSubjects(params))
      .pipe(
        catchError(() => of([])),
        finalize(() => this.loadingSubject.next(false))
      )
      .subscribe((courses: IPageResponse<ISubject>) => {
        if (!hasFilterData && courses) {
          this.hasInitDataSubject.next(courses.count !== 0);
        }
        this.coursesSubject.next(courses.list);
        this.coursesCountSubject.next(courses.count);
      });
  }

  connect(collectionViewer: CollectionViewer): Observable<ISubject[]> {
    return this.coursesSubject.asObservable();
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this.coursesSubject.complete();
    this.coursesCountSubject.complete();
    this.loadingSubject.complete();
  }
}
