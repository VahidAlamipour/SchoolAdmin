import {
  Component,
  OnInit,
  Input,
  OnDestroy,
  ChangeDetectionStrategy
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { AuthService } from 'src/app/auth/auth.service';
import { LessonService } from '../../lesson.service';
import { ILessonGroup } from '../../../../../../../sdk/interfaces';

@Component({
  selector: 'lesson-subclasses-block',
  templateUrl: './lesson-subclasses-block.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LessonSubclassesBlockComponent implements OnInit, OnDestroy {
  @Input()
  public parentForm: FormGroup;
  @Input()
  public existingData: ILessonGroup[];

  public maxGroupsNumber = 5;
  private formName = 'groups';

  get subclassesData() {
    return <FormArray>this.parentForm.get('groups');
  }

  get editMode() {
    if (this.existingData) {
      return true;
    } else {
      return false;
    }
  }

  constructor(private fb: FormBuilder, private lessonService: LessonService, private authService: AuthService) {}

  ngOnInit() {
    this[this.formName] = new FormArray([]);
    this.parentForm.addControl(this.formName, this[this.formName]);
    this.existingData
      ? this.existingData.forEach(() => this.createSubclass())
      : this.createSubclass();
    this.maxGroupsNumber = Number(this.authService.localData.config.subgroupsMaxCount);
  }

  public createSubclass(): void {
    const control = <FormArray>this.parentForm.controls[this.formName];
    control.push(this.initGroup());
  }

  private initGroup(): FormGroup {
    return this.fb.group({
      subject: ['', Validators.required],
      group: ['', Validators.required],
      teacher: ['', Validators.required],
      room: ['', Validators.required]
    });
  }

  public deleteSubclass(i: number): void {
    if (this.existingData) {
      this.existingData.splice(i, 1);
    }
    this.lessonService.allLearnersLists.splice(i, 1);
    this.lessonService.updateLearnersSubject();
    const control = <FormArray>this.parentForm.controls[this.formName];
    control.removeAt(i);
    this.parentForm.updateValueAndValidity();
    this.parentForm.markAsDirty();
  }

  public getSubclassTitle(i: number): string {
    return `Subclass ${i + 1}`;
  }

  public getExistingData(i: number): ILessonGroup {
    return this.existingData ? this.existingData[i] : null;
  }

  ngOnDestroy() {
    this.parentForm.removeControl(this.formName);
  }
}
