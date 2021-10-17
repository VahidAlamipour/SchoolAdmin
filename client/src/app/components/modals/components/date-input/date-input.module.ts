import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import {
  MatInputModule,
  MatFormFieldModule,
  MatNativeDateModule,
  MatDatepickerModule,
  DateAdapter,
  MAT_DATE_LOCALE
} from '@angular/material';

import { DateInputComponent } from './component/date-input.component';
import { YearInputComponent } from './year-input/year-input.component';
import { FulldateInputComponent } from './fulldate-input/fulldate-input.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  declarations: [
    DateInputComponent,
    YearInputComponent,
    FulldateInputComponent
  ],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE]
    }
  ],
  exports: [DateInputComponent]
})
export class DateInputModule {}
