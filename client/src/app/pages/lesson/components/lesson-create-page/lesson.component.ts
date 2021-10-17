import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Subscription, Observable, BehaviorSubject, EMPTY } from 'rxjs';
import { FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material';
import * as moment from 'moment';

import { CrossingLessonsModalComponent } from 'src/app/components/modals/crossing-lessons-modal/crossing-lessons-modal.component';
import { DATE_FORMAT } from 'src/app/components/calendar/common/types/calendar-value-enum';
import { LayoutService } from 'src/app/services/layout.service';
import { SdkService } from 'src/app/services/sdk.service';
import { LessonService } from '../../lesson.service';
import {
  ITime,
  ITeacher,
  IRoom,
  IInterval,
  ILesson,
  IClass,
  ILessonGroup,
  ICrossLesson,
  CrossLessons
} from '../../../../../../../sdk/interfaces';
import { CONFIG } from 'src/app/config';

@Component({
  selector: 'app-lesson',
  templateUrl: './lesson.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LessonComponent implements OnInit, OnDestroy {
  public existingLesson: ILesson;
  public editMode = false;
  public subclassMode = false;
  private currentDate: moment.Moment;

  private _uploading = new BehaviorSubject<boolean>(false);
  public educators$: Observable<ITeacher[]> = EMPTY;
  public facilities$: Observable<IRoom[]> = EMPTY;
  public uploading$ = this._uploading.asObservable();

  public times: ITime[];
  public periods = ['Term', 'Year'];
  public intervals: IInterval[];

  public lessonForm = this.fb.group({
    date: [''],
    time: ['', Validators.required],
    subject: ['', Validators.required],
    teacher: ['', Validators.required],
    room: ['', Validators.required],
    bySubclasses: [false],
    period: [''],
    interval: [''],
    repeat: [''],
    timeId: ['']
  });

  private bySubclassesSubscription: Subscription;
  private courseSubscription: Subscription;

  get formValid(): boolean {
    return this.editMode ? this.lessonForm.valid && this.lessonForm.dirty : this.lessonForm.valid;
  }

  constructor(
    private route: ActivatedRoute,
    private layout: LayoutService,
    private dialog: MatDialog,
    private sdk: SdkService,
    private fb: FormBuilder,
    private router: Router,
    public lessonService: LessonService
  ) {
    const routeSubscription = route.params.subscribe(
      (params) => {
        this.lessonService.selectedClassId = params.classId;
        this.currentDate = moment(params.date, 'YYYY-MM-DD');
        this.setDate(this.currentDate);
        if (params.lessonId) {
          this.editMode = true;
          this.getExistingLesson(params.lessonId, this.currentDate);
        } else {
          this.getLessonData(params.classId);
        }
      },
      (error) => console.log('error', error),
      () => routeSubscription.unsubscribe()
    );
  }

  ngOnInit() {
    this.bySubclassesSubscription = this.lessonForm.controls.bySubclasses.valueChanges.subscribe((bySubclasses) => {
      this.subclassMode = bySubclasses;
      bySubclasses ? this.disableSingleform() : (this.lessonService.clearLearnersList(), this.enableSingleform());
    });
    if (!this.editMode) {
      this.formController();
    }
  }

  private enableSingleform(): void {
    this.lessonForm.controls.subject.enable();
    this.lessonForm.controls.teacher.enable();
    this.lessonForm.controls.room.enable();
  }

  private disableSingleform(): void {
    this.lessonForm.controls.subject.reset();
    this.lessonForm.controls.teacher.reset();
    this.lessonForm.controls.room.reset();
    this.lessonForm.controls.subject.disable();
    this.lessonForm.controls.teacher.disable();
    this.lessonForm.controls.room.disable();
  }

  private formController(): void {
    this.setClassData();
    this.lessonService.getCourses();
    const courseControl = this.lessonForm.controls.subject;
    const periodsControl = this.lessonForm.controls.period;
    this.courseSubscription = courseControl.valueChanges.subscribe((res) => {
      if (res) {
        this.getEducators(res.id);
        this.getFacilities(res.id);
      }
    });
    periodsControl.patchValue(this.periods[0]);
  }

  private getExistingLesson(id: number, currentDate: moment.Moment): void {
    const date = new Date(
      moment({
        year: moment(currentDate).year(),
        month: moment(currentDate).month(),
        day: moment(currentDate).date()
      }).format('YYYY-MM-DD')
    );
    this.sdk.client
      .getLesson(id, {
        date: date,
        academicYearId: +localStorage.getItem('timetableYearSelected')
      })
      .then((data) => {
        this.existingLesson = data;
        this.setClassData(data.class);
        this.getEducators(data.subject.id);
        this.getFacilities(data.subject.id);
        if (data.groups) {
          this.lessonForm.controls.bySubclasses.patchValue(true);
        }
      })
      .finally(() => this.setExisting());
  }

  private setExisting(): void {
    const form = this.lessonForm.controls;
    const data = this.existingLesson;
    Object.keys(data).forEach((name) => {
      if (name === 'date') {
        return;
      }
      if (form[name]) {
        form[name].patchValue(data[name]);
      }
      if (name === 'time') {
        form[name].patchValue(`${data[name].start} - ${data[name].end}`);
      }
      if (name === 'subject') {
        form[name].patchValue(data[name].name);
      }
    });
  }

  private getEducators(courseId: number): void {
    this.educators$ = this.lessonService.getEducators(courseId);
  }

  private getFacilities(courseId: number): void {
    this.facilities$ = this.lessonService.getFacilities(courseId);
  }

  private getLessonData(classId: number): void {
    const selectedShiftId = +localStorage.getItem('timetableShiftSelected');
    this.sdk.client
      .getAcademicYears({
        id: +localStorage.getItem('timetableYearSelected'),
        classId: classId,
        date: new Date(this.currentDate.format('YYYY-MM-DD')),
        limit: -1,
        ...(selectedShiftId ? { shiftId: selectedShiftId } : null)
      })
      .then((data) => {
        this.setTimes(data.list[0].shifts.map((shift) => shift.times));
        this.intervals = data.list[0].intervals;
      })
      .finally(() => {
        if (!this.editMode && this.times && this.times.length) {
          this.lessonForm.controls.time.patchValue(this.times[0]);
        }
        if (!this.editMode && this.intervals && this.intervals.length) {
          this.lessonForm.controls.interval.patchValue(this.intervals[0]);
        }
      });
  }

  private setTimes(timeTimes: ITime[][]): void {
    const tempTimes = [];
    timeTimes.forEach((times) => {
      times.forEach((time) => {
        tempTimes.push(time);
      });
    });
    this.times = tempTimes;
  }

  private setDate(date: moment.Moment): void {
    setTimeout(
      () =>
        this.lessonForm.controls.date.patchValue(`${date.format(CONFIG.VIEW_DATE_FORMAT)} (${date.format('dddd')})`),
      0
    );
  }

  private setClassData(classs?: IClass): void {
    let string = '';
    if (classs) {
      if (!classs.showName && classs.level) {
        string = `${classs.level.name}${classs.name}`;
      } else {
        string = `${classs.name}`;
      }
      this.lessonForm.controls.className.patchValue(string);
      this.lessonService.educationClass = classs;
    } else {
      this.sdk.client.getClass(this.lessonService.selectedClassId).then((data) => {
        this.lessonService.educationClass = data;
        if (!data.showName) {
          string = `${data.level.name}${data.name}`;
        } else {
          string = `${data.name}`;
        }
        this.lessonForm.controls.className.patchValue(string);
      });
    }
  }

  public onFormSubmit(form: any, crossingLessonsMode?: CrossLessons): void {
    this._uploading.next(true);
    const date = moment({
      year: moment(this.currentDate).year(),
      month: moment(this.currentDate).month(),
      day: moment(this.currentDate).date()
    });
    const lessonData: ILesson = {
      academicYearId: +localStorage.getItem('timetableYearSelected'),
      date: new Date(date.format('YYYY-MM-DD')),
      classId: this.lessonService.selectedClassId,
      timeId: form.time.id,

      ...(this.subclassMode
        ? { groups: this.getLessonSubclassIds(form.groups) }
        : {
          subjectId: form.subject.id,
          teacherId: form.teacher.id,
          roomId: form.room.id
        }),

      ...(form.repeat === 'Once' ? { repeat: form.repeat } : { repeat: form.period, intervalId: form.interval.id }),

      ...(crossingLessonsMode !== CrossLessons.break ? { crossingLessonsMode: crossingLessonsMode } : null)
    };

    if (!this.editMode) {
      this.sdk.client.newLesson(lessonData).then((data: ICrossLesson[]) => {
        if (data && Array.isArray(data) && data.length !== 0) {
          this.openCrossingLessonsModal(data, form);
        } else {
          this.onBackClick();
        }
      }).catch(err => {
        this._uploading.next(false);
      });
    } else {
      const updateData = {
        ...(this.subclassMode
          ? { ...lessonData, timeId: form.timeId }
          : {
            teacherId: form.teacher.id,
            roomId: form.room.id,
            timeId: form.timeId
          })
      };
      this.sdk.client
        .updateLesson(this.existingLesson.id, updateData, {
          date: new Date(date.format('YYYY-MM-DD')),
          all: false
        })
        .then(() => this.onBackClick()).catch(err => {
          this._uploading.next(false);
        });
    }
  }

  private getLessonSubclassIds(subclasses: any): ILessonGroup[] {
    const tempSubclasses: ILessonGroup[] = [];
    subclasses.forEach((subclass: any) =>
      tempSubclasses.push({
        subGroupId: subclass.group.id,
        teacherId: subclass.teacher.id,
        subjectId: subclass.subject.id,
        roomId: subclass.room.id
      })
    );
    return tempSubclasses;
  }

  public openCrossingLessonsModal(data: ICrossLesson[], form: any): void {
    this.layout.blurWrapContainer();
    const modal = this.dialog.open(CrossingLessonsModalComponent, {
      panelClass: ['modal', 'crossing-lessons'],
      restoreFocus: false,
      autoFocus: false,
      data: data
    });
    modal.beforeClosed().subscribe({
      next: (response: CrossLessons) => {
        if (response !== undefined && response !== CrossLessons.break) {
          this.onFormSubmit(form, response);
        }
        this.layout.unblurWrapContainer();
        this._uploading.next(false);
      }
    });
  }

  // navigate to previous page
  public onBackClick(): void {
    const date = moment({
      year: moment(this.currentDate).year(),
      month: moment(this.currentDate).month(),
      day: moment(this.currentDate).date()
    }).format(DATE_FORMAT);

    this.router.navigate(['timetable'], { queryParams: { date: date } });
  }

  ngOnDestroy() {
    this._uploading.next(false);
    this.lessonService.clearLearnersList();
    if (this.bySubclassesSubscription) {
      this.bySubclassesSubscription.unsubscribe();
    }
    if (this.courseSubscription) {
      this.courseSubscription.unsubscribe();
    }
  }
}
