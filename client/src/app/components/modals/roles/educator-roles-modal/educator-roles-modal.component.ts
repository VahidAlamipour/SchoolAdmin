import {
  Component,
  OnInit,
  Inject,
  HostBinding,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatSlideToggleChange } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';

import { SdkService } from 'src/app/services/sdk.service';
import { IAcademicYear, ISchool } from '../../../../../../../sdk/interfaces';
import { AddDataModalComponent } from '../../add-data-modal/components/modal/add-data-modal.component';
import { EducatorCoursesModalComponent } from '../educator-courses-modal/educator-course-modal.component';
import {
  fadeAnimation,
  fadeContainerAnimation
} from 'src/app/animations/animations';
import * as moment from 'moment';
import { ScheduleSettingsService } from 'src/app/components/schedule-settings/services/schedule-settings.service';
import { AutoInputComponent } from '../../components/auto-input/component/auto-input.component';


export function atLeastOne(group: FormGroup): { [key: string]: any } {
  let isAtLeastOne = false;
  let count = 0;
  if (group && group.controls) {
    Object.keys(group.controls).forEach(control => {
      const controlValue = group.controls[control].value;
      if (control === 'homeroomEducatorToggle') {
        return;
      }
      if (
        controlValue &&
        controlValue !== null &&
        ((typeof controlValue === 'boolean' && controlValue) ||
          (typeof controlValue === 'object' &&
            controlValue !== null &&
            controlValue.length &&
            controlValue.length !== 0) ||
          (control === 'homeClass' &&
            typeof controlValue === 'object' &&
            controlValue !== null &&
            controlValue.name &&
            controlValue.length &&
            controlValue.length !== 0))
      ) {
        count++;
        if (count >= 1) {
          isAtLeastOne = true;
          return false;
        }
      }
    });
  }
  return isAtLeastOne ? null : { atLeastOne: true };
}

