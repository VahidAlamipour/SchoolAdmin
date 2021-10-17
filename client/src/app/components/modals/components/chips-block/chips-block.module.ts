import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import {
  MatButtonModule,
  MatFormFieldModule,
  MatChipsModule
} from '@angular/material';

import { ChipsBlockComponent } from './component/chips-block.component';
import { AddDataModalModule } from '../../add-data-modal/add-data-modal.module';

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
  declarations: [ChipsBlockComponent],
  exports: [ChipsBlockComponent]
})
export class ChipsBlockModule {}
