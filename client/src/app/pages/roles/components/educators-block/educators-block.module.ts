import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import {
  MatButtonModule,
  MatFormFieldModule,
  MatChipsModule
} from '@angular/material';

import { EducatorsBlockComponent } from './component/educators-block.component';
import { AddDataModalModule } from 'src/app/components/modals/add-data-modal/add-data-modal.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatChipsModule,
    AddDataModalModule
  ],
  declarations: [EducatorsBlockComponent],
  exports: [EducatorsBlockComponent]
})
export class EducatorsBlockModule {}
