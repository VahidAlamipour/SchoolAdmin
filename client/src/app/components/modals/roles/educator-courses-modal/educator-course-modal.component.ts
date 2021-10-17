import { Component, OnInit, Inject, HostBinding } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { FormBuilder, Validators } from '@angular/forms';

import { SdkService } from 'src/app/services/sdk.service';
import { ISchool, ISegment, ILevel } from '../../../../../../../sdk/interfaces';
import {
  fadeAnimation,
  fadeContainerAnimation
} from 'src/app/animations/animations';

@Component({
  selector: 'app-educator-course-modal',
  templateUrl: './educator-course-modal.component.html',
  animations: [fadeAnimation, fadeContainerAnimation]
})
export class EducatorCoursesModalComponent implements OnInit {
  @HostBinding('class') classes = 'modal_box roles';

  public selectedItems: any[];

  private loadCoursesTimes = 0;
  public coursesSuggestions: ISchool[] = [];

  private institutionId: number;
  public segmentsData: ISegment[];
  public allLevels: ILevel[] = [];
  public selectedLevels: ILevel[] = [];

  public detailsForm = this.formBuilder.group({
    levels: [[], Validators.required]
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private formBuilder: FormBuilder,
    private sdk: SdkService,
    public dialogRef: MatDialogRef<EducatorCoursesModalComponent>
  ) {
    this.institutionId = data.additionalData.institutionId;
  }

  ngOnInit() {
    this.selectedItems = this.data.selectedItems ? this.data.selectedItems : [];
    this.sdk.client
      .getSegments({
        schoolId: this.institutionId ? this.institutionId : null
      })
      .then(data => (this.segmentsData = data.list));
  }

  public loadCourses(): void {
    const params = {
      limit: -1
    };
    if (this.loadCoursesTimes === 0) {
      this.sdk.client
        .getSubjects(params)
        .then(res => (this.coursesSuggestions = res.list));
    }
  }

  public segmentSelectionChange(event: ISegment): void {
    this.detailsForm.controls.levels.reset();
    this.selectedLevels = [];
    this.sdk.client.getLevels({ limit: -1, segmentId: event.id }).then(
      data =>
        (this.allLevels = data.list.map(level => ({
          ...level,
          selected: false
        })))
    );
  }

  public levelSelect(level: any, index: number): void {
    if (level.selected) {
      level.selected = false;
      if (index >= 0) {
        this.selectedLevels.splice(index, 1);
      }
    } else {
      level.selected = true;
      this.selectedLevels.push(level);
    }
    this.detailsForm.controls.levels.patchValue(this.selectedLevels);
  }

  public onSubmitFormDetails(): void {
    this.transferData(this.detailsForm);
  }

  private transferData(form: any): void {
    this.selectedItems.push(form.value);
    this.dialogRef.close(this.selectedItems);
  }

  public onNoClick(): void {
    this.dialogRef.close();
  }
}
