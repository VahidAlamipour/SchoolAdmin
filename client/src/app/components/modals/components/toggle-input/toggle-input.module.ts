import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatInputModule, MatFormFieldModule, MatSlideToggleModule } from '@angular/material';

import { ToggleInputComponent } from './component/toggle-input.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatSlideToggleModule
  ],
  declarations: [ToggleInputComponent],
  exports: [ToggleInputComponent]
})
export class ToggleInputModule {}
