import { Injectable } from '@angular/core';
import { Observable, from, zip, BehaviorSubject } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { CookieService } from 'ngx-cookie-service';

import { SdkService } from 'src/app/services/sdk.service';
import { AuthService } from 'src/app/auth/auth.service';
import { IPageResponse } from '../../../../../sdk/sdk';
import {
  IParent,
  ITeacher,
  IStudent,
  IAdministrator,
  IStructure,
  ISegment,
  ILevel
} from '../../../../../sdk/interfaces';

@Injectable()
export class BigSearchService {
  private dl = 0;

  constructor(
    private sdk: SdkService,
    private cookieService: CookieService,
    private authService: AuthService
  ) { }

  public getAllUsers(
    query: string
  ): Observable<(IStudent[] | IParent[] | ITeacher[])[]> {
    const learners = this.sdk.client
      .getStudents({
        query: query,
        limit: this.dl
      })
      .then(res => {
        const learnersList = [];
        res.list.forEach(learner => {
          const tempitem: IStudent & { type?: string } = learner;
          tempitem.type = 'learner';
          learnersList.push(tempitem);
        });
        return learnersList;
      });
    const parents = this.sdk.client
      .getParents({
        query: query,
        limit: this.dl,
        schoolId: +this.cookieService.get('schoolId')
      })
      .then(res => {
        const parentsList = [];
        res.list.forEach(parent => {
          const tempitem: IParent & { type?: string } = parent;
          tempitem.type = 'parent';
          parentsList.push(tempitem);
        });
        return parentsList;
      });
    const educators = this.sdk.client
      .getTeachers({
        query: query,
        limit: this.dl
      })
      .then(res => {
        const educatorsList = [];
        res.list.forEach(educator => {
          const tempitem: ITeacher & { type?: string } = educator;
          tempitem.type = 'educator';
          educatorsList.push(tempitem);
        });
        return educatorsList;
      });

    return this.authService.isAccountAdmin
      ? zip(
        from(learners),
        from(parents),
        from(educators),
        from(
          this.sdk.client
            .getAdmins({
              query: query,
              limit: this.dl
            })
            .then(res => {
              const staffList = [];
              res.list.forEach(admin => {
                const tempitem: IAdministrator & { type?: string } = admin;
                tempitem.type = 'staff';
                staffList.push(tempitem);
              });
              return staffList;
            })
        )
      )
      : zip(from(learners), from(parents), from(educators));
  }

  public getLearners(query: string): Observable<IStudent[]> {
    const learnersDataSubject = new BehaviorSubject<IStudent[]>([]);
    this.sdk.client
      .getStudents({ query: query, limit: this.dl })
      .then((data: IPageResponse<IStudent>) =>
        learnersDataSubject.next(data.list)
      );
    return learnersDataSubject.asObservable();
  }

  public getParents(query: string): Observable<IParent[]> {
    const parentsDataSubject = new BehaviorSubject<IParent[]>([]);
    this.sdk.client
      .getParents({
        query: query,
        limit: this.dl,
        schoolId: +this.cookieService.get('schoolId')
      })
      .then((data: IPageResponse<IParent>) =>
        parentsDataSubject.next(data.list)
      );
    return parentsDataSubject.asObservable();
  }

  public getEducators(query: string): Observable<ITeacher[]> {
    const educatorsDataSubject = new BehaviorSubject<ITeacher[]>([]);
    this.sdk.client
      .getTeachers({ query: query, limit: this.dl })
      .then((data: IPageResponse<ITeacher>) =>
        educatorsDataSubject.next(data.list)
      );
    return educatorsDataSubject.asObservable();
  }

  public getStaff(query: string): Observable<IAdministrator[]> {
    const staffDataSubject = new BehaviorSubject<IAdministrator[]>([]);
    this.sdk.client
      .getAdmins({
        query: query,
        limit: this.dl
      })
      .then((data: IPageResponse<IAdministrator>) =>
        staffDataSubject.next(data.list)
      );
    return staffDataSubject.asObservable();
  }

  public getStructureByClass(item: IStudent): Observable<boolean> {
    const loadSubject = new BehaviorSubject<boolean>(true);
    from(this.sdk.client.getSchoolStructure())
      .pipe(finalize(() => loadSubject.next(false)))
      .subscribe((data: IStructure) => {
        if (item.educationalClass)
          localStorage.setItem('yearSelected', item.educationalClass.yearId.toString());
        data.segments.forEach((segment: ISegment) => {
          segment.levels.forEach(level => {
            if (level === item.educationalClass.levelId) {
              localStorage.setItem('segmentSelected', segment.id.toString());
            }
          });
        });
        data.levels.forEach((level: ILevel) => {
          if (level.id === item.educationalClass.levelId) {
            localStorage.setItem('levelSelected', level.id.toString());
          }
        });
      });
    localStorage.setItem('classSelected', item.educationalClass.id.toString());
    return loadSubject.asObservable();
  }
}
