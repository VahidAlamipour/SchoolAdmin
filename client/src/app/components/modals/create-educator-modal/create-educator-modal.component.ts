import { Component, OnInit, Inject, HostBinding } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog, MatSlideToggleChange } from '@angular/material';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CookieService } from 'ngx-cookie-service';
import * as moment from 'moment';

import { SdkService } from 'src/app/services/sdk.service';
import { NotificationsService } from 'src/app/components/notifications/services/notifications.service';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';
import { AddDataModalComponent } from '../add-data-modal/components/modal/add-data-modal.component';
import { EducatorCoursesModalComponent } from '../roles/educator-courses-modal/educator-course-modal.component';
import { ITeacher, ISchool } from '../../../../../../sdk/interfaces';
import { fadeAnimation, fadeContainerAnimation } from 'src/app/animations/animations';
import { ScheduleSettingsService } from '../../schedule-settings/services/schedule-settings.service';

export function atLeastOne(group: FormGroup): { [key: string]: any } {
  let isAtLeastOne = false;
  if (group && group.controls) {
    Object.keys(group.controls).forEach((control) => {
      const controlValue = group.controls[control].value;
      if (
        (controlValue && controlValue !== null && typeof controlValue === 'boolean' && controlValue) ||
        (typeof controlValue === 'object' && controlValue.length !== 0) ||
        (typeof controlValue === 'string' && controlValue.length !== 0)
      ) {
        isAtLeastOne = true;
        return false;
      }
    });
  }
  return isAtLeastOne ? null : { atLeastOne: true };
}

@Component({
  selector: 'app-create-educator-modal',
  templateUrl: './create-educator-modal.component.html',
  animations: [fadeContainerAnimation, fadeAnimation]
})
export class CreateEducatorModalComponent implements OnInit {
  @HostBinding('class') classes = 'modal_box';
  public editMode: boolean;
  public headOfDepartmentModalConfig = {
    modal: AddDataModalComponent,
    searchPlaceholder: 'Enter course name',
    canBeEmpty: true,
    addButtonTitle: 'Save changes',
    addingDataName: 'courses'
  };

  public educatorCoursesModalConfig = {
    modal: EducatorCoursesModalComponent,
    title: 'Add course',
    saveButtonText: 'Add'
  };

  public detailsForm = this.formBuilder.group({});
  public classesSuggestions: Array<ISchool> = new Array();

  get institutionId(): number {
    return +this.cookieService.get('schoolId');
  }

  get homeroomEducatorToggle(): boolean {
    return this.detailsForm.controls.homeroomEducatorToggle.value;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private formBuilder: FormBuilder,
    private sdk: SdkService,
    private notificationsService: NotificationsService,
    private cookieService: CookieService,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<CreateEducatorModalComponent>,
    private schedService: ScheduleSettingsService
  ) { }

  ngOnInit() {
    if (this.data && this.data.existing) {
      this.editMode = true;
      this.setExistingData();
    } else {
      this.detailsForm = this.formBuilder.group({
        homeroomEducatorToggle: [false],
        roles: this.formBuilder.group(
          {
            isDirector: [false],
            isCurriculumDirector: [false],
            headOfSubjects: [[]],
            teacherSubjects: [[]],
            homeClass: [[]]
          },
          { validator: atLeastOne }
        )
      });
      this.detailsForm.controls.homeroomEducatorToggle.valueChanges.subscribe((res) => {
        if (!res) {
          this.detailsForm.controls.roles['controls']['homeClass'].patchValue('');
        }
      });
    }
  }

  private setExistingData(): void {
    this.sdk.client.getTeacher(this.data.existing.id).then((data) => {
      const form = this.detailsForm.controls;
      Object.keys(data).forEach((name) => {
        if (form[name]) {
          form[name].patchValue(data[name], { onlySelf: true });
        }
        if (name === 'birthday') {
          form['initBirthday'].patchValue(data[name], { onlySelf: true });
        }
        if (name === 'homeClass') {
          this.schedService.selectedHomeRoomClassesArr = [];
        }
      });
    });
  }

