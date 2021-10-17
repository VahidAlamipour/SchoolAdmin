import { Injectable } from '@angular/core';
import { catchError, finalize } from 'rxjs/operators';
import { BehaviorSubject, of, from } from 'rxjs';

import { SdkService } from 'src/app/services/sdk.service';
import { CookieService } from 'ngx-cookie-service';
import {
  ISegment,
  ILevel,
  IClass,
  IStructure,
  ICity,
  ISchool,
  IAcademicYear
} from '../../../../../sdk/interfaces';

@Injectable()
export class SLCService {
  public selectedSchool: { city: ICity; school: ISchool } = {
    city: null,
    school: null
  };
  // data subjects
  public structureSubject = new BehaviorSubject<IStructure>({
    academicYears: [],
    segments: [],
    levels: [],
    classes: [],
    activeAcademicYear: null,
  });
  public levelsSubject = new BehaviorSubject<ILevel[]>([]);
  public classesSubject = new BehaviorSubject<IClass[]>([]);

  public structure$ = this.structureSubject.asObservable();
  public levels$ = this.levelsSubject.asObservable();
  public classes$ = this.classesSubject.asObservable();
  // loading subjects
  private loadingStructureSubject = new BehaviorSubject<boolean>(false);
  public loadingStructure$ = this.loadingStructureSubject.asObservable();

  ////
  private loadingYearsSubject = new BehaviorSubject<boolean>(false);
  public loadingYears$ = this.loadingYearsSubject.asObservable();

  public yearsSubject = new BehaviorSubject<IAcademicYear[]>([]);
  public years$ = this.yearsSubject.asObservable();

  private loadingSegmentsSubject = new BehaviorSubject<boolean>(false);
  public loadingSegments$ = this.loadingSegmentsSubject.asObservable();

  private segmentsSubject = new BehaviorSubject<ISegment[]>([]);
  public segments$ = this.segmentsSubject.asObservable();

  private loadingLevelsSubject = new BehaviorSubject<boolean>(false);
  public loadingLevels$ = this.loadingLevelsSubject.asObservable();

  private loadingClassesSubject = new BehaviorSubject<boolean>(false);
  public loadingClasses$ = this.loadingClassesSubject.asObservable();

  public activeYearSubject = new BehaviorSubject<IAcademicYear>(null);
  public activeYear$ = this.activeYearSubject.asObservable();  

  public editPageRedir: boolean; 

  constructor(private sdk: SdkService, private cookieService: CookieService,) { }

  public async loadSchoolData(): Promise<any> {
    return await Promise.resolve({
      allYears: await this.sdk.client
        .getAcademicYears({ schoolId: +this.cookieService.get('schoolId'), limit: -1 })
        .then((data) => data.list),
      school : await this.sdk.client.getSchool(+this.cookieService.get('schoolId'))
    });
  }

  public getStructure(
    loadingData = this.loadingStructureSubject,
    mode?: string
  ): void {

    loadingData.next(true);
    from(this.sdk.client.getSchoolStructure(true))
      .pipe(
        catchError(() => of([])),
        finalize(() => loadingData.next(false))
      )
      .subscribe(
        (res: IStructure) => {
          switch (mode) {
            case 'year':
              break;
            case 'segment':
              const sSelectedYearId = +localStorage.getItem(
                'yearSelected'
              );
              var yearClass= res.classes.filter(cl=> cl.yearId == +sSelectedYearId);
              // res.classes.forEach(item=>{
              //   if(item.yearId == sSelectedYearId){
              //     console.log(item)
              //   }
              // })
              let tempSegments = res.segments;
              tempSegments.forEach((segment)=>{
                var stuCounter = 0;
                var blongsLevels = res.levels.filter(level=>level.segmentId == segment.id);

                var blongsLevelIds = blongsLevels.map(level=>level.id);
                var segClasses = yearClass.filter(cl=> blongsLevelIds.indexOf(cl.levelId) >= 0);

                segClasses.forEach(cl=>{stuCounter +=cl.studentsCount});
                
                segment.studentsCount = stuCounter;
              })
              this.segmentsSubject.next(tempSegments);
              break;

            case 'level':
              this.structureSubject.next(res);
              const selectedSegmentId = +localStorage.getItem(
                'segmentSelected'
              ); 

              const lSelectedYearId = +localStorage.getItem(
                'yearSelected'
              )

              let levelsIdsInSegment = [];
              const tempLevels = [];
              //let segStudents = 0;

              res.segments.forEach(segment => {
                if (segment.id === selectedSegmentId) {
                  levelsIdsInSegment = segment.levels;
                }
              });
              res.levels.forEach(levelInStructure => {
                if (levelsIdsInSegment) {
                  levelsIdsInSegment.forEach(idInSegment => {
                    if (levelInStructure.id === idInSegment) {
                      //#region class count fixer
                      var levelclasses = res.classes.filter(x => x.levelId == levelInStructure.id &&
                        x.yearId == lSelectedYearId);
                        let stCounter = 0;
                      levelInStructure.classesIds = levelclasses.map(x => {
                        stCounter += x.studentsCount;
                        return x.id
                      });
                      levelInStructure.classesCount = levelclasses.length;
                      //segStudents += stCounter;
                      levelInStructure.studentsCount = stCounter;
                      //#endregion
                      tempLevels.push(levelInStructure);
                    }
                  });
                }
              });
              this.levelsSubject.next(tempLevels);
              
              break;
            case 'class':
              this.structureSubject.next(res);
              const selectedYearId = +localStorage.getItem(
                'yearSelected'
              );
              const selectedLevelId = +localStorage.getItem('levelSelected');
              const tempClasses = [];
              res.classes.forEach(classs => {
                if (classs.levelId === selectedLevelId && classs.yearId === selectedYearId) {
                  tempClasses.push(classs);
                }
              });
              this.classesSubject.next(tempClasses);
              break;

            default:
              this.structureSubject.next(res);
              this.segmentsSubject.next(res.segments);
             // this.yearsSubject.next(res.academicYears);
              break;
          }
        },
        error => console.error('got an error: ' + error)
      );
    
  }



  public getYears(): void {
    this.getStructure(this.loadingYearsSubject, 'year');
  }

  public getSegments(): void {
    this.getStructure(this.loadingSegmentsSubject, 'segment');
  }

  public getLevels(): void {
    this.getStructure(this.loadingLevelsSubject, 'level');
  }

  public getClasses(): void {
    this.getStructure(this.loadingClassesSubject, 'class');
  }
}
