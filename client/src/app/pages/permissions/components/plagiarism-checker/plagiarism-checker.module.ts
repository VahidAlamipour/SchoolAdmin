import { NgModule } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import {
  MatButtonModule,
  MatFormFieldModule,
  MatProgressBarModule,
  MatChipsModule
} from '@angular/material';

import { ToggleInputModule } from "../../../../components/modals/components/toggle-input/toggle-input.module";
import { PlagiarismCheckerComponent } from './component/plagiarism-checker.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatChipsModule,
    ToggleInputModule
  ],
  providers: [DecimalPipe],
  declarations: [PlagiarismCheckerComponent],
  exports: [PlagiarismCheckerComponent]
})
export class PlagiarismCheckerModule {}
