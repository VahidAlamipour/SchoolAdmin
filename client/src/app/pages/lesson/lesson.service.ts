import { Injectable } from '@angular/core';
import { from, BehaviorSubject, Observable } from 'rxjs';
import * as _ from 'lodash';

import { SdkService } from 'src/app/services/sdk.service';
import { ISubject, ISubGroup, IStudent, ITeacher, IRoom, IClass } from '../../../../../sdk/interfaces';

@Injectable()
export class LessonService {
  private _selectedClassId: number;
  public educationClass: IClass;

  private coursesSubject: BehaviorSubject<ISubject[]> = new BehaviorSubject<ISubject[]>([]);
  public allLearnersLists: Array<any> = new Array();
  public allLearnersSubject: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);

  public courses$ = this.coursesSubject.asObservable();

  set selectedClassId(classId: number) {
    this._selectedClassId = classId;
  }
  get selectedClassId() {
    return this._selectedClassId;
  }

  constructor(private sdk: SdkService) {}

  public getCourses(): void {
    if (this.coursesSubject.value.length === 0) {
      this.sdk.client.getSubjects({ limit: -1 }).then((data) => this.coursesSubject.next(data.list));
    }
  }

  public resetCourses(): void {
    this.sdk.client.getSubjects({ limit: -1 }).then((data) => this.coursesSubject.next(data.list));
  }

  public getEducators(courseId: number): Observable<ITeacher[]> {
    const educatorsSubject: BehaviorSubject<ITeacher[]> = new BehaviorSubject<ITeacher[]>([]);
    const educatorsSubscription = from(
      this.sdk.client.getTeachers({ limit: -1, subjectId: courseId, levelId: this.educationClass.level.id })
    ).subscribe(
      (data) => educatorsSubject.next(data.list),
      (error) => console.log('get educators error', error),
      () => educatorsSubscription.unsubscribe()
    );
    return educatorsSubject.asObservable();
  }

  public getFacilities(courseId: number): Observable<IRoom[]> {
    const roomsSubject: BehaviorSubject<IRoom[]> = new BehaviorSubject<IRoom[]>([]);
    const roomsSubscription = from(this.sdk.client.getRooms({ limit: -1, subject: courseId })).subscribe(
      (data) => roomsSubject.next(data.list),
      (error) => console.log('get facilities error', error),
      () => roomsSubscription.unsubscribe()
    );
    return roomsSubject.asObservable();
  }

  public getSubGroup(courseId: number): Observable<ISubGroup[]> {
    const subgroupSubject: BehaviorSubject<ISubGroup[]> = new BehaviorSubject<ISubGroup[]>([]);
    const subgroupSubscription = from(
      this.sdk.client.getGroups({
        limit: -1,
        classId: this.selectedClassId,
        subjectId: courseId
      })
    ).subscribe(
      (data) => {
        if (data && data.list && data.list[0]) {
          subgroupSubject.next(data.list[0].subgroups);
        } else {
          subgroupSubject.next([]);
        }
      },
      (error) => console.log('getSubGroup error', error),
      () => subgroupSubscription.unsubscribe()
    );
    return subgroupSubject.asObservable();
  }

  public getLearnersList(subgroupId: number, index: number): void {
    this.sdk.client
      .getSubGroup(subgroupId)
      .then(
        (data) =>
          (this.allLearnersLists[index] = data.students.map((learner: IStudent & { isDuplicate: boolean }) => ({
            ...Object.assign({}, learner),
            isDuplicate: false
          })))
      )
      .finally(() => this.updateLearnersSubject());
  }

  public checkForDupLearners(): void {
    const merged = [].concat.apply([], this.allLearnersLists);
    const counts = _.countBy(merged, 'id');
    if (this.allLearnersLists && this.allLearnersLists.length !== 0) {
      this.allLearnersLists.forEach((learnersList) => {
        learnersList.forEach((learner: IStudent & { isDuplicate: boolean }) => {
          learner.isDuplicate = false;
          if (counts[learner.id] > 1) {
            learner.isDuplicate = true;
          }
        });
      });
      this.allLearnersSubject.next(this.allLearnersLists);
    }
  }

  public updateLearnersSubject(): void {
    this.allLearnersSubject.next(this.allLearnersLists);
    this.checkForDupLearners();
  }

  public clearLearnersList(): void {
    this.allLearnersSubject.next([]);
    this.allLearnersLists = [];
  }
}
