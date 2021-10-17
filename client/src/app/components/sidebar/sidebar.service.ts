import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { SdkService } from 'src/app/services/sdk.service';
import { IPageQuery } from '../../../../../sdk/sdk';

@Injectable()
export class SidebarService {

  schoolId: number;
  public warning = { wInstitution: false, wLearner: false, wTimetable: false, wFacilities: false, wCourse: false, timetableCount: 0, classCount: 0 }
  public classes;
  public start;
  public end;
  public shift;
  public lessonCount;
  public activeAcademicYear;

  constructor(public sdk: SdkService, public cookieService: CookieService) { }

  public loadCurrentInstituteInfo(schoolInfo: any) {
    if(schoolInfo){
    if (schoolInfo[0]) {
      this.activeAcademicYear = schoolInfo[0].activeAcademicYear;
      this.schoolId = schoolInfo[0].id;
      if (schoolInfo[0].academicYearList.length === 0 || schoolInfo[0].activeAcademicYear === null) {
        this.warning.wInstitution = false;
      }
      else {
        this.warning.wInstitution = true;
      }
    }
    else{
      this.activeAcademicYear = schoolInfo.activeAcademicYear;
      this.schoolId = schoolInfo.id;
      if (schoolInfo.academicYearList.length === 0 || schoolInfo.activeAcademicYear === null) {
        this.warning.wInstitution = false;
      }
      else {
        this.warning.wInstitution = true;
      }
    }
    this.loadSubjectDatasource();
    this.loadClasses();
    this.loadFacilitiesDatasource(this.schoolId)
    this.loadLessons({
      academicYearId: this.activeAcademicYear,
      classId: null,
      ...(this.start !== null ? { startDate: this.start } : null),
      ...(this.end !== null ? { endDate: this.end } : null),
      ...(this.shift ? { shiftId: this.shift } : null)
    });
  }
    return this.warning;
  }

  public loadSubjectDatasource() {
    this.loadCourses({
      page: 0,
      limit: 10
    });
  }

  public loadCourses(params?: IPageQuery & { subject?: number },
    hasFilterData: boolean = false) {
    const load = this.sdk.client.getSubjects(params)
      .then(res => {
        if (res.count > 0) {
          this.warning.wCourse = true;
        }
        else {
          this.warning.wCourse = false;
        }
      });
  }

  public loadClasses(activeAcademicYear? : number ) {
    let activeYearID = activeAcademicYear != undefined ? activeAcademicYear : this.activeAcademicYear != undefined ? this.activeAcademicYear : undefined;
    if(activeYearID){
    const load = this.sdk.client.getSchoolStructure()
      .then(res => {
        let ay = res.classes.filter(row =>
          row.yearId == activeYearID);
        if (ay.length > 0) {
          this.warning.wLearner = true;
        }
        else {
          this.warning.wLearner = false;
        }
        this.warning.classCount = ay.length;
        //this.classes = res.classes[0].id;
      });
    }
  }

  public async loadSchoolAcademicYearInfo(schoolId: number): Promise<any> {
    return await Promise.resolve({
      structureData: await this.sdk.client.getSchoolLevelsStructure(),
      allYears: await this.sdk.client
        .getAcademicYears({ schoolId: +this.cookieService.get('schoolId'), limit: -1 })
        .then((data) => data.list),
      school: await this.sdk.client.getSchool(+this.cookieService.get('schoolId'))
    });
  }

  public loadLessons(params: {
    academicYearId: number;
    classId?: number;
    shiftId?: number;
    startDate?: string;
    endDate?: string;
  }): void {
    this.sdk.client
      .getLessonsCount(params).then(res => {
        let lessonSum = 0;
        if (res.count > 0) {
          lessonSum = res.count;
          this.warning.wTimetable = true;
        }
        else {
          this.warning.wTimetable = false;
        }
        this.warning.timetableCount = lessonSum;
      });
  }

  public loadFacilitiesDatasource(schoolId: number) {
    this.loadFacilities({
      page: 0,
      limit: 100,
      subject: null,
      schoolId: schoolId
    });
  }

  public loadFacilities(params?: IPageQuery & { subject?: number, schoolId?: number },
    hasFilterData: boolean = false) {
    const load = this.sdk.client.getRooms(params)
      .then(res => {
        if (res.count > 0) {
          this.warning.wFacilities = true;
        }
        else {
          this.warning.wFacilities = false;
        }
      });
  }
}
