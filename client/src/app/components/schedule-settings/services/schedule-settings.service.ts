import { Injectable } from '@angular/core';
import * as _ from 'lodash';

import { SdkService } from 'src/app/services/sdk.service';
import { Shift } from 'src/app/models/interfaces.model';
import { IDay, IAcademicYear } from '../../../../../../sdk/interfaces';

@Injectable()
export class ScheduleSettingsService {
  public editMode: boolean;
  public allDays: IDay[];
  public shiftsList: Shift[] = [];
  public originAcademicYearslist: IAcademicYear[];
  public shiftsListIsDirty = false;
  public activeAcademicYearId: number = null;
  public selectedHomeRoomClassesArrOri: any[] = [];
  public selectedHomeRoomClassesArr: any[] = [];
  public selectedItemsArr: any[] = [];

  get shiftCanBeAdded(): boolean {
    return this.shiftsList.length < 3;
  }
  get shiftCanBeDeleted(): boolean {
    return this.shiftsList.length > 1;
  }
  get shiftsNotEmpty(): boolean {
    return (
      this.shiftsList && this.shiftsList.length !== 0 && this.timeListsNotEmpty
    );
  }
  get timeListsNotEmpty(): boolean {
    let notEmpty = false;
    this.shiftsList.forEach(list => {
      if (list.timesList.length !== 0) {
        notEmpty = true;
        return false;
      }
    });
    return notEmpty;
  }
  get timeListsHasEmpty(): boolean {
    let hasEmpty = false;
    this.shiftsList.forEach(list => {
      if (list.timesList.length === 0) {
        hasEmpty = true;
        return false;
      }
    });
    return hasEmpty;
  }
  get shiftsHasDuplicates(): boolean {
    let hasDuplicates = false;
    this.shiftsList.forEach(list =>
      list.timesList.forEach(time => {
        if (time.isDuplicate) {
          hasDuplicates = true;
          return false;
        }
      })
    );
    return hasDuplicates;
  }
  get shiftsValid(): boolean {
    const length = this.shiftsList.length !== 0;
    const timeListsNotEmpty = !this.timeListsHasEmpty;
    return length && timeListsNotEmpty && !this.shiftsHasDuplicates;
  }


  constructor(private sdk: SdkService) { }

  public loadYears(institutionId?: number): Promise<any> {
    return this.sdk.client.getYears(
      institutionId ? { schoolId: institutionId } : null
    );
  }

  public loadDays(countryId?: number): void {
    this.sdk.client
      .getDays({ ...(countryId ? { countryId: countryId } : null) })
      .then(
        days =>
        (this.allDays = days.map((day: any) => ({
          ...Object.assign({}, day),
          code: day.code.substring(0, 3)
        })))
      );
  }

  public loadAcademicYears(institutionId: number): Promise<any> {
    return new Promise(resolve =>
      this.sdk.client
        .getAcademicYears({ schoolId: institutionId, limit: -1 })
        .then(data => (this.originAcademicYearslist = data.list))
        .finally(() => resolve(true))
    );
  }
  public async loadActiveAcademicYear(institutionId: number): Promise<boolean> {
    let school = await this.sdk.client.getSchool(institutionId);
    this.activeAcademicYearId = school.activeAcademicYear;
    return true
  }

  // SHIFTS BLOCK
  private emptyShift(): Shift {
    return {
      name: `${this.shiftsList.length + 1} shift`,
      timesList: []
    };
  }

  public addShift(): void {
    if (this.shiftCanBeAdded) {
      this.shiftsList.push(this.emptyShift());
      this.updateShiftsNames();
    }
  }

  public updateShiftsNames(): void {
    this.shiftsList.forEach(
      shift => (shift.name = `${this.shiftsList.indexOf(shift) + 1} shift`)
    );
  }

  public markShiftsListAsDirty(): void {
    this.shiftsListIsDirty = true;
  }
}
