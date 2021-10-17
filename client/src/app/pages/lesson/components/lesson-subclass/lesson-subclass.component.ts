import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  ChangeDetectionStrategy
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription, Observable } from 'rxjs';
import * as _ from 'lodash';

import { LessonService } from '../../lesson.service';
import {
  ISubGroup,
  ITeacher,
  IRoom,
  ILessonGroup
} from '../../../../../../../sdk/interfaces';

@Component({
  selector: 'lesson-subclass',
  templateUrl: './lesson-subclass.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LessonSubclassComponent implements OnInit, OnDestroy {
  @Input()
  public parentForm: FormGroup;
  @Input()
  private existingData: ILessonGroup;
  @Input()
  public title: string;
  @Input()
  public index: number;
  @Input()
  public editMode: boolean;
  @Output()
  public deleteSubclass: EventEmitter<any> = new EventEmitter();

  public subGroups$: Observable<ISubGroup[]>;
  public educators$: Observable<ITeacher[]>;
  public facilities$: Observable<IRoom[]>;

  private subjectControlSubscription: Subscription;
  private subgroupsControlSubscription: Subscription;
  private learnersListSubscription: Subscription;

  get learnersList() {
    return this.lessonService.allLearnersSubject.asObservable();
  }

  constructor(public lessonService: LessonService) {}

  ngOnInit() {
    this.lessonService.getCourses();
    this.subjectControlSubscription = this.parentForm.controls.subject.valueChanges.subscribe(
      subject => {
        this.resetFields();
        this.subGroups$ = this.lessonService.getSubGroup(subject.id);
        this.educators$ = this.lessonService.getEducators(subject.id);
        this.facilities$ = this.lessonService.getFacilities(subject.id);
      }
    );
    this.subgroupsControlSubscription = this.parentForm.controls.group.valueChanges.subscribe(
      subgroup => {
        subgroup
          ? this.lessonService.getLearnersList(subgroup.id, this.index)
          : this.clearLearnersListForGroup();
      }
    );
    this.learnersListSubscription = this.learnersList.subscribe(list => {
      const control = this.parentForm.controls.group;
      if (list[this.index] && list[this.index].length !== 0) {
        list[this.index].some((item: any) => item.isDuplicate)
          ? control.setErrors({ isDuplicate: true })
          : control.setErrors(null);
      }
    });
    if (this.existingData) {
      this.setExistingData();
    }
  }

  private setExistingData(): void {
    const form = this.parentForm.controls;
    const subgroup = this.existingData;
    Object.keys(subgroup).forEach(name => {
      if (name === 'group') {
        return;
      }
      if (form[name]) {
        form[name].patchValue(subgroup[name]);
      }
    });
    form.group.patchValue(subgroup['group']);
  }

  private resetFields(): void {
    this.clearLearnersListForGroup();
    this.parentForm.controls.group.reset();
    this.parentForm.controls.teacher.reset();
    this.parentForm.controls.room.reset();
  }

  private clearLearnersListForGroup(): void {
    this.lessonService.allLearnersLists[this.index] = [];
    this.lessonService.updateLearnersSubject();
  }

  ngOnDestroy() {
    this.subjectControlSubscription.unsubscribe();
    this.subgroupsControlSubscription.unsubscribe();
    this.learnersListSubscription.unsubscribe();
  }
}
