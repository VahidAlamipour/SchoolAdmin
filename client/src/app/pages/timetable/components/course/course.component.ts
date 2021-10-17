import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material';
import * as moment from 'moment';

import { DeleteLessonModalComponent } from 'src/app/components/modals/delete-lesson-modal/delete-lesson-modal.component';
import { ILesson } from '../../../../../../../sdk/interfaces';
import { CONFIG } from 'src/app/config';

@Component({
  selector: 'course',
  templateUrl: './course.component.html'
})
export class TimetableCourseComponent {
  @Input()
  public lesson: ILesson;
  @Input()
  public editable: boolean;
  @Input()
  public dayIndex: number;
  @Output()
  private lessonDelete: EventEmitter<any> = new EventEmitter();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {}

  public editLesson(id: number): void {
    const classId = +localStorage.getItem('timetableClassesSelected');
    const date = moment(this.lesson.date).format('YYYY-MM-DD');
    this.router.navigate(['/timetable', classId, date, id], {
      relativeTo: this.route
    });
  }

  public getLessonTitle(lesson: ILesson): string {
    if (lesson.groups) {
      return `${lesson.groups
        .map(
          (subclass, i) =>
            `<span>Subclass ${i + 1}: ${subclass.subject.name}</span>`
        )
        .join('')}`;
    } else {
      return lesson.subject.name;
    }
  }

  public deleteLesson(): void {
    this.dialog
      .open(DeleteLessonModalComponent, {
        panelClass: ['modal', 'lesson-delete'],
        autoFocus: false,
        restoreFocus: false,
        role: 'alertdialog',
        data: {
          title: 'Choose the option to delete the lesson: ',
          lessonId: this.lesson.id,
          date: this.lesson.date
        }
      })
      .beforeClosed()
      .subscribe({
        next: (result: boolean) => {
          if (result) {
            this.lessonDelete.emit();
          }
        }
      });
  }
}
