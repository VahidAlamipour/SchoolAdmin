import { Component, OnInit, Inject, HostBinding } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { FormBuilder, FormGroup } from '@angular/forms';
import { distinctUntilChanged, debounceTime, switchMap } from 'rxjs/operators';

import { SdkService } from 'src/app/services/sdk.service';
import { ISubject } from '../../../../../../sdk/interfaces';
import { IPageResponse } from '../../../../../../sdk/sdk';
import { VALIDATION_MESSAGES } from '../components/validation_messages';
import { SidebarService } from '../../sidebar/sidebar.service';

@Component({
  selector: 'app-create-course-modal',
  templateUrl: './create-course-modal.component.html'
})
export class CoursesModalComponent implements OnInit {
  @HostBinding('class') classes = 'modal_box';
  public validation_messages = VALIDATION_MESSAGES;

  public existingCourse: ISubject;
  public detailsForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private sdk: SdkService,
    public dialogRef: MatDialogRef<CoursesModalComponent>,
    public sidebarService : SidebarService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.existingCourse = data.courseData;
    this.detailsForm = this.formBuilder.group({
      subject: ['', { courseUnique: true }]
    });
  }

  ngOnInit() {
    if (this.existingCourse) {
      this.setExistingData();
    }
    const courseControl = this.detailsForm.controls.subject;
    courseControl.setErrors({ courseUnique: true });
    courseControl.valueChanges
      .pipe(
        debounceTime(100),
        distinctUntilChanged(),
        switchMap(val => this.searchForName(val))
      )
      .subscribe((res: IPageResponse<ISubject>) => {
        if (res.list.length > 1) {
          res.list.forEach(course => {
            if (
              course.name.toLowerCase() === courseControl.value.toLowerCase()
              // &&
              // (this.existingCourse
              //   ? course.name.toLowerCase() !==
              //     this.existingCourse.name.toLowerCase()
              //   : true)
            ) {
              courseControl.setErrors({ courseUnique: true });
            }
          });
        }
        if (
          res.list.length === 1 &&
          res.list[0].name.toLowerCase() === courseControl.value.toLowerCase()
        ) {
          courseControl.setErrors({ courseUnique: true });
        }
      });
  }

  private setExistingData(): void {
    this.sdk.client
      .getSubject(this.existingCourse.id)
      .then((data: ISubject) => {
        const form = this.detailsForm.controls;
        form.subject.patchValue(data.name, { onlySelf: true });
      });
  }

  private searchForName(value: string): Promise<IPageResponse<ISubject>> {
    return this.sdk.client.getSubjects({
      query: value,
      limit: -1
    });
  }

  public onSubmitFormDetails(data: any): void {
    const courseData: ISubject = {
      name: data.subject
    };
    if (this.existingCourse) {
      this.sdk.client
        .updateSubject(this.existingCourse.id, courseData)
        .then(() => this.dialogRef.close(true));
    } else {
      this.sdk.client
        .newSubject(courseData)
        .then(() => this.dialogRef.close(true));
    }
    this.sidebarService.loadSubjectDatasource();
  }

  public onNoClick(): void {
    this.dialogRef.close(false);
  }
}
