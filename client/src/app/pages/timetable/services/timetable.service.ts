import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';

import { SdkService } from 'src/app/services/sdk.service';
import { ILevel, IClass, IStudyDay, IAcademicYear } from '../../../../../../sdk/interfaces';
import { sum } from 'lodash';

@Injectable()
export class TimetableService {
  private loadingLevelsSubject = new BehaviorSubject<boolean>(false);
  private loadingClassesSubject = new BehaviorSubject<boolean>(false);
  private loadingLessonsSubject = new BehaviorSubject<boolean>(false);
  private loadingYearsSubject = new BehaviorSubject<boolean>(false);

  public allClasses: IClass[] = [];
  public allLevels: ILevel[] = [];
  public classesSubject = new BehaviorSubject<IClass[]>([]);
  public lessonsSubject = new BehaviorSubject<IStudyDay[]>([]);

  public levelsSubject = new BehaviorSubject<ILevel[]>([]);
  public yearsSubject = new BehaviorSubject<IAcademicYear[]>([]);
  public activeYearSubject = new BehaviorSubject<IAcademicYear>(null);

  public levels$ = this.levelsSubject.asObservable();
  public classes$ = this.classesSubject.asObservable();
  public lessons$ = this.lessonsSubject.asObservable();
  public years$ = this.yearsSubject.asObservable();
  public activeYear$ = this.activeYearSubject.asObservable();
  
  public loadingLevels$ = this.loadingLevelsSubject.asObservable();
  public loadingClasses$ = this.loadingClassesSubject.asObservable();
  public loadingLessons$ = this.loadingLessonsSubject.asObservable();
  public loadingYears$ = this.loadingYearsSubject.asObservable();

  public selectedAcademicYear: IAcademicYear;

  constructor(private sdk: SdkService, private cookieService: CookieService) { }

  public async loadTimetableData(schoolId ?: number): Promise<any> {
    return await Promise.resolve({
      structureData: await this.sdk.client.getSchoolLevelsStructure(),
      allYears: await this.sdk.client
        .getAcademicYears({ schoolId: +this.cookieService.get('schoolId'), limit: -1 })
        .then((data) => data.list),
      school : await this.sdk.client.getSchool(+this.cookieService.get('schoolId'))
    });
  }

  public getClasses(levelId: number = +localStorage.getItem('timetableLevelSelected')): void {
    var selectedYearId = +localStorage.getItem('timetableYearSelected');
    this.loadingClassesSubject.next(true);
    let classessss = this.allClasses.filter((row) => row.levelId === levelId && row.yearId === selectedYearId);
    var selectedClassId = +localStorage.getItem('timetableClassesSelected');
    if (classessss && classessss.length) {
      let continueFlag = false;
      classessss.forEach(item => {
        if (item.id == selectedClassId) {
          continueFlag = true;
        }
      });
      if(!continueFlag){
        localStorage.setItem('timetableClassesSelected',classessss[0].id.toString())
      }
    }else{
      localStorage.removeItem('timetableClassesSelected');
    }
    this.classesSubject.next(classessss);
    this.loadingClassesSubject.next(false);
  }
  public getLevels(yearId: number = +localStorage.getItem('timetableYearSelected')): void {
    let tempLevels = this.allLevels.map(level => {
      let classes = this.allClasses.filter((row) => row.levelId === level.id && row.yearId === yearId);
      let sumStu = 0;
      classes.forEach(cl => {
        sumStu += cl.studentsCount;
      })
      level.classesCount = classes.length;
      level.studentsCount = sumStu;
      return level;
    })
    this.levelsSubject.next(tempLevels);
  }

  public loadLessons(params: {
    academicYearId: number;
    classId: number;
    shiftId?: number;
    startDate?: string;
    endDate?: string;
  }): void {
    this.loadingLessonsSubject.next(true);
    if (params.classId) {
      this.sdk.client
        .getLessons(params)
        .then((lessons) => this.lessonsSubject.next(lessons))
        .finally(() => this.loadingLessonsSubject.next(false));
    } else {
      this.loadingLessonsSubject.next(false);
    }
  }

  public clearLessons(): void {
    this.lessonsSubject.next([]);
  }
}
