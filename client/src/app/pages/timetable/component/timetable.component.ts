import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ViewChild } from '@angular/core';
import * as moment from 'moment';
import { ActivatedRoute } from '@angular/router';


import { TimetableService } from '../services/timetable.service';
import { ILevel, IClass, IShift, IAcademicYear } from '../../../../../../sdk/interfaces';
import { TimetableCalendarComponent } from '../components/calendar/calendar.component';
import { SidebarService } from 'src/app/components/sidebar/sidebar.service';
import { CookieService } from 'ngx-cookie-service';
import { SdkService } from 'src/app/services/sdk.service';

@Component({
  selector: 'app-timetable',
  templateUrl: './timetable.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimetableComponent implements OnDestroy, OnInit {
  @ViewChild('calendarParentComp', { static: false })
  public calendarParentComp: TimetableCalendarComponent;
  private selectedShift: IShift;
  private selectedClass: IClass;
  private selectedYear: IAcademicYear;
  private startDate: string;
  private endDate: string;
  private selectedDayAfterChanged : string;
  public selectedShiftIndex = 0;
  public shifts = [];
  public dateParam;
  public activeAcademicYear: number;
  public ayInfo = null;
  public period = "CURRENT"
  constructor(public service: TimetableService, private activatedRoute: ActivatedRoute, private sidebarService : SidebarService, private cookieService: CookieService,private sdk: SdkService) {
    localStorage.removeItem('timetableShiftSelected');
  }

  ngOnInit() {
    let dateParam = undefined;
    this.activatedRoute.queryParams.subscribe(params =>
      dateParam = params.date
    );
    this.dateParam = dateParam;
    const currentYear = new Date().getFullYear();
    this.service
      .loadTimetableData()
      .then(
        (data) => {
          this.service.levelsSubject.next(data.structureData.levels);
          this.service.allLevels = data.structureData.levels;
          this.service.allClasses = data.structureData.classes;
          this.service.yearsSubject.next(data.allYears);
          const starterTimetableYearSelected = localStorage.getItem("timetableYearSelected");
          if (starterTimetableYearSelected) {
            //---------------- 
            localStorage.setItem("timetableYearSelected", starterTimetableYearSelected)
          } else if (data && data.school && data.school.activeAcademicYear) {
            this.service.activeYearSubject.next(data.school.activeAcademicYear);
            localStorage.setItem("timetableYearSelected", data.school.activeAcademicYear.toString())
          } else if (data.allYears && data.allYears.find(y => y.start === currentYear)) {
            localStorage.setItem("timetableYearSelected", data.allYears.find(y => y.start === currentYear).id);
          }
        }
      );
  }

  public tabsEvent(event: any): void {
    this.selectedShift = this.shifts[event.index];
    this.selectedShift.id
      ? localStorage.setItem('timetableShiftSelected', String(this.selectedShift.id))
      : localStorage.removeItem('timetableShiftSelected');
    setTimeout(() => this.loadLessons(), 100);
  }

  public yearReselected(year: IAcademicYear, reload: boolean, init: boolean, monthStartDate ?:any): void {
    //console.log(year)
    if (this.selectedYear !== year) {
      this.selectedShiftIndex = 0;
      this.selectedYear = year;
      this.selectedClass = undefined;
      this.shifts = [
        { name: 'All shifts' },
        ...(year && year.shifts
          ? year.shifts.map((shift) => ({
            ...shift,
            name: `${shift.name} shift`
          }))
          : null)
      ];

      this.service.getLevels();
      this.service.getClasses();
      if (year && reload && !init) {
        setTimeout(() => this.loadLessons(), 100);
      }

      this.service.selectedAcademicYear = year;
      const result = this.service.yearsSubject.value.filter(item => item.id === year.id);
      let period ="CURRENT"
      if(moment(result[0].terms[0].start)>moment()){ //FUTURE
        
        this.selectedDayAfterChanged =  moment(result[0].terms[0].start).format('DD-MM-YYYY');
        period = "FUTURE";
      }
      else if(moment(result[0].terms[0].start)<moment()){
        if(moment(result[0].terms[result[0].terms.length-1].end)<moment()){//PAST
          this.selectedDayAfterChanged = moment().subtract(1, 'years').format('DD-MM-YYYY');
          period = "PAST";
        } 
        else{//CURRENT
          this.selectedDayAfterChanged =  moment().format('DD-MM-YYYY');
        }
      }
      else if(monthStartDate){
        this.selectedDayAfterChanged = moment(monthStartDate).format('DD-MM-YYYY');
      }
      else{
        this.selectedDayAfterChanged =  moment().format('DD-MM-YYYY');
      }
      let dateparam = this.dateParam;
      this.activeAcademicYear = parseInt(this.service.activeYearSubject.value.toString());
      let isactive = this.activeAcademicYear == this.selectedYear.id;
      let goto = isactive && !this.dateParam && period=="CURRENT" ? moment().format('DD-MM-YYYY') : !init || this.dateParam == undefined ? this.selectedDayAfterChanged : dateparam ;//!init || this.dateParam == undefined ? this.selectedDayAfterChanged : dateparam
      // Auto Navigates the Calendar to the selected Year
      if (this.calendarParentComp !== undefined && this.calendarParentComp.calendarComponent !== undefined) {
        this.calendarParentComp.calendarComponent.goToYearNavigated(this.selectedYear, goto , period,!init ? undefined : dateparam) 
      }
      this.period = period;
      //setTimeout(() => this.loadLessons(), 100);
      
    }

  }

  public updateSidebar(ayInfo: any) {
    if(ayInfo &&ayInfo[0].activeAcademicYear){
      this.sidebarService.loadClasses(ayInfo[0].activeAcademicYear)
      this.sidebarService.loadLessons({
        academicYearId: ayInfo[0].activeAcademicYear,
        classId: null,
        startDate: null,
        endDate: null,
        shiftId: null,
      })
    }
  }

  public levelInit(level: ILevel): void {
    this.service.getClasses(level.id);
  }

  public levelReselected(level: ILevel): void {
    localStorage.removeItem('timetableClassesSelected');
    if (level && level.id) {
      this.service.getClasses(level.id);
    }
    const classSubscription = this.service.classes$.subscribe({
      next: (classes) => {
        if (classes[0] !== this.selectedClass) {
          this.classesReselected(classes[0], true);
        }
      },
      complete: () => classSubscription.unsubscribe()
    });
  }

  public classesReselected(classs: IClass, reload: boolean): void {
    if (this.selectedClass !== classs) {
      this.selectedClass = classs;
      if (reload) {
        setTimeout(() => this.loadLessons(), 100);
      }
    }
  }

  public weekSelect(data: any): void {
    this.startDate = moment(data.from).format('YYYY-MM-DD');
    this.endDate = moment(data.to).format('YYYY-MM-DD');
    if (data.needReload) {
      //this.loadLessons();
      setTimeout(() => this.loadLessons(), 100);
    }
  }

  public currentWeekSelect(): void {
    this.startDate = this.endDate = null;
    setTimeout(() => this.loadLessons(), 100);
  }

  public YearSelect(): void {
    this.startDate = localStorage.getItem('todate');
    this.endDate = localStorage.getItem('fromdate');
    setTimeout(() => this.loadLessons(), 100);
  }

  public MonthSelect(event : any): void {
  }

  public loadLessons(): void {
    if (this.cookieService.get('cityId') && this.cookieService.get('schoolId')) {
      this.sdk.client.getSchools({ limit: -1, cityId: Number(this.cookieService.get('cityId')) })
      .then(res=> { 
        let schoolid = Number(this.cookieService.get('schoolId'));
        this.ayInfo = res.list.filter(school=>school.id == schoolid);
      });
    }       
    this.updateSidebar(this.ayInfo);
    if (this.selectedClass && this.selectedYear && this.period =="CURRENT") {
      this.service.loadLessons({
        academicYearId: this.selectedYear.id,
        classId: this.selectedClass.id,
        ...(this.startDate !== null ? { startDate: this.startDate } : null),
        ...(this.endDate !== null ? { endDate: this.endDate } : null),
        ...(this.selectedShift && this.selectedShift.id ? { shiftId: this.selectedShift.id } : null)
      });
    }
    else if(this.selectedClass && this.selectedYear && this.period !="CURRENT"){
      this.service.loadLessons({
        academicYearId: this.selectedYear.id,
        classId: this.selectedClass.id,
        startDate: localStorage.getItem('fromdate'), // during setting 'fromdate', format is YYYY-MM-DD
        endDate: localStorage.getItem('todate') ,
        ...(this.selectedShift && this.selectedShift.id ? { shiftId: this.selectedShift.id } : null)
      });
    }
    else {
      this.service.clearLessons();
    }
  }

  ngOnDestroy() {
    this.service.classesSubject.next([]);
    this.service.lessonsSubject.next([]);
    this.selectedShift = null;
  }
}
