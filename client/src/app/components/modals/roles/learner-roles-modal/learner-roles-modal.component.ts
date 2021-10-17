import { Component, OnInit, Inject, HostBinding } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { SdkService } from 'src/app/services/sdk.service';
import { ISchool, ISegment, ILevel, IClass, IAcademicYear } from '../../../../../../../sdk/interfaces';

@Component({
  selector: 'app-Learner-roles-modal',
  templateUrl: './learner-roles-modal.component.html'
})
export class LearnerRolesModalComponent implements OnInit {
  @HostBinding('class') classes = 'modal_box roles';

  public institutionForm: FormGroup;
  public selectedItems: any;
  public institutionSuggestions: ISchool[];
  public segmentsData: ISegment[] = [];
  public yearsData: ISegment[] = [];
  public levelsData: ILevel[] = [];
  public classesData: IClass[] = [];

  get formValid(): boolean {
    return this.institutionForm.valid && this.institutionForm.dirty;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private formBuilder: FormBuilder,
    private sdk: SdkService,
    public dialogRef: MatDialogRef<LearnerRolesModalComponent>
  ) {}

  ngOnInit() {
    this.selectedItems = this.data.selectedItems;
    this.institutionSuggestions = this.data.autocompleteSuggestions;
    this.institutionForm = this.formBuilder.group({
      school: ['', Validators.required],
      segment: ['', Validators.required],
      level: ['', Validators.required],
      class: ['', Validators.required]
    });

    this.institutionForm.controls.school.valueChanges.subscribe(r => {
      if (r) {
        this.sdk.client
        .getAcademicYears({ schoolId: r.id, limit: -1 })
        .then(data => (this.yearsData = data.list));
        this.sdk.client
          .getSegments({schoolId: r.id})
          .then(data => (this.segmentsData = data.list));
      } else {
        this.segmentsData = [];
        this.levelsData = [];
        this.classesData = [];

        this.institutionForm.controls.segment.reset();
        this.institutionForm.controls.level.reset();
        this.institutionForm.controls.class.reset();
      }
    });
  }

  public transferData(): void {
    this.selectedItems.push({
      class: this.institutionForm.controls.class.value,
      school: this.institutionForm.controls.school.value
    });
    this.dialogRef.close(this.selectedItems);
  }

  public onNoClick(): void {
    this.dialogRef.close();
  }
  public yearSelectionChange(event: IAcademicYear): void {
    this.institutionForm.controls.level.reset();
    this.institutionForm.controls.class.reset();
    this.classesData = [];
    if(this.institutionForm.controls.segment.value){
        this.levelsData = [];
        this.sdk.client.getLevels({ limit: -1, segmentId: this.institutionForm.controls.segment.value.id }).then(data =>
            {
              this.levelsData = data.list.map(level => ({
              ...level,
              selected: false
              }));
          }
        );
      }
  }

  public segmentSelectionChange(event: ISegment): void {
    this.institutionForm.controls.level.reset();
    this.institutionForm.controls.class.reset();
    this.levelsData = [];
    this.classesData = [];
    this.sdk.client.getLevels({ limit: -1, segmentId: event.id }).then(data =>
        (this.levelsData = data.list.map(level => ({
          ...level,
          selected: false
        })))
    );
  }

  public levelSelect(level: any, index: number): void {
    const status = !level.status;
    this.classesData = [];
    this.institutionForm.controls.class.reset();
    this.levelsData.forEach((levelData: any) => (levelData.selected  = false));

    level.selected = status;
    this.institutionForm.controls.level.patchValue(level);

    if (status) {
      this.sdk.client.getClasses({
        limit: -1,
        schoolId: this.institutionForm.controls.school.value.id,
        levelId: level.id,
        yearId:this.institutionForm.controls.year.value.id
      }).then(data => (this.classesData = data.list));
    }
  }

  public classSelectionChange(event: IClass): void {}
}
