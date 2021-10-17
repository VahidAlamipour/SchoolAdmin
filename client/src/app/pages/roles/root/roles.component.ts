import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, Data, Params } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';

import { SdkService } from 'src/app/services/sdk.service';
import { AuthService } from 'src/app/auth/auth.service';
import { AdminRolesModalComponent } from 'src/app/components/modals/roles/admin-roles-modal/admin-roles-modal.component';
import { LearnerRolesModalComponent } from 'src/app/components/modals/roles/learner-roles-modal/learner-roles-modal.component';
import { AccountRolesModalComponent } from 'src/app/components/modals/roles/account-roles-modal/account-roles-modal.component';
import { AddDataModalComponent } from 'src/app/components/modals/add-data-modal/components/modal/add-data-modal.component';
import {
  ITeacherRole,
  IStudent,
  ISchool,
  IAccountRole,
  ILearnerRoleFromClient,
} from '../../../../../../sdk/interfaces';
import { UserRoles } from '../models/interfaces.modal';
import { SLCService } from '../../../components/slc-selector/slc-selector.service';

@Component({
  selector: 'app-roles',
  templateUrl: './roles.component.html'
})
export class RolesComponent implements OnInit {
  public parentModalConfig = {
    modal: AddDataModalComponent,
    searchPlaceholder: 'Enter phone number, last name or first name',
    addButtonTitle: 'Add learners',
    addingDataName: 'learners'
  };
  public adminModalConfig = {
    modal: AdminRolesModalComponent,
    title: 'Add administrator role',
    saveButtonText: 'save'
  };
  public accountModalConfig = {
    modal: AccountRolesModalComponent,
    panelClass: 'noheight',
    title: 'Add account role',
    saveButtonText: 'save'
  };

  public learnerModalConfig = {
    modal: LearnerRolesModalComponent,
    title: 'Add learner role',
    saveButtonText: 'save'
  };

  public pageMode: string;
  public pageTitle: string;
  private userId: number;

  public userRoles: UserRoles;

  public rolesForm: FormGroup = this.formBuilder.group({
    students: [],
    teacherRoles: [],
    adminRoles: [],
    accountRoles: [],
    learnerRoles: []
  });

  private allInstitutions: ISchool[];
  public editableInstitutionsIds: number[];

  private _uploading = new BehaviorSubject<boolean>(false);
  public uploading$ = this._uploading.asObservable();