  public onSubmitFormDetails(form: any): void {
    const birthday = moment({
      year: moment(form.initBirthday).year(),
      month: moment(form.initBirthday).month(),
      day: moment(form.initBirthday).date()
    });
    const educatorData: ITeacher = {
      ...form,
      ...(form.initBirthday ? { birthday: birthday.format('YYYY-MM-DD') } : { birthday: null })
    };

    const requestFunction: () => Promise<any> = () =>
      this.data.existing
        ? this.sdk.client.updateTeacher(this.data.existing.id, educatorData)
        : this.sdk.client.newTeacher({
          ...educatorData,
          ...this.onSubmitRoles()
        });

    requestFunction().then(() => {
      this.notificationsService.notifyUser({
        message: `Educator has been successfully ${this.data.existing ? 'updated' : 'created'}`,
        type: 'success'
      });
      this.dialogRef.close({ needToUpdate: true });
    });
  }

  public onSubmitRoles() {
    const form = this.detailsForm.value.roles;
    const tRoles = {
      // school || branch
      schoolId: this.institutionId,

      // is director
      isDirector: form.isDirector,
      // is curriculum director
      isCurriculumDirector: form.isCurriculumDirector,
      // head of department
      ...(form.headOfSubjects
        ? {
          headOfSubjectsIds: form.headOfSubjects.map((subject) => subject.id)
        }
        : null),
      // educatorCourses
      ...(form.teacherSubjects
        ? {
          teacherSubjects: this.educatorCoursesData(form.teacherSubjects)
        }
        : null),
      // home class
      ...(form.homeClass
        ? {
          // homeClassId: form.homeClass.id
          homeClassId: form.homeClass.map(
            homeClass => (homeClass.id)
          )
        }
        : null)
    };
    return tRoles;
  }

  private educatorCoursesData(educatorCourses: any[]): any[] {
    const tempCourses = [];
    educatorCourses.forEach((course) =>
      tempCourses.push({
        levelsIds: course.levels.map((level) => level.id),
        subjectId: course.subject.id
      })
    );
    return tempCourses;
  }

  // public loadClasses(): void {
  //   let schoolid = +this.cookieService.get('schoolId');
  //   this.sdk.client.getSchool(schoolid).then(school => {
  //     //debugger;
  //     this.sdk.client.getClasses({
  //       limit: -1,
  //       schoolId: school.id,
  //       yearId: school.activeAcademicYear
  //     }).then((res) => (this.classesSuggestions = res.list));
  //   });
  // }

  public async loadClasses() {
    let schoolid = +this.cookieService.get('schoolId');
    let currentYear = moment()
    this.sdk.client.getSchool(schoolid)
      .then(school => {
        this.sdk.client
          .getClasses({
            limit: -1,
            schoolId: school.id,
            yearId: school.activeAcademicYear,
            currentAndFuture: true
          })
          .then(
            res =>
              (this.classesSuggestions = res.list)
          );
      });
  }
 
  
  public homeRoomEduEnabled(event: MatSlideToggleChange) {
    if (event.checked === false) {
      this.schedService.selectedHomeRoomClassesArr = [];
    }
  }


  public educatorCoursesModalData(): any {
    return this.institutionId ? { institutionId: this.institutionId } : null;
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
        data: { title: 'Are you sure you want to delete this educator?' }
      });
      confirmModal.beforeClosed().subscribe({
        next: (result) =>
          result
            ? this.sdk.client
              .deleteTeacher(this.data.existing.id)
              .then(() => this.dialogRef.close({ needToUpdate: true, delete: true }))
            : (this.classes = 'modal_box')
      });
    }, 300);
  }

  public onNoClick(): void {
    this.schedService.selectedHomeRoomClassesArr = [];
    this.dialogRef.close({ needToUpdate: false });
  }
}
