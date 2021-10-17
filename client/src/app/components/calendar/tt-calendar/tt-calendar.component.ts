import { ECalendarValue } from '../common/types/calendar-value-enum';
import { SingleCalendarValue } from '../common/types/single-calendar-value';

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChange,
  SimpleChanges,
  ViewEncapsulation
} from '@angular/core';
import { DayCalendarService } from './tt-calendar.service';
import * as momentNs from 'moment';
import { Moment, unitOfTime } from 'moment';
import {
  IDayCalendarConfig,
  IDayCalendarConfigInternal
} from './tt-calendar-config.model';
import { IDay } from './day.model';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator
} from '@angular/forms';
import { CalendarValue } from '../common/types/calendar-value';
import { UtilsService } from '../common/services/utils/utils.service';
import { DateValidator } from '../common/types/validator.type';
import { INavEvent } from '../common/models/navigation-event.model';
import { MatSelectChange } from '@angular/material';
const moment = momentNs;

@Component({
  selector: 'tt-calendar',
  templateUrl: 'tt-calendar.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    DayCalendarService,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DayCalendarComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => DayCalendarComponent),
      multi: true
    }
  ]
})
export class DayCalendarComponent
  implements OnInit, OnChanges, ControlValueAccessor, Validator {
  @Input() config: IDayCalendarConfig;
  @Input() displayDate: SingleCalendarValue;
  @Input() minDate: Moment;
  @Input() maxDate: Moment;

  // tslint:disable:no-output-on-prefix
  @Output() onSelect: EventEmitter<any> = new EventEmitter();
  @Output() moveToEvent: EventEmitter<any> = new EventEmitter();
  @Output() onGoToCurrent: EventEmitter<void> = new EventEmitter();
  @Output() onLeftNav: EventEmitter<INavEvent> = new EventEmitter();
  @Output() onRightNav: EventEmitter<INavEvent> = new EventEmitter();
  @Output() onGoToYear: EventEmitter<void> = new EventEmitter();
  @Output() onGoToMonth: EventEmitter<string> = new EventEmitter();

  isInited = false;
  componentConfig: IDayCalendarConfigInternal;
  _selected: Moment[];
  selectedWeek: {
    from: Moment;
    to: Moment;
  };
  weeks: IDay[][];
  weekdays: Moment[];
  _currentDateView: Moment;
  inputValue: CalendarValue;
  inputValueType: ECalendarValue;
  validateFn: DateValidator;
  navLabel: string;
  prevNavLabel: string;
  nextNavLabel: string;
  monthNumber: string;
  yearNumber: string;
  selectedDayAfterChanged : any;
  selectedYear : any;
  isDropdown : any;
  period: any;
  selectedDay : any;
  dateParam : any;
  api = {
    moveCalendarsBy: this.moveCalendarsBy.bind(this),
    moveCalendarTo: this.moveCalendarTo.bind(this)
  };
  isClicked : boolean = false;
  set selected(selected: Moment[]) {
    this._selected = selected;
    this.onChangeCallback(this.processOnChangeCallback(selected));
  }

  get selected(): Moment[] {
    return this._selected;
  }

  set currentDateView(current: Moment) {
    this._currentDateView = current.clone();
    this.weeks = this.dayCalendarService.generateMonthArray(
      this.componentConfig,
      this._currentDateView,
      this.selected,
      this.selectedDayAfterChanged != null || this.selectedDayAfterChanged !=undefined  ? this.selectedDayAfterChanged : moment(this.selected[0]).format('YYYY-MM-DD')
    );
    this.navLabel = this.dayCalendarService.getHeaderLabel(
      this.componentConfig,
      this._currentDateView
    );
    this.prevNavLabel = this.dayCalendarService.getHeaderLabel(
      this.componentConfig,
      moment(this._currentDateView).subtract(1, 'months')
    );
    this.nextNavLabel = this.dayCalendarService.getHeaderLabel(
      this.componentConfig,
      moment(this._currentDateView).add(1, 'months')
    );
  }

  get currentDateView(): Moment {
    return this._currentDateView;
  }

  constructor(
    public readonly dayCalendarService: DayCalendarService,
    public readonly utilsService: UtilsService,
    public readonly cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.isInited = true;
    this.init();
    this.initValidators();
    // this.goToYearNavigated()
  }

  init() {
    this.componentConfig = this.dayCalendarService.getConfig(this.config);
    this.selected = this.selected || [];
    this.currentDateView = this.displayDate
      ? this.utilsService
          .convertToMoment(this.displayDate, this.componentConfig.format)
          .clone()
      : this.utilsService.getDefaultDisplayDate(
          this.currentDateView,
          this.selected,
          this.componentConfig.allowMultiSelect,
          this.componentConfig.min
        );
    this.weekdays = this.dayCalendarService.generateWeekdays(
      this.componentConfig.firstDayOfWeek
    );
    this.inputValueType = this.utilsService.getInputType(
      this.inputValue,
      this.componentConfig.allowMultiSelect
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.isInited) {
      const { minDate, maxDate, config } = changes;

      this.handleConfigChange(config);
      this.init();

      if (minDate || maxDate) {
        this.initValidators();
      }
    }
  }

  getDayInWeek(week: IDay[]): boolean {
    const selectedDay = (this.selectedDayAfterChanged != null || this.selectedDayAfterChanged !=undefined) && !this.isClicked  ? this.selectedDayAfterChanged : moment(this.selected[0]).format('YYYY-MM-DD');
    const firstDay = moment(week[0].date);
    const lastDay = moment(week[week.length - 1].date);

    if (
      moment(selectedDay, 'YYYY-MM-DD').isBetween(
        firstDay.subtract(1, 'day'),
        lastDay.add(1, 'day')
      )
    ) {
      this.selectedWeek = {
        from: week[0].date,
        to: week[week.length - 1].date
      };
      localStorage.setItem('todate',moment(this.selectedWeek.to).format('YYYY-MM-DD'));
      localStorage.setItem('fromdate',moment(this.selectedWeek.from).format('YYYY-MM-DD'));
      return true;
    }
    return false;
  }

  writeValue(value: CalendarValue): void {
    this.inputValue = value;

    if (value) {
      this.selected = this.utilsService.convertToMomentArray(
        value,
        this.componentConfig.format,
        this.componentConfig.allowMultiSelect
      );
      this.inputValueType = this.utilsService.getInputType(
        this.inputValue,
        this.componentConfig.allowMultiSelect
      );
    } else {
      this.selected = [];
    }

    this.weeks = this.dayCalendarService.generateMonthArray(
      this.componentConfig,
      this.currentDateView,
      this.selected,
      this.selectedDayAfterChanged != null || this.selectedDayAfterChanged !=undefined  ? this.selectedDayAfterChanged : moment(this.selected[0]).format('YYYY-MM-DD')
    );

    this.cd.markForCheck();
  }

  registerOnChange(fn: any): void {
    this.onChangeCallback = fn;
  }

  onChangeCallback(_: any) {}

  registerOnTouched(fn: any): void {}

  validate(formControl: FormControl): ValidationErrors | any {
    if (this.minDate || this.maxDate) {
      return this.validateFn(formControl.value);
    } else {
      return () => null;
    }
  }

  processOnChangeCallback(value: Moment[]): CalendarValue {
    return this.utilsService.convertFromMomentArray(
      this.componentConfig.format,
      value,
      this.componentConfig.returnedValueType || this.inputValueType
    );
  }

  initValidators() {
    this.validateFn = this.utilsService.createValidator(
      { minDate: this.minDate, maxDate: this.maxDate },
      this.componentConfig.format
    );
    this.onChangeCallback(this.processOnChangeCallback(this.selected));
  }

  dayClicked(day: IDay) {
    if (day.selected && !this.componentConfig.unSelectOnClick) {
      return;
    }
    this.isClicked =true;
    this.selected = this.utilsService.updateSelected(
      this.componentConfig.allowMultiSelect,
      this.selected,
      day
    );
    this.weeks = this.dayCalendarService.generateMonthArray(
      this.componentConfig,
      this.currentDateView,
      this.selected,
      this.selectedDayAfterChanged != null || this.selectedDayAfterChanged !=undefined  ? this.selectedDayAfterChanged : moment(this.selected[0]).format('YYYY-MM-DD')
    );

    const selectedDay = moment(this.selected[0]);
    this.weeks.forEach(week => {
      const firstDay = moment(week[0].date);
      const lastDay = moment(week[week.length - 1].date);
      if (
        moment(selectedDay).isBetween(
          firstDay.subtract(1, 'day'),
          lastDay.add(1, 'day')
        )
      ) {
        this.selectedWeek = {
          from: week[0].date,
          to: week[week.length - 1].date
        };
      }
    });
    localStorage.setItem('todate',moment(this.selectedWeek.to).format('YYYY-MM-DD'));
    localStorage.setItem('fromdate',moment(this.selectedWeek.from).format('YYYY-MM-DD'));
    this.onSelect.emit(this.selectedWeek);
  }

  getDayBtnText(day: IDay): string {
    return this.dayCalendarService.getDayBtnText(
      this.componentConfig,
      day.date
    );
  }

  getDayBtnCssClass(day: IDay): { [klass: string]: boolean } {
    const cssClasses: { [klass: string]: boolean } = {
      'selected-day': day.selected,
      'current-month': day.currentMonth,
      'prev-month': day.prevMonth,
      'next-month': day.nextMonth,
      'current-day': day.currentDay
    };
    const customCssClass: string = this.dayCalendarService.getDayBtnCssClass(
      this.componentConfig,
      day.date
    );
    if (customCssClass) {
      cssClasses[customCssClass] = true;
    }

    return cssClasses;
  }

  getSelectedDayCssClass(day: IDay): { [klass: string]: boolean } {
    const cssClasses: { [klass: string]: boolean } = { 
      'selected-day': day.selected,
      'current-month': day.currentMonth,
      'prev-month': day.prevMonth,
      'next-month': day.nextMonth,
      'current-day': moment(day.date).format('DD-MM-YYYY') == this.selectedDay ? true : false
    };
    return cssClasses;
  }
  onLeftNavClick() {
    const from = this.currentDateView.clone();
    this.moveCalendarsBy(this.currentDateView, -1, 'month');
    const to = this.currentDateView.clone();
    this.onLeftNav.emit({ from, to });
  }

  onRightNavClick() {
    const from = this.currentDateView.clone();
    this.moveCalendarsBy(this.currentDateView, 1, 'month');
    const to = this.currentDateView.clone();
    this.onRightNav.emit({ from, to });
  }

  getWeekdayName(weekday: Moment): string {
    if (this.componentConfig.weekDayFormatter) {
      return this.componentConfig.weekDayFormatter(weekday.day());
    }

    return weekday.format(this.componentConfig.weekDayFormat);
  }

  moveCalendarsBy(
    current: Moment,
    amount: number,
    granularity: unitOfTime.Base = 'month'
  ) {
    this.currentDateView = current.clone().add(amount, granularity);
    this.cd.markForCheck();
  }

  moveCalendarTo(to: SingleCalendarValue, dropdown ?: boolean) {
    if (to) {
      this.currentDateView = this.utilsService.convertToMoment(
        to,
        this.componentConfig.format
      );
      if(dropdown == undefined){
        this.isDropdown =false;
      }
      else{
        this.isDropdown = true;
      }
      
      this.emitSelectEvent(to);
    }

    this.cd.markForCheck();
  }

  emitSelectEvent(to : any): void {
    //this.isClicked = false;
    let checkValid = moment(moment(to, 'DD-MM-YYYY').format('YYYY-MM-DD')).isValid; 
    if(checkValid){
    let day =  moment(moment(to, 'DD-MM-YYYY').format('YYYY-MM-DD'));
    this.weeks = this.dayCalendarService.generateMonthArray(
      this.componentConfig,
      this.currentDateView,
      this.selected,
      day
    ); 
    let startdate = this.selectedYear != undefined ? moment(this.selectedYear.terms[0].start).format('YYYY-MM-DD') : day;
    const selectedDay = this.isDropdown == false ? day :
    this.isDropdown == true && this.period == "FUTURE" ? startdate :
    this.isDropdown == true && this.period == "CURRENT" && this.isClicked ? moment().format('YYYY-MM-DD') :
    this.isDropdown == true && this.period == "PAST" ? moment().subtract(1, 'years').format('YYYY-MM-DD') :
    this.selected[0];
    this.selectedDayAfterChanged = selectedDay;
    this.weeks.forEach(week => {
      const firstDay = moment(week[0].date);
      const lastDay = moment(week[week.length - 1].date);
      if (
        moment(selectedDay).isBetween(
          firstDay.subtract(1, 'day'),
          lastDay.add(1, 'day')
        )
      ) {
        this.selectedWeek = {
          from: week[0].date,
          to: week[week.length - 1].date
        };
      }
    });
    this.selectedDay = moment(selectedDay).format('DD-MM-YYYY');
    this.moveToEvent.emit(this.selectedWeek);
    localStorage.setItem('todate',moment(this.selectedWeek.to).format('YYYY-MM-DD'));
    localStorage.setItem('fromdate',moment(this.selectedWeek.from).format('YYYY-MM-DD'));
  }
  }

  goToCurrent() {
    this.isClicked = false;
    this.currentDateView = moment();
    this.selected = [moment()];
    this.onGoToCurrent.emit();
  }

  goToMonth(month: MatSelectChange) {
    // this.isClicked = false;
    const yearNumber = moment()
      .year(this.currentDateView.year())
      .format('YYYY');

    const monthNumber = moment()
      .month(month.value)
      .format('MM');

      if(this.period == "CURRENT"){
        this.selectedDayAfterChanged = moment();
      } 
      else{
        this.selectedDayAfterChanged =  this.selectedYear.terms[0].start;
      }
    this.moveCalendarTo(
      moment(`01-${monthNumber}-${yearNumber}`, 'DD-MM-YYYY'),//moment(`${moment(this.selectedDayAfterChanged).format('DD')}-${monthNumber}-${yearNumber}`, 'DD-MM-YYYY'), 
      true
    );
    //this.onGoToMonth.emit(monthNumber);
  }

  goToYear(year: MatSelectChange) {
    this.isClicked = false;
    const monthNumber = moment()
      .month(this.currentDateView.month())
      .format('MM');

    const yearNumber = moment()
      .year(year.value)
      .format('YYYY');
      if(this.period == "CURRENT"){
        this.selectedDayAfterChanged = moment();
      } 
      else{
        this.selectedDayAfterChanged = this.selectedYear.terms[0].start
      }
    this.moveCalendarTo(
      moment(`01-${monthNumber}-${yearNumber}`, 'DD-MM-YYYY'),//moment(`${moment(this.selectedDayAfterChanged).format('DD')}-${monthNumber}-${yearNumber}`, 'DD-MM-YYYY')
      true
      );
    //this.selected = this.selectedYear ;//=moment(this.selectedYear);
    this.onGoToYear.emit();
  }

  goToYearNavigated(year: any, goto : string , period : string, dateparam : any ) {
    this.isClicked = dateparam != undefined ? true : false;

    this.selectedYear = year;
    this.period = period;
    const monthNumber = moment()
      .format('MM');

    const yearNumber = moment()
      .format('YYYY');

    const dayNumber = moment()
      .format('DD')

    let activeSem: boolean = null;

    year.terms.forEach((termElem) => {
      if (moment() > moment(termElem.start) && moment() < moment(termElem.end)) {
        // In Active Sem
        // this.moveCalendarTo(
        //   moment(`${dayNumber}-${monthNumber}-${yearNumber}`, 'DD-MM-YYYY')
        // );
        this.moveCalendarTo(
          moment(goto, 'DD-MM-YYYY')
        );
        activeSem = true;
      }
    });
    
    if (activeSem === false || activeSem === null) {
      const moveDay = moment(year.terms[0].start)
      .format('DD');
      const moveMonth = moment(year.terms[0].start)
      .format('MM');
      const moveYear = moment(year.terms[0].start)
      .format('YYYY');

      this.moveCalendarTo(
        moment(`${goto}`, 'DD-MM-YYYY') //${moveDay}-${moveMonth}-${moveYear}
      );
    }

  }

  handleConfigChange(config: SimpleChange) {
    if (config) {
      const prevConf: IDayCalendarConfigInternal = this.dayCalendarService.getConfig(
        config.previousValue
      );
      const currentConf: IDayCalendarConfigInternal = this.dayCalendarService.getConfig(
        config.currentValue
      );

      if (this.utilsService.shouldResetCurrentView(prevConf, currentConf)) {
        this._currentDateView = null;
      }
    }
  }
}
