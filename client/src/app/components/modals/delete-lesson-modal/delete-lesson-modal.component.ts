import { Component, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import * as moment from 'moment';

import { fadeAnimation } from 'src/app/animations/animations';
import { SdkService } from 'src/app/services/sdk.service';
import { LayoutService } from 'src/app/services/layout.service';
import { CONFIG } from 'src/app/config';
import { SidebarService } from '../../sidebar/sidebar.service';

@Component({
  selector: 'app-delete-lesson-modal',
  templateUrl: './delete-lesson-modal.component.html',
  animations: [fadeAnimation]
})
export class DeleteLessonModalComponent implements OnDestroy {
  private lessonId: number;
  private date: Date;
  public lessonDeleteForm: FormGroup;
  public periods: Array<any> = [{ id: 1, name: 'Current lesson' }];
  public lastDate: Date;
  public title: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private sdk: SdkService,
    private formBuilder: FormBuilder,
    private layout: LayoutService,
    public dialogRef: MatDialogRef<DeleteLessonModalComponent>,
    private sidebarService : SidebarService
  ) {
    layout.blurWrapContainer();

    sdk.client
      .getLesson(data.lessonId, {
        date: data.date,
        academicYearId: +localStorage.getItem('timetableYearSelected')
      })
      .then(lesson => (this.lastDate = lesson.lastDate))
      .finally(() => {
        if (this.lastDate) {
          this.title = data.title;
          const lastPeriod = {
            id: 2,
            name: `All lessons ${
              this.lastDate
                ? '(created till ' +
                  moment(this.lastDate).format(CONFIG.VIEW_DATE_FORMAT) +
                  ')'
                : ''
            }`
          };
          this.periods.push(lastPeriod);
        } else {
          this.title = 'Are you sure you want to delete this lesson?';
        }
      });
    this.lessonDeleteForm = formBuilder.group({
      period: [this.periods[0], Validators.required]
    });
    this.lessonId = data.lessonId;
    this.date = new Date(data.date);
  }

  public onClick(action: boolean): void {
    const currentLesson: boolean =
      this.lessonDeleteForm.controls.period.value.id === 1;
    if (action) {
      this.sdk.client
        .deleteLesson(this.lessonId, {
          date: this.date,
          all: !currentLesson
        })
        .then(() => this.dialogRef.close(action))
        .catch(() => this.dialogRef.close(action));
       
    } else {
      this.dialogRef.close(action);
    }
    this.sidebarService.loadLessons({
      academicYearId:+localStorage.getItem('timetableYearSelected'),
      classId: null,
      startDate: null,
      endDate: null,
      shiftId: null
    });
  }

  ngOnDestroy() {
    this.layout.unblurWrapContainer();
  }
}