@Component({
  selector: 'app-educator-roles-modal',
  templateUrl: './educator-roles-modal.component.html',
  animations: [fadeAnimation, fadeContainerAnimation],
})
export class EducatorRolesModalComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'modal_box roles';
  homeroomEduDirty: boolean = false;

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

  @ViewChild('homeRoomAutoInputRef', { static: true })
  private homeRoomAutoInputRef: AutoInputComponent;
  public institutionForm: FormGroup;
  public selectedItems: Array<any> = new Array();
  public homeClassesRemovedFromParent: Array<any> = [];

  public institutionSuggestions: Array<ISchool> = new Array();
  public classesSuggestions: Array<any> = new Array();

  private institutionSubscription: Subscription;
  private homeroomEducatorToggleSubscription: Subscription;

  public allAcademicYears: IAcademicYear[] = [];
  public selectedHomeRoomClasses: any[] = [];
  public removed: Array<ISchool> = new Array();
  public compareFn: ((f1: any, f2: any) => boolean) | null = this
    .compareByValue;

  public showDeleteIcon: boolean = false;
  public disableSaveButton: boolean = true;
  get homeroomEducatorToggle(): boolean {
    return this.institutionForm.controls.homeroomEducatorToggle.value;
  }
  get formValid(): boolean {
    if (this.institutionForm.valid && this.institutionForm.dirty) {
      return true
    } else if (this.homeroomEduDirty == true) {
      return true
    } else {
      return false
    }
  }
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private formBuilder: FormBuilder,
    private sdk: SdkService,
    private cookieService: CookieService,
    public schedService: ScheduleSettingsService,
    public dialogRef: MatDialogRef<EducatorRolesModalComponent>
  ) { }

  async ngOnInit() {
    this.institutionForm = this.formBuilder.group(
      {
        school: ['', Validators.required], // school->institution, teacher | with back
        isDirector: [false],
        isCurriculumDirector: [false],
        headOfSubjects: [[]],
        teacherSubjects: [[]],
        homeClass: [[]],
        homeroomEducatorToggle: [false]
      },
      { validator: atLeastOne }
    );
    this.selectedItems = this.data.selectedItems;
    this.homeClassesRemovedFromParent = this.data.homeClassesRemoved;
    this.institutionSuggestions = this.data.autocompleteSuggestions;
    if (this.data.existingData) {
      this.setExistingFunction(
        Object.assign({}, this.data.existingData),
        this.institutionForm.controls
      );
    }
    this.institutionSubscription = this.institutionForm.controls.school.valueChanges.subscribe(
      // with back
      r =>
        r
          ? this.institutionForm.controls.homeroomEducatorToggle.enable()
          : this.institutionForm.controls.homeroomEducatorToggle.disable()
    );
    this.homeroomEducatorToggleSubscription = this.institutionForm.controls.homeroomEducatorToggle.valueChanges.subscribe(
      () => this.institutionForm.controls.homeClass.reset()
    );
  }

  private setExistingFunction(data: any, form: any): void {
    Object.keys(data).forEach(name => {
      if (name === 'homeroomEducatorToggle') {
        return;
      }
      if (name === 'homeClass') {
        this.schedService.selectedHomeRoomClassesArr = [];
        if (data[name]) {
          this.institutionForm.controls.homeroomEducatorToggle.patchValue(true);
          this.institutionForm.controls.homeClass.patchValue(data[name]);
          data[name].forEach((elem) => {
            this.schedService.selectedHomeRoomClassesArr.push(elem)
          });
        }
        return;
      }
      if (form[name]) {
        form[name].patchValue(data[name]);
      }
    });
  }

  public transferData(): void {
    const form = this.institutionForm;
    if (this.data.existingData) {
      this.selectedItems.forEach(item => {
        let index: number;
        if (form.value.school && item.school) {
          if (form.value.school.id === item.school.id) {
            index = this.selectedItems.indexOf(item);
          }
        }
        if (index > -1) {
          this.selectedItems.splice(index, 1);
        }
      });

    }
    if (form.controls.isDirector.value && form.controls.isDirector.disabled) {
      form.value.isDirector = true;
    }
    if (form.controls.isCurriculumDirector.value && form.controls.isCurriculumDirector.disabled) {
      form.value.isCurriculumDirector = true;
    }
    this.schedService.selectedItemsArr.push(form.value);
    this.selectedItems.push(form.value);
    this.dialogRef.close(this.selectedItems);

    // console.log('this.data')
    // console.log(this.data)
    // console.log('form')
    // console.log(form)
    // console.log('this.selectedItems')
    // console.log(this.selectedItems)
  }

  public removeHomeRoomItem(index: number) {
    this.institutionForm.value.homeClass = this.schedService.selectedHomeRoomClassesArr;
    this.homeroomEduDirty = true;
    let removedHomeroomClass = this.schedService.selectedHomeRoomClassesArr[index];
    this.schedService.selectedHomeRoomClassesArr.splice(index, 1);
    this.institutionForm.controls.homeClass.patchValue(this.schedService.selectedHomeRoomClassesArr);
    this.loadClasses(true, removedHomeroomClass);
  }

  public resetForm(): void {
    this.schedService.selectedHomeRoomClassesArr = [];
    this.institutionForm.reset();
  }

  public onNoClick(): void {
    this.dialogRef.close(false);
  }

  public async loadClasses(refresh?: boolean, removedHomeroomClass?: any) {
    let currentYear = moment()
    this.sdk.client.getSchool(this.institutionForm.controls.school.value.id)
      .then(school => {
        this.sdk.client
          .getClasses({
            limit: -1,
            schoolId: this.institutionForm.get('school').value.id,
            yearId: school.activeAcademicYear,
            currentAndFuture: true
          })
          .then(
            res => {
              //bring back the list of deleted home room in change role page  
              if (this.homeClassesRemovedFromParent.length) {
                let hcrIds = this.homeClassesRemovedFromParent.map(x => x.id);
                hcrIds.map(id => {
                  let reclass = res.list.find(x => x.id == id);
                  if (reclass)
                    reclass.teacher = undefined;
                })
              }
              if(!this.schedService.selectedHomeRoomClassesArr && this.schedService.selectedHomeRoomClassesArr.length === 0) {
                this.classesSuggestions = res.list.filter(classs => !classs.teacher);
              } else {
                this.classesSuggestions = res.list.filter(classs => !this.schedService.selectedHomeRoomClassesArr.map(x => x.id).includes(classs.id) && !classs.teacher)
              }
              let init = this.classesSuggestions;
              if (removedHomeroomClass != undefined) {
                this.removed.push(removedHomeroomClass);
                let resultObject = [...init, ...this.removed];
                this.classesSuggestions = resultObject;
                this.classesSuggestions = this.classesSuggestions.reduce(function (a, b) { if (a.indexOf(b) < 0) a.push(b); return a; }, []);
              }
              this.classesSuggestions = this.classesSuggestions.sort(function (a, b) {
                if (a.name && b.name && a.name < b.name) { return -1; }
                if (a.name && b.name && a.name > b.name) { return 1; }
                return 0;
              }).sort(function (a, b) {
                return a.start - b.start
              }).sort(function (a, b) {
                return a.end - b.end
              });
              this.classesSuggestions = this.classesSuggestions.filter((value, index, self) => self.map(x => x.id).indexOf(value.id) === index);
            }
          );
      });
  }

  public homeRoomEduEnabled(event: MatSlideToggleChange) {
    if (event.checked === false) {
      this.schedService.selectedHomeRoomClassesArr = [];
    }
  }

  public educatorCoursesModalData(): any {
    return this.institutionForm.get('school').value.id
      ? { institutionId: this.institutionForm.get('school').value.id }
      : null;
  }

  // function for setting select
  private compareByValue(f1: any, f2: any) {
    return f1 && f2 && f1.name === f2.name;
  }

  public showElementDeleter() {
    const form = this.institutionForm;
    this.disableSaveButton = true;
    let count = 0;
    let isAtLeastOne = false;
    let countAllRoles = 0;
    if (form && form.controls) {
      Object.keys(form.controls).forEach(control => {
        const controlValue = form.controls[control].value;
        if (control === 'homeroomEducatorToggle' || control === 'school') {
          return;
        }
        if (
          controlValue &&
          controlValue !== null &&
          ((typeof controlValue === 'boolean' && controlValue) ||
            (typeof controlValue === 'object' &&
              control != 'homeClass' &&
              controlValue !== null &&
              controlValue.length &&
              controlValue.length > 1) ||
            (typeof controlValue === 'object' &&
              control != 'homeClass' &&
              controlValue !== null &&
              controlValue.length &&
              controlValue.length > 0 &&
              this.schedService.selectedHomeRoomClassesArr &&
              this.schedService.selectedHomeRoomClassesArr.length &&
              this.schedService.selectedHomeRoomClassesArr.length > 0) ||
            (this.schedService.selectedHomeRoomClassesArr &&
              this.schedService.selectedHomeRoomClassesArr.length &&
              this.schedService.selectedHomeRoomClassesArr.length > 1) ||
            this.schedService.selectedHomeRoomClassesArr &&
            this.schedService.selectedHomeRoomClassesArr.length &&
            this.schedService.selectedHomeRoomClassesArr.length > 0 &&
            typeof controlValue === 'object' &&
            control != 'homeClass' &&
            controlValue !== null &&
            controlValue.length &&
            controlValue.length > 0)
        ) {
          count++;
        }
        if (
          controlValue &&
          controlValue !== null &&
          ((typeof controlValue === 'boolean' && controlValue) ||
            (typeof controlValue === 'object' &&
              controlValue !== null &&
              controlValue.length &&
              controlValue.length !== 0) ||
            (control === 'homeClass' &&
              typeof controlValue === 'object' &&
              controlValue !== null &&
              controlValue.name &&
              controlValue.length &&
              controlValue.length !== 0))
        ) {
          countAllRoles++;
        }
      });
      if (this.institutionForm.controls.headOfSubjects.value && this.institutionForm.controls.headOfSubjects.value.length > 0 && this.institutionForm.controls.teacherSubjects.value && this.institutionForm.controls.teacherSubjects.value.length > 0) {
        count++;
      }
      if (count > 0) {
        isAtLeastOne = true;
      }
      if (countAllRoles >= 1) {
        this.disableSaveButton = false;
      }
    }

    this.showDeleteIcon = isAtLeastOne;
    return isAtLeastOne;
  }

  public disableIsDirectorToggle() {
    const form = this.institutionForm;
    let count = 0;
    let isAtLeastOne = false;
    if (form && form.controls) {
      Object.keys(form.controls).forEach(control => {
        const controlValue = form.controls[control].value;
        if (control === 'homeroomEducatorToggle' || control === 'school' || control === 'isDirector') {
          return;
        }

        if (
          controlValue &&
          controlValue !== null &&
          ((typeof controlValue === 'boolean' && controlValue) ||
            (typeof controlValue === 'object' &&
              control != 'homeClass' &&
              controlValue !== null &&
              controlValue.length &&
              controlValue.length > 0) ||
            this.schedService.selectedHomeRoomClassesArr &&
            this.schedService.selectedHomeRoomClassesArr.length &&
            this.schedService.selectedHomeRoomClassesArr.length > 0) ||
          (typeof controlValue === 'string' && controlValue.length !== 0)
        ) {
          count++;
        }
      });
      if (count > 0) {
        isAtLeastOne = true;
      }
    }
    if (!isAtLeastOne && this.institutionForm.controls.isDirector.value) {
      this.institutionForm.get('isDirector').disable();
    }
    if (isAtLeastOne && this.institutionForm.controls.isDirector.value) {
      this.institutionForm.get('isDirector').enable();
    }
  }

  public disableisCurriculumDirectorToggle() {
    if (this.institutionForm.value.isCurriculumDirector) {
      this.institutionForm.get('isCurriculumDirector').enable();
    }
    const form = this.institutionForm;
    let count = 0;
    let isAtLeastOne = false;
    if (form && form.controls) {
      Object.keys(form.controls).forEach(control => {
        const controlValue = form.controls[control].value;
        if (control === 'homeroomEducatorToggle' || control === 'school' || control === 'isCurriculumDirector') {
          return;
        }

        if (
          controlValue &&
          controlValue !== null &&
          ((typeof controlValue === 'boolean' && controlValue) ||
            (typeof controlValue === 'object' &&
              control != 'homeClass' &&
              controlValue !== null &&
              controlValue.length &&
              controlValue.length > 0) ||
            this.schedService.selectedHomeRoomClassesArr &&
            this.schedService.selectedHomeRoomClassesArr.length &&
            this.schedService.selectedHomeRoomClassesArr.length > 0) ||
          (typeof controlValue === 'string' && controlValue.length !== 0)
        ) {
          count++;
        }
      });
      if (count > 0) {
        isAtLeastOne = true;
      }
    }
    if (!isAtLeastOne && this.institutionForm.controls.isCurriculumDirector.value) {
      this.institutionForm.get('isCurriculumDirector').disable();
    }
    if (isAtLeastOne && this.institutionForm.controls.isCurriculumDirector.value) {
      this.institutionForm.get('isCurriculumDirector').enable();
    }
  }

  ngOnDestroy() {
    this.resetForm();
    this.institutionSubscription.unsubscribe();
    this.homeroomEducatorToggleSubscription.unsubscribe();
  }
}
