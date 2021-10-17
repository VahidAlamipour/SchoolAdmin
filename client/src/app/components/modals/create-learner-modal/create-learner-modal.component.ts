import { Component, OnInit, Inject, HostBinding, AfterViewInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import * as moment from 'moment';

import { SdkService } from 'src/app/services/sdk.service';
import { NotificationsService } from 'src/app/components/notifications/services/notifications.service';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';
import { AddDataModalComponent } from '../add-data-modal/components/modal/add-data-modal.component';
import { VALIDATION_MESSAGES } from '../components/validation_messages';
import { IStudent, IParent, ISegment, ILevel, IStructure, IClass } from '../../../../../../sdk/interfaces';

@Component({
  selector: 'app-create-learner-modal',
  templateUrl: './create-learner-modal.component.html'
})
export class CreateLearnerModalComponent implements OnInit, AfterViewInit {
  @HostBinding('class') classes = 'modal_box';

  public parentsModalConfig = {
    modal: AddDataModalComponent,
    searchPlaceholder: 'Enter phone number, last name or first name',
    addButtonTitle: 'Save changes',
    canBeEmpty: true,
    addingDataName: 'parents'
  };

  public validation_messages = VALIDATION_MESSAGES;

  public gendersData = ['male', 'female'];
  public segmentsData: ISegment[];
  public levelsData: ILevel[];
  public classsData: IClass[];

  public routerInfo: Router;
  public SLCBlockVisible: boolean;

  public detailsForm = this.formBuilder.group({});

  public removable = true;

  constructor(
    private formBuilder: FormBuilder,
    private sdk: SdkService,
    private notificationsService: NotificationsService,
    private dialog: MatDialog,
    private router: Router,
    public dialogRef: MatDialogRef<CreateLearnerModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data
  ) {
    this.routerInfo = router;
  }

  ngOnInit() {
    if (this.data && this.data.existing) {
      this.setExistingData();
    }
    this.sdk.client.getSchoolStructure().then((res) => (this.segmentsData = res.segments));
    //this.SLCBlockVisible = !(this.routerInfo.url === '/learners' && !this.data.existing);
    this.SLCBlockVisible = false;
  }

  ngAfterViewInit() {
    if (this.detailsForm.controls.initBirthday && this.detailsForm.controls.age) {
      const birthdaySubscription = this.detailsForm.controls.initBirthday.valueChanges.subscribe({
        next: (bd) =>
          this.detailsForm.controls.age.patchValue(
            moment().diff(moment(bd), 'years') ? moment().diff(moment(bd), 'years') : ''
          ),
        complete: () => birthdaySubscription.unsubscribe()
      });
    }
  }

  public segmentSelectionChange(event: ISegment): void {
    this.detailsForm.controls.level.reset();
    this.detailsForm.controls.class.reset();
    this.classsData = null;
    this.sdk.client.getLevels({ segmentId: event.id }).then((res) => (this.levelsData = res.list));
  }

  public levelSelectionChange(event: ILevel): void {
    this.detailsForm.controls.class.reset();
    let yearSelected = +localStorage.getItem('yearSelected');
    this.sdk.client.getClasses({ levelId: event.id, yearId: yearSelected }).then((res) => (this.classsData = res.list));
  }

  private setExistingData(): void {
    this.sdk.client.getStudent(this.data.existing).then((data: IStudent) => {
      const form = this.detailsForm.controls;
      this.sdk.client.getSchoolStructure().then((structure: IStructure) => {
        structure.segments.forEach((segment) =>
          segment.levels.forEach((level) => {
            if (level === data.educationalClass.levelId) {
              this.segmentSelectionChange(segment);
              form.segment.patchValue(segment, { onlySelf: true });
            }
          })
        );
        structure.levels.forEach((level) => {
          if (level.id === data.educationalClass.levelId) {
            this.levelSelectionChange(level);
            form.level.patchValue(level, { onlySelf: true });
            form.class.patchValue(data['educationalClass'], {
              onlySelf: true
            });
          }
        });
      });
      Object.keys(data).forEach((name) => {
        if (form[name]) {
          form[name].patchValue(data[name], { onlySelf: true });
        }
        if (name === 'birthday') {
          form['initBirthday'].patchValue(data[name], { onlySelf: true });
        }
      });
    });
  }

  public onSubmitFormDetails(form: any): void {
    const parentsArray = this.detailsForm.get('parents').value;
    const educationalClassId: number = this.SLCBlockVisible
      ? this.detailsForm.get('class').value.id
      : +localStorage.getItem('classSelected');

    const birthday = moment({
      year: moment(form.initBirthday).year(),
      month: moment(form.initBirthday).month(),
      day: moment(form.initBirthday).date()
    });

    const learnerData: IStudent = {
      ...form,
      ...(form.initBirthday ? { birthday: birthday.format('YYYY-MM-DD') } : { birthday: null }),
      educationalClassId: educationalClassId,
      parentsIds: parentsArray.map((parent: IParent) => parent.id)
    };

    const requestFunction = () =>
      this.data.existing
        ? this.sdk.client.updateStudent(this.data.existing, learnerData)
        : this.sdk.client.newStudent(learnerData);

    requestFunction().then(() => {
      this.notificationsService.notifyUser({
        message: `Learner has been successfully ${this.data.existing ? 'updated' : 'created'}`,
        type: 'success'
      });
      this.dialogRef.close({ needToUpdate: true });
    });
  }

  public onDeleteClick(): void {
    this.classes = 'modal_box collapse';
    setTimeout(() => {
      const confirmModal = this.dialog.open(ConfirmationModalComponent, {
        panelClass: ['modal', 'confirm'],
        backdropClass: 'hide',
        autoFocus: false,
        restoreFocus: false,
        role: 'alertdialog',
        data: { title: 'Are you sure you want to delete this learner?' }
      });
      confirmModal.beforeClosed().subscribe({
        next: (result) => {
          result
            ? this.sdk.client
              .deleteStudent(this.data.existing)
              .then(() => {
                this.dialogRef.close({ needToUpdate: true, delete: true })
                this.notificationsService.notifyUser({
                  message: 'Learner has been successfully deleted',
                  type: 'success'
                });
              })
            : (this.classes = 'modal_box');


        }
      });
    }, 300);
  }

  public onNoClick(): void {
    this.dialogRef.close({ needToUpdate: false });
  }
}
