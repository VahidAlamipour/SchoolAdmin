import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { CalendarNavComponent } from './calendar-nav/calendar-nav.component';
import { DayCalendarComponent } from './tt-calendar/tt-calendar.component';
import { UtilsService } from './common/services/utils/utils.service';
import {
  MatSelectModule,
  MatButtonModule,
  MatFormFieldModule
} from '@angular/material';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MatSelectModule,
    MatButtonModule,
    MatFormFieldModule
  ],
  providers: [UtilsService],
  declarations: [DayCalendarComponent, CalendarNavComponent],
  exports: [DayCalendarComponent]
})
export class TtCalendarModule {}