  get formValid(): boolean {
    return this.rolesForm.valid && this.rolesForm.dirty;
  }

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private ar: ActivatedRoute,
    private sdk: SdkService,
    public authService: AuthService,
    private SLCService: SLCService,
  ) {
    ar.data.subscribe({
      next: (d: Data) => (
        (this.userRoles = d.preload.userRoles),
        (this.allInstitutions = d.preload.allInstitutions)
      )
    });
    ar.params.subscribe({
      next: (p: Params) => {
        this.pageMode = p.pageMode;
        this.userId = p.id;
        this.pageTitle =
          p.pageMode === 'staff' ? 'administrator' : p.pageMode.slice(0, -1);
      }
    });
    this.editableInstitutionsIds = authService.isAccountAdmin
      ? null
      : authService.localData.access.schoolsId;
    this.setRoles();
  }

  ngOnInit(): void {}

  private setRoles(): void {
    const form = this.rolesForm.controls;
    const data = {
      ...this.userRoles,
      ...{
        accountRoles: Object.keys(this.userRoles.accountRoles).reduce(
          (res, item) => {
            if (this.userRoles.accountRoles[item]) {
              res.push({ role: item });
            }
            return res;
          },
          []
        )
      }
    };
    Object.keys(data).forEach(name => {
      if (form[name]) {
        form[name].patchValue(data[name]);
      }
    });
  }

  private educatorCoursesData(educatorCourses: any[]): any[] {
    const tempCourses = [];
    educatorCourses.forEach(course =>
      tempCourses.push({
        levelsIds: course.levels.map(level => level.id),
        subjectId: course.subject.id
      })
    );
    return tempCourses;
  }

  public onSubmitRoles() {
    this._uploading.next(true);
    const form = this.rolesForm.value;
    const educatorRoles = [];
    form.teacherRoles.forEach((educatorRole: ITeacherRole) =>
      educatorRoles.push({
        schoolId: educatorRole.school.id, /// with back
        // is director
        isDirector: educatorRole.isDirector,
        // is curriculum director
        isCurriculumDirector: educatorRole.isCurriculumDirector,
        // head of department
        ...(educatorRole.headOfSubjects
          ? {
              headOfSubjectsIds: educatorRole.headOfSubjects.map(
                subject => subject.id
              )
            }
          : null),
        // educatorCourses
        ...(educatorRole.teacherSubjects
          ? {
              teacherSubjects: this.educatorCoursesData(
                educatorRole.teacherSubjects
              )
            }
          : null),
        // home class
        ...(educatorRole.homeClass
          ? {
              homeClassId: educatorRole.homeClass.map(
                homeClass => (homeClass.id)
              )
            }
          : null)
      })
    );
    const rolesData: {
      studentsIds: number[];
      teacherRoles: ITeacherRole[];
      accountRole?: IAccountRole;
      adminSchoolsIds?: number[];
      learnerRoles?: ILearnerRoleFromClient[];
    } = {
      studentsIds: form.students.map((learner: IStudent) => learner.id),
      teacherRoles: educatorRoles,
      ...(this.authService.isAccountAdmin
        ? {
            adminSchoolsIds: form.adminRoles ? form.adminRoles.map((role: any) =>
              role.school && role.school.id ? role.school.id : false
            ) : [],
            accountRole: {
              isCurriculumDirector: form.accountRoles
                .map(i => i.role)
                .some(e => e === 'isCurriculumDirector'),
              isDirector: form.accountRoles
                .map(i => i.role)
                .some(e => e === 'isDirector')
            }
          }
        : null),
      learnerRoles: form.learnerRoles.map((role: any): ILearnerRoleFromClient => {
        return {
          school_id: role.school ? role.school.id : undefined,
          class_id: role.class ? role.class.id : undefined,
        };
      }),
    };
    this.sdk.client
      .updateUserRoles(this.userId, rolesData)
      .then(() => (this.rolesForm.markAsPristine(), this.onNoClick())).catch(err=>{
        this._uploading.next(false);
      });
      this.SLCService.editPageRedir = true; 
  }

  public availableInstitutions(): ISchool[] {
    const educatorRoles = this.rolesForm.value.teacherRoles;
    const exclude =
      educatorRoles && educatorRoles.length
        ? educatorRoles.map((role: ITeacherRole) =>
            role.school && role.school.id ? role.school.id : false
          )
        : [];
    return this.allInstitutions
      ? this.allInstitutions.filter(item => !exclude.includes(item.id))
      : null;
  }

  public availableAdminInstitutions(): ISchool[] {
    const adminRoles = this.rolesForm.value.adminRoles;
    const exclude =
      adminRoles && adminRoles.length
        ? adminRoles.map((role: ITeacherRole) =>
            role.school && role.school.id ? role.school.id : false
          )
        : [];
    return this.allInstitutions
      ? this.allInstitutions.filter(item => !exclude.includes(item.id))
      : null;
  }

  public availableLearnerInstitutions(): ISchool[] {
    const roles = this.rolesForm.value.learnerRoles;
    const exclude =
      roles && roles.length
        ? roles.map((role: ITeacherRole) =>
            role.school && role.school.id ? role.school.id : false
          )
        : [];
    return this.allInstitutions
      ? this.allInstitutions.filter(item => !exclude.includes(item.id))
      : null;
  }

  public onNoClick() {
    this.SLCService.editPageRedir = true; 
    this.router.navigate([this.pageMode]);
  }
}