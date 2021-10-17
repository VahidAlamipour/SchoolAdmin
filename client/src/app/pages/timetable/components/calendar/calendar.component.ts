import {
  Component,
  Output,
  EventEmitter,
  ViewChild,
  OnInit
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Moment } from 'moment';
import * as moment from 'moment';

import {
  ECalendarValue,
  DATE_FORMAT
} from 'src/app/components/calendar/common/types/calendar-value-enum';
import { IConfig } from 'src/app/components/calendar/tt-calendar/tt-calendar-config.model';
import { DayCalendarComponent } from 'src/app/components/calendar/tt-calendar/tt-calendar.component';

@Component({
  selector: 'calendar',
  templateUrl: './calendar.component.html'
})
export class TimetableCalendarComponent implements OnInit {
  @ViewChild('calendarComponent', { static: false })
  public calendarComponent: DayCalendarComponent;
  @Output()
  private weekSelect: EventEmitter<any> = new EventEmitter();
  @Output()
  private currentWeekSelect: EventEmitter<any> = new EventEmitter();
  @Output()
  private currentYearSelect: EventEmitter<any> = new EventEmitter();
  @Output()
  private currentMonthSelect: EventEmitter<any> = new EventEmitter();

  public config: IConfig = {
    firstDayOfWeek: 'su',
    monthFormat: 'MMMM',
    weekDayFormat: 'ddd',
    yearFormat: 'YYYY',
    dayBtnFormat: 'DD',
    monthBtnFormat: 'MMM',
    allowMultiSelect: false,
    returnedValueType: ECalendarValue.String,
    unSelectOnClick: false
  };
  public displayDate: Moment | string;
  public validationMinDate: Moment;
  public validationMaxDate: Moment;
  public dates: any = [];

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe(params =>
      this.moveDate(params.date)
    );
  }

  private moveDate(date: string) {
    if (date && moment(date, DATE_FORMAT).format(DATE_FORMAT) === date) {
      this.dates = date;
      setTimeout(() => this.calendarComponent.api.moveCalendarTo(date), 0);
    }
  }

  public onSelect(data: any, clearQuery: boolean): void {
    // if (clearQuery) {
    //   this.router.navigate([]);
    // }
    this.weekSelect.emit({ ...data, ...{ needReload: clearQuery } });
  }

  public onCurrentWeekSelect(): void {
    // this.router.navigate([]);
    this.currentWeekSelect.emit();
  }
  public onCurrentYearSelect(): void {
    // this.router.navigate([]);
    this.currentYearSelect.emit();
  }

  public onCurrentMonthSelect(event : any): void {
    // this.router.navigate([]);
    this.currentMonthSelect.emit(event);
  }
}
