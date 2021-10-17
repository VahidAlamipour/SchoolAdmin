import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material';

import { LayoutService } from 'src/app/services/layout.service';
import {
  IClass,
  ITeacherRole,
  ITeacherSubject
} from '../../../../../../../../sdk/interfaces';
import { UserRoleElement } from '../../../models/interfaces.modal';
import { EducatorRolesModalComponent } from 'src/app/components/modals/roles/educator-roles-modal/educator-roles-modal.component';
import { ScheduleSettingsService } from 'src/app/components/schedule-settings/services/schedule-settings.service';
import { union } from 'lodash';

@Component({
  selector: 'educators-block',
  templateUrl: './educators-block.component.html'
})
export class EducatorsBlockComponent implements OnInit {
  @Input()
  public label: string;
  @Input()
  public buttonLabel: string;
  @Input()
  public parentForm: FormGroup;
  @Input()
  public formName: string;

  @Input()
  public editableIds: number[];
  @Input()
  private autocompleteSuggestions: any[];
  @Input()
  private additionalData: any;
  public c: number

  private homeClassesRemoved : any[] =[];

  private controls = ['students', 'teacherRoles', 'adminRoles', 'accountRoles', 'learnerRoles'];

  public educatorModalConfig = {
    modal: EducatorRolesModalComponent,
    title: 'Add roles of educator',
    saveButtonText: 'save'
  };

  constructor(private dialog: MatDialog, private layout: LayoutService, private schedService: ScheduleSettingsService) { }

  ngOnInit() {
    this[this.formName] = new FormControl([]);
    this.parentForm.addControl(this.formName, this[this.formName]);
    //this.getRolesBlockByForm();
  }

  public editDataModal(existData?: any): void {
    this.layout.blurWrapContainer();
    const addDataModal = this.dialog.open(this.educatorModalConfig.modal, {
      panelClass: ['modal'],
      autoFocus: false,
      data: {
        ...this.educatorModalConfig,
        ...(existData ? { existingData: Object.assign({}, existData) } : null),
        ...(this.additionalData
          ? { additionalData: Object.assign({}, this.additionalData) }
          : null),
        ...(this.autocompleteSuggestions
          ? {
            autocompleteSuggestions: Array.from(this.autocompleteSuggestions)
          }
          : null),
        selectedItems: this.parentForm.get(this.formName).value
          ? Array.from(this.parentForm.get(this.formName).value)
          : [],
        homeClassesRemoved:this.homeClassesRemoved
      }
    });
    addDataModal.beforeClosed().subscribe({
      next: result => {
        this.layout.unblurWrapContainer();
        if (result) {
          this.updateFormControl(result);
        }
      }
    });
  }

  public removeItem(index: number): void {
    const formArray = Array.from(this.parentForm.controls[this.formName].value);
    if (index >= 0) {
      formArray.splice(index, 1);
    }
    this.updateFormControl(formArray);
  }

  private updateFormControl(data: any) {
    this.parentForm.controls[this.formName].patchValue(data);
    this.parentForm.controls[this.formName].markAsDirty();
    this.parentForm.controls[this.formName].updateValueAndValidity();
  }

  public removeRolesBlock(
    item: UserRoleElement,
    index: number,
    elementIndex: number
  ): void {
    const roleData = this.parentForm.controls[this.formName].value;

    if (item.code === 'teacherSubjects' || item.code === 'headOfSubjects' || item.code === 'homeClass') {
      if (item.code === 'homeClass') {
        this.homeClassesRemoved.push(roleData[index][item.code][elementIndex])
      }
      roleData[index][item.code].splice(elementIndex, 1);
      if (roleData[index][item.code].length === 0) {
        delete roleData[index][item.code];
      }
    } else {
      delete roleData[index][item.code];
    }
    Object.keys(roleData[index]).length <= 1
      ? this.removeItem(index)
      : this.updateFormControl(roleData);
  }

