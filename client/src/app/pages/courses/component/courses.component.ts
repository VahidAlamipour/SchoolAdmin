import { Component, OnInit, ViewChild } from '@angular/core';
import { tap } from 'rxjs/operators';
import { merge } from 'rxjs';
import { MatPaginator, MatSort, MatDialog } from '@angular/material';

import { CoursesModalComponent } from 'src/app/components/modals/create-course-modal/create-course-modal.component';
import { CoursesDataSource } from '../courses.datasource';
import { LayoutService } from 'src/app/services/layout.service';
import { SdkService } from 'src/app/services/sdk.service';
import { ISubject } from '../../../../../../sdk/interfaces';
import { LessonService } from '../../../pages/lesson/lesson.service';


@Component({
  selector: 'app-courses',
  templateUrl: './courses.component.html'
})
export class CoursesComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true })
  private paginator: MatPaginator;
  @ViewChild(MatSort, { static: true })
  private sort: MatSort;

  private searchString = '';
  public displayedColumns: string[] = ['name', 'action'];
  public dataSource: CoursesDataSource;

  get hasFilterData(): boolean {
    return this.searchString.length !== 0;
  }

  get hasData() {
    return this.dataSource.hasInitData$;
  }

  constructor(
    private dialog: MatDialog,
    private sdk: SdkService,
    private layout: LayoutService,
    private lessonService: LessonService
  ) {}

  ngOnInit() {
    this.dataSource = new CoursesDataSource(this.sdk);
    this.dataSource.loadCourses({
      page: 0,
      limit: 10
    });
    this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0));
    merge(this.sort.sortChange, this.paginator.page)
      .pipe(tap(() => this.loadCourses()))
      .subscribe();
  }

  // filter by search string (with api)
  public applyFilter(searchString: string): void {
    this.searchString = searchString;
    this.paginator.pageIndex = 0;
    this.loadCourses();
  }

  // load data from backend
  private loadCourses() {
    this.dataSource.loadCourses(
      {
        query: this.searchString,
        page: this.paginator.pageIndex,
        limit: this.paginator.pageSize,
        order: this.sort.direction
      },
      this.hasFilterData
    );
  }

  public openCourseModal(courseData: ISubject = null): void {
    this.layout.blurWrapContainer();

    const modalOptions = courseData
      ? {
          title: 'Edit course',
          saveButtonText: 'Save',
          courseData: courseData
        }
      : {
          title: 'Create course',
          saveButtonText: 'Create course'
        };

    const coursesModal = this.dialog.open(CoursesModalComponent, {
      id: courseData ? 'edit' : 'create',
      panelClass: ['modal', 'noheight'],
      restoreFocus: false,
      data: modalOptions
    });

    coursesModal.beforeClosed().subscribe({
      next: (result: boolean) => {
        this.layout.unblurWrapContainer();
        if (result) {
          this.loadCourses();
          this.lessonService.resetCourses();
        }
      }
    });
  }
}
