import { Component, OnInit, Input, HostBinding, Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import * as moment from 'moment';

import { IStudyDay } from '../../../../../../../sdk/interfaces';

@Component({
  selector: 'day',
  templateUrl: './day.component.html'
})
export class TimetableDayComponent implements OnInit {
  @HostBinding('class.today') isTodayClass: boolean;

  @Input() public day: IStudyDay;
  @Input() public index: number;
  @Output() public lessonDelete: EventEmitter<any> = new EventEmitter();

  public today: string = moment().format('YYYY-MM-DD');
  public isToday: boolean;
  public isBefore: boolean;

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.isBefore = moment(this.day.date).isBefore(this.today);
    this.isToday = this.isTodayClass = moment(this.day.date).format('YYYY-MM-DD') === this.today;
  }

  public getWeekday(date: Date): string {
    const weekDay = moment(date).format('dddd');
    return weekDay.toString();
  }

  public getFormatDate(date: Date): string {
    const formatDate = moment(date).format('MMMM DD, YYYY');
    return formatDate;
  }

  public addLesson(): void {
    const classId = +localStorage.getItem('timetableClassesSelected');
    const date = moment(this.day.date).format('YYYY-MM-DD');
    this.router.navigate(['/timetable', classId, date], {
      relativeTo: this.route
    });
  }
}