  public getRolesBlock(chips: ITeacherRole): UserRoleElement[] {
    const roles: UserRoleElement[] = new Array();
    if (chips.hasOwnProperty('isDirector')) {
      if (chips.isDirector) {
        roles.push({
          title: 'director',
          code: 'isDirector',
          roles: [{ name: 'Director' }]
        });
      } else {
        delete chips.isDirector;
      }
    }
    if (chips.hasOwnProperty('isCurriculumDirector')) {
      if (chips.isCurriculumDirector) {
        roles.push({
          title: 'curriculum director',
          code: 'isCurriculumDirector',
          roles: [{ name: 'Curriculum director' }]
        });
      } else {
        delete chips.isCurriculumDirector;
      }
    }
    if (chips.headOfSubjects && chips.headOfSubjects.length !== 0) {
      roles.push({
        title: 'head of department',
        code: 'headOfSubjects',
        roles: chips.headOfSubjects
      });
    }

    if (chips.homeClass) {
      roles.push({
        title: 'homeroom educator',
        code: 'homeClass',
        roles: [

          ...chips.homeClass,
          // name: chips.homeClass[0].showName
          //   ? chips.homeClass[0].name
          //   : `${chips.homeClass[0].level.name}${chips.homeClass[0].name}`

        ]
      });
    }

    if (chips.teacherSubjects && chips.teacherSubjects.length !== 0) {
      roles.push({
        title: 'educator',
        code: 'teacherSubjects',
        roles: chips.teacherSubjects
      });
    }
    return roles;
  }

  public getEducatorsRoleElement(teacherSubject: ITeacherSubject): string {
    return `${teacherSubject.subject.name} (${teacherSubject.levels
      .map(level => level.name)
      .join(', ')} ${teacherSubject.levels.length > 1 ? 'levels' : 'level'})`;
  }

  public isEditable(index: number): boolean {
    return this.editableIds && this.editableIds.length
      ? this.editableIds.includes(
        this.parentForm.controls[this.formName].value[index].school.id
      )
      : true;
  }

  public canBeAdded(): boolean {
    return this.autocompleteSuggestions
      ? this.autocompleteSuggestions.length !== 0
      : true;
  }

  public showBlockDeleter(): boolean {
    return this.controls.map(
      elementOfControls => {
        return this.parentForm.controls[elementOfControls] &&
          this.parentForm.controls[elementOfControls].value ?
          this.parentForm.controls[elementOfControls].value.length : 0;
      }
    ).reduce((a, b) => a + b, 0) > 1;
  }

  public showElementDeleter(data): boolean {
    // return Boolean([
    //   !!data.isDirector,
    //   !!data.isCurriculumDirector,
    //   !!data.homeClass,
    //   !!(data.headOfSubjects && data.headOfSubjects.length),
    //   !!(data.teacherSubjects && data.teacherSubjects.length)
    // ].filter(element => element).length > 1);
    return (data.isDirector && ((data.headOfSubjects && data.headOfSubjects.length) || (data.homeClass && data.homeClass.length) || (data.teacherSubjects && data.teacherSubjects.length) || data.isCurriculumDirector) ? true : false) ||
      (data.isCurriculumDirector && ((data.headOfSubjects && data.headOfSubjects.length) || (data.homeClass && data.homeClass.length) || (data.teacherSubjects && data.teacherSubjects.length) || data.isDirector) ? true : false) ||
      (((!data.headOfSubjects || !data.headOfSubjects.length) && (!data.teacherSubjects || !data.teacherSubjects.length)) ? data.homeClass && data.homeClass.length && data.homeClass.length > 1 : data.homeClass && data.homeClass.length > 0) ||
      (((!data.homeClass || !data.homeClass.length) && (!data.teacherSubjects || !data.teacherSubjects.length)) ? data.headOfSubjects && data.headOfSubjects.length && data.headOfSubjects.length > 1 : data.headOfSubjects && data.headOfSubjects.length > 0) ||
      (((!data.homeClass || !data.homeClass.length) && (!data.headOfSubjects || !data.headOfSubjects.length)) ? data.teacherSubjects && data.teacherSubjects.length && data.teacherSubjects.length > 1 : data.teacherSubjects && data.teacherSubjects.length > 0);
  }

  public homeRoomTextMaker(element): string {
    return `${element.start} - ${element.end} - ${element.segment ? element.segment.name : element.segmentname} - Level ${element.level.name}`;
  }
}