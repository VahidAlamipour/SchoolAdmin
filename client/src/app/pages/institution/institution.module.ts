import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule, MatProgressSpinnerModule } from '@angular/material';

import { LabelInputModule } from 'src/app/components/modals/components/label-input/label-input.module';
import { SelectInputModule } from 'src/app/components/modals/components/select-input/select-input.module';
import { ChipsBlockModule } from 'src/app/components/modals/components/chips-block/chips-block.module';
import { ScheduleSettingsModule } from 'src/app/components/schedule-settings/schedule-settings.module';
import { InstitutionComponent } from './component/institution.component';
import { InstitutionService } from './services/institution.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    LabelInputModule,
    SelectInputModule,
    ChipsBlockModule,
    ScheduleSettingsModule
  ],
  declarations: [InstitutionComponent],
  providers: [InstitutionService]
})
export class InstitutionModule {}
