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
  MatTooltipModule
} from '@angular/material';

import { ScheduleSettingsService } from './services/schedule-settings.service';
import { ScheduleSettingsComponent } from './components/schedule-settings-block/schedule-settings.component';
import { TermsBlockComponent } from './components/terms-block/terms-block.component';
import { ShiftsBlockComponent } from './components/shifts-block/shifts-block.component';
import { SelectInputModule } from '../modals/components/select-input/select-input.module';
import { CheckLineModule } from '../modals/components/check-line/check-line.module';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SelectInputModule,
    CheckLineModule,
    // Material
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTooltipModule
  ],
  declarations: [
    ScheduleSettingsComponent,
    TermsBlockComponent,
    ShiftsBlockComponent
  ],
  providers: [ScheduleSettingsService],
  exports: [ScheduleSettingsComponent]
})
export class ScheduleSettingsModule {}
