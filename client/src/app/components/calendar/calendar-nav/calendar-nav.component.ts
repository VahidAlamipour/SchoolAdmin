import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewEncapsulation,
  OnInit,
  OnChanges
} from '@angular/core';
import * as moment from 'moment';
import { Moment } from 'moment';
import { TimetableService } from 'src/app/pages/timetable/services/timetable.service';
import { ITerm } from '../../../../../../sdk/interfaces';

@Component({
  selector: 'calendar-nav',
  templateUrl: './calendar-nav.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarNavComponent implements OnInit, OnChanges {
  @Input() label: string;
  @Input() prevLabel: string;
  @Input() nextLabel: string;
  @Input() currentDate: Moment;

  // tslint:disable:no-output-on-prefix
  @Output() onLeftNav: EventEmitter<null> = new EventEmitter();
  @Output() onRightNav: EventEmitter<null> = new EventEmitter();
  @Output() onGoToCurrent: EventEmitter<null> = new EventEmitter();
  @Output() onGoToMonth: EventEmitter<null> = new EventEmitter();
  @Output() onGoToYear: EventEmitter<null> = new EventEmitter();

  constructor(private ttService: TimetableService) {}

  public months = moment.months();
  public currentMonth: string;
  public currentYear: string;
  public currentSelectedDate: any;
  public currentAcademicYearStart: string;
  public currentAcademicYearEnd: string;
  public maxYear: any;
  public minYear: any;
  public years: string[];
  public selectedYear : string;

  ngOnChanges(changes) {
    this.currentAcademicYearStart = this.ttService.selectedAcademicYear !== null && this.ttService.selectedAcademicYear !== undefined ? this.ttService.selectedAcademicYear.start.toString() : null;

    this.currentAcademicYearEnd = this.ttService.selectedAcademicYear !== null && this.ttService.selectedAcademicYear !== undefined ? this.ttService.selectedAcademicYear.end.toString() : null;

    this.currentMonth = moment()
      .month(this.currentDate.month())
      .format('MMMM');

    this.currentYear = moment()
      .year(this.currentDate.year())
      .format('YYYY');

    this.currentSelectedDate = moment(`${this.currentDate}-${this.currentMonth}-${this.currentYear}`, 'DD-MMMM-YYYY') // 01
    this.maxYear = moment(`01-December-${this.currentAcademicYearEnd}`, 'DD-MMMM-YYYY')
    this.minYear = moment(`01-January-${this.currentAcademicYearStart}`, 'DD-MMMM-YYYY')

    const changeToCurr = moment(changes.currentDate.currentValue).format('YYYY')
    const curr = moment().format('YYYY')
    if (changeToCurr == curr && Number(this.currentAcademicYearStart) == Number(moment().format('YYYY')) && Number(this.currentAcademicYearStart) ==Number(this.currentAcademicYearEnd)) {
      this.years = [this.currentYear];
      this.selectedYear = this.currentYear;
    } else if (this.currentYear !== moment().format('YYYY') && (Number(this.currentAcademicYearStart) <= Number(moment().format('YYYY')))) {
      if (Number(this.currentYear) < Number(this.currentAcademicYearStart)) {
        this.years = [this.currentYear];  
      } else if (Number(this.currentYear) > Number(this.currentAcademicYearEnd)) {
        this.years = [this.currentYear];
      } else {
        this.years = [this.currentAcademicYearStart, this.currentAcademicYearEnd];
      }
      this.selectedYear = this.currentYear;

    } else if(Number(this.currentAcademicYearStart) != Number(moment().format('YYYY'))){
      let currentYear =  Number(moment().format('YYYY'));
      let countYearInBetween = Number(this.currentAcademicYearStart) - currentYear;
      let yearInBetween = new Array();
      for(let i = 0;i<countYearInBetween;i++){
         yearInBetween.push((currentYear++).toString());
      }  
      this.years = [...yearInBetween, this.currentAcademicYearStart, this.currentAcademicYearEnd].filter(function(elem, index, self) {
        return index === self.indexOf(elem);});
      this.selectedYear = this.currentYear;
    } else{
      this.years = [this.currentAcademicYearStart, this.currentAcademicYearEnd].filter(function(elem, index, self) {
        return index === self.indexOf(elem);});
    }
    
  }

  maxDateReached(): boolean {
    let res = moment(new Date(this.currentSelectedDate)).isSame(new Date(this.maxYear))
    return res
  }

  minDateReached(): boolean {
    let res = moment(new Date(this.currentSelectedDate)).isSame(new Date(this.minYear))
    return res
  }

  ngOnInit() {}

  leftNavClicked() {
    this.minDateReached() === true ? null : this.onLeftNav.emit();
  }

  rightNavClicked() {
    this.maxDateReached() === true ? null : this.onRightNav.emit();
  }

  currentWeek() {
    this.onGoToCurrent.emit();
  }

  monthSelectionChange(event): void {
    this.onGoToMonth.emit(event);
  }

  yearSelectionChange(event): void {
    this.onGoToYear.emit(event);
  }
}
