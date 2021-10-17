import {
  Component,
  OnInit,
  Input,
  SimpleChanges,
  OnChanges
} from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material';

import { LayoutService } from 'src/app/services/layout.service';
import { ITeacherRole, IClass } from '../../../../../../../../sdk/interfaces';

@Component({
  selector: 'chips-block',
  templateUrl: './chips-block.component.html'
})
export class ChipsBlockComponent implements OnInit, OnChanges {
  @Input()
  private modalConfig: any;
  @Input()
  public label: string;
  @Input()
  public buttonLabel: string;
  @Input()
  public parentForm: FormGroup;
  @Input()
  public formName: string;
  @Input()
  public readonly = false;
  @Input()
  public disabled = false;
  private initDisable: boolean;
  @Input()
  public required = false;
  @Input()
  private editable = false;
  @Input()
  public editableIds: number[];
  @Input()
  private autocompleteSuggestions: any[];
  @Input()
  private additionalData: any;
  private controls = ['students', 'teacherRoles', 'adminRoles', 'accountRoles', 'learnerRoles'];
  @Input()
  public showRemoveIcon = true;

  constructor(private dialog: MatDialog, private layout: LayoutService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.disabled) {
      if (this.initDisable && !changes.disabled.currentValue) {
        this.parentForm.controls[this.formName].enable();
      } else if (this.initDisable && changes.disabled.currentValue) {
        this.parentForm.controls[this.formName].disable();
      }
    }
  }

  ngOnInit() {
    this.required
      ? (this[this.formName] = new FormControl([], Validators.required))
      : (this[this.formName] = new FormControl([]));
    this.parentForm.addControl(this.formName, this[this.formName]);
  }

  public addDataModal(existData?: any): void {
    this.layout.blurWrapContainer();
    const addDataModal = this.dialog.open(this.modalConfig.modal, {
      panelClass: ['modal', ...(this.modalConfig.panelClass || null)],
      autoFocus: false,
      data: {
        ...this.modalConfig,
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
          : []
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

  // generate chips titles

  public chipsTitle(item: any): string {
    switch (this.formName) {
      case 'teacherRoles':
      case 'adminRoles':
        return this.rolesItem(item);
      case 'accountRoles':
        return this.accountRolesItem(item);
      case 'teacherSubjects':
        return this.courseItem(item);
      case 'learnerRoles':
        return this.learnerItem(item);
      default:
        return this.nameItem(item);
    }
  }

  private learnerItem(item: any): string {
    return `Institution ${item.school.name}, ${item.school.city.name}.`;
    // return `Institution ${item.school.name}, ${item.school.city.name}. \n
    //   ${item.class.level.name} ${item.class.name}`;
  }

  private courseItem(item: any): string {
    return `${item.subject.name}`;
  }

  private nameItem(item: any): string {
    return `${item.name}${item.lastName ? ' ' + item.lastName : ''}`;
  }

  private rolesItem(item: ITeacherRole): string {
    const roles: string[] = new Array();
    if (item.isDirector) {
      roles.push('director');
    }
    if (item.isCurriculumDirector) {
      roles.push('curriculum director');
    }
    if (item.headOfSubjects && item.headOfSubjects.length !== 0) {
      const tempSubjects = item.headOfSubjects.map(tSubject => tSubject.name);
      roles.push(`head of department (${tempSubjects.join(', ')})`);
    }
    if (item.teacherSubjects && item.teacherSubjects.length !== 0) {
      const tempSubjects = [];
      item.teacherSubjects.forEach(tSubject => {
        const tempSubject = `${tSubject.subject.name} (${tSubject.levels
          .map(level => level.name)
          .join(', ')} levels)`;
        tempSubjects.push(tempSubject);
      });
      roles.push(`educator of ${tempSubjects.join('; ')}`);
    }
    if (item.homeClass) {
      item.homeClass.forEach(
        (homeClassElem: IClass) => {
          let homeClassString: string;
          if (homeClassElem.showName) {
            homeClassString = `${homeClassElem.name}`;
          } else {
            homeClassString = `${homeClassElem.level.name}${homeClassElem.name}`;
          }
          roles.push(`homeroom educator of ${homeClassString} class`);
        }
      )

    }
    if (item.school) {
      // school->institution | with back
      return `Institution ${item.school.name}, ${item.school.city.name}. \n
              ${roles.length !== 0 ? 'Roles: ' + roles.join(', ') + '.' : ''}`;
    } else {
      return;
    }
  }

  private accountRolesItem(item: { role: string }): string {
    switch (item.role) {
      case 'isDirector':
        return 'Director';
      case 'isCurriculumDirector':
        return 'Curriculum director';
    }
  }

  public isEditable(index: number): boolean {
    if (this.formName === 'students') {
      const id = this.parentForm.controls[this.formName].value[index]
        .educationalClass.schoolId;
      return this.editableIds.includes(id);
    }
    if (this.editableIds && this.editableIds.length) {
      const id = this.parentForm.controls[this.formName].value[index].school.id;
      return this.editable && this.editableIds.includes(id);
    }
    return this.readonly ? false : this.editable;
  }

  public canBeAdded(): boolean {
    if (this.formName === 'accountRoles') {
      return this.parentForm.controls[this.formName].value.length <= 1;
    }
    return this.autocompleteSuggestions
      ? this.autocompleteSuggestions.length !== 0
      : true;
  }

  public editItemClick(item: any): void {
    this.addDataModal(item);
  }

  showDeleteElements(): boolean {
    if (this.controls.filter(elementOfControls => elementOfControls === this.formName).length) {
      return this.controls.map(
        elementOfControls => {
          return this.parentForm.controls[elementOfControls] &&
          this.parentForm.controls[elementOfControls].value ?
            this.parentForm.controls[elementOfControls].value.length : 0;
        }
      ).reduce((a, b) => a + b, 0) > 1;
    } else {
      return true;
    }
  }
}