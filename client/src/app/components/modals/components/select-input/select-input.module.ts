import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import {
  MatFormFieldModule,
  MatSelectModule,
  MatButtonModule
} from '@angular/material';

import { SelectInputComponent } from './component/select-input.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule
  ],
  declarations: [SelectInputComponent],
  exports: [SelectInputComponent]
})
export class SelectInputModule {}
