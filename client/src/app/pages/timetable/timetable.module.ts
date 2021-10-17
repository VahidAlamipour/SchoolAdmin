import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import {
  MatButtonModule,
  MatProgressSpinnerModule,
  MatTabsModule,
  MatMenuModule,
} from '@angular/material';

import { PopupModule } from 'src/app/components/popup/popup.module';
import { DropdownModule } from 'src/app/components/dropdown/dropdown.module';
import { TtCalendarModule } from 'src/app/components/calendar/tt-calendar.module';
import { TimetableService } from './services/timetable.service';
import { TimetableComponent } from './component/timetable.component';
import { TimetableDayComponent } from './components/day/day.component';
import { TimetableCourseComponent } from './components/course/course.component';
import { TimetableCalendarComponent } from './components/calendar/calendar.component';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    DropdownModule,
    MatTabsModule,
    TtCalendarModule,
    MatMenuModule,
    PopupModule
  ],
  providers: [TimetableService],
  declarations: [
    TimetableComponent,
    TimetableDayComponent,
    TimetableCourseComponent,
    TimetableCalendarComponent
  ]
})
export class TimetableModule {}
