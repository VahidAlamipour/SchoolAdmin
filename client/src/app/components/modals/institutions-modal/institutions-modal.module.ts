import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule,
  MatDialogModule,
  MatFormFieldModule,
  MatNativeDateModule,
  MatProgressSpinnerModule,
  MatSelectModule,
  MatSlideToggleModule,
  MatRadioModule
} from '@angular/material';

import { InstitutionsModalService } from './services/institutions-modal.service';
import { ScheduleSettingsModule } from '../../schedule-settings/schedule-settings.module';
import { SelectInputModule } from '../components/select-input/select-input.module';
import { LabelInputModule } from '../components/label-input/label-input.module';
import { ChipsBlockModule } from '../components/chips-block/chips-block.module';
import { CheckLineModule } from '../components/check-line/check-line.module';
import { DateInputModule } from '../components/date-input/date-input.module';

import { InstitutionsModalComponent } from './main-modal/institutions-modal.component';
import { AddYearModalComponent } from './add-year-modal/add-year-modal.component';
import { TimesModalComponent } from './times-modal/times-modal.component';
import { TermsModalComponent } from './terms-modal/terms-modal.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LabelInputModule,
    ChipsBlockModule,
    SelectInputModule,
    DateInputModule,
    CheckLineModule,
    ScheduleSettingsModule,
    // Material
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatRadioModule
  ],
  declarations: [
    InstitutionsModalComponent,
    AddYearModalComponent,
    TimesModalComponent,
    TermsModalComponent
  ],
  entryComponents: [
    InstitutionsModalComponent,
    AddYearModalComponent,
    TimesModalComponent,
    TermsModalComponent
  ],
  providers: [InstitutionsModalService]
})
export class InstitutionsModalModule {}
