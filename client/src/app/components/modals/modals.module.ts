import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ScrollingModule } from '@angular/cdk/scrolling';
import {
  MatTabsModule,
  MatButtonModule,
  MatDialogModule,
  MatFormFieldModule,
  MAT_LABEL_GLOBAL_OPTIONS,
  MAT_DIALOG_DEFAULT_OPTIONS,
  MatNativeDateModule,
  MatIconModule,
  MatTableModule,
  MatRadioModule,
  MatProgressSpinnerModule,
  MatSlideToggleModule,
  MatInputModule,
  MatSelectModule
} from '@angular/material';

import { ScrollableDirective } from 'src/app/directives/scrollable.directive';
import { ConfirmationModalComponent } from './confirmation-modal/confirmation-modal.component';
import { ConfirmModalComponent } from './confirm-modal/confirm-modal.component';
import { CreateParentModalComponent } from './create-parent-modal/create-parent-modal.component';
import { CreateLearnerModalComponent } from './create-learner-modal/create-learner-modal.component';
import { CreateSubclassModalComponent } from './create-subclass-modal/create-subclass-modal.component';
import { CreateEducatorModalComponent } from './create-educator-modal/create-educator-modal.component';
import { EducatorCoursesModalComponent } from './roles/educator-courses-modal/educator-course-modal.component';
import { EducatorRolesModalComponent } from './roles/educator-roles-modal/educator-roles-modal.component';
import { AdminRolesModalComponent } from './roles/admin-roles-modal/admin-roles-modal.component';
import { LearnerRolesModalComponent } from './roles/learner-roles-modal/learner-roles-modal.component';
import { SLCModalComponent } from './slc-modal/slc-modal.component';
import { FacilitiesModalComponent } from './facilities-modal/facilities-modal.component';
import { CoursesModalComponent } from './create-course-modal/create-course-modal.component';
import { DeleteLessonModalComponent } from './delete-lesson-modal/delete-lesson-modal.component';
import { CreateAdminModalComponent } from './create-admin-modal/create-admin-modal.component';
import { AccountRolesModalComponent } from './roles/account-roles-modal/account-roles-modal.component';
import { CrossingLessonsModalComponent } from './crossing-lessons-modal/crossing-lessons-modal.component';
import { ImportModalComponent } from './import-modal/import-modal.component';
import { ImportModalPreYearsComponent } from './import-modal-pre-years/import-modal-pre-years.component';
import { LabelInputModule } from './components/label-input/label-input.module';
import { ChipsBlockModule } from './components/chips-block/chips-block.module';
import { DateInputModule } from './components/date-input/date-input.module';
import { SelectInputModule } from './components/select-input/select-input.module';
import { CheckInputModule } from './components/check-input/check-input.module';
import { ToggleInputModule } from './components/toggle-input/toggle-input.module';
import { AutoInputModule } from './components/auto-input/auto-input.module';
import { InstitutionsModalModule } from './institutions-modal/institutions-modal.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ScrollingModule,
    LabelInputModule,
    ChipsBlockModule,
    DateInputModule,
    SelectInputModule,
    CheckInputModule,
    ToggleInputModule,
    AutoInputModule,
    InstitutionsModalModule,
    // Material
    MatTabsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatIconModule,
    MatTableModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  declarations: [
    ConfirmationModalComponent,
    ConfirmModalComponent,
    CreateParentModalComponent,
    CreateLearnerModalComponent,
    CreateEducatorModalComponent,
    FacilitiesModalComponent,
    SLCModalComponent,
    ScrollableDirective,
    EducatorRolesModalComponent,
    EducatorCoursesModalComponent,
    AdminRolesModalComponent,
    LearnerRolesModalComponent,
    CreateSubclassModalComponent,
    CoursesModalComponent,
    DeleteLessonModalComponent,
    CreateAdminModalComponent,
    AccountRolesModalComponent,
    ImportModalComponent,
    ImportModalPreYearsComponent,
    CrossingLessonsModalComponent
  ],
  entryComponents: [
    ConfirmationModalComponent,
    ConfirmModalComponent,
    CreateParentModalComponent,
    CreateLearnerModalComponent,
    CreateEducatorModalComponent,
    FacilitiesModalComponent,
    SLCModalComponent,
    EducatorRolesModalComponent,
    EducatorCoursesModalComponent,
    AdminRolesModalComponent,
    LearnerRolesModalComponent,
    CreateSubclassModalComponent,
    CoursesModalComponent,
    DeleteLessonModalComponent,
    CreateAdminModalComponent,
    AccountRolesModalComponent,
    ImportModalComponent,
    ImportModalPreYearsComponent,
    CrossingLessonsModalComponent
  ],
  providers: [
    { provide: MAT_LABEL_GLOBAL_OPTIONS, useValue: { float: 'never' } },
    {
      provide: MAT_DIALOG_DEFAULT_OPTIONS,
      useValue: { autoFocus: false, restoreFocus: false, hasBackdrop: true, disableClose: true }
    }
  ]
})
export class ModalsModule { }
