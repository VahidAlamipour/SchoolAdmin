import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material';
import { FormGroup } from '@angular/forms';
import {
  fadeAnimation,
  widthAnimation,
  widthFadeAnimation
} from 'src/app/animations/animations';
import * as _ from 'lodash';

import { ScheduleSettingsService } from '../../services/schedule-settings.service';
import { TimesModalComponent } from '../../../modals/institutions-modal/times-modal/times-modal.component';
import { ShiftTime } from 'src/app/models/interfaces.model';
import { formControls } from '../../models/formcontrols.model';

@Component({
  selector: 'shifts-block',
  templateUrl: './shifts-block.component.html',
  animations: [fadeAnimation, widthAnimation, widthFadeAnimation]
})
export class ShiftsBlockComponent {
  @Input()
  public parentForm: FormGroup;
  @Input()
  public yearCanBeEdited: boolean;

  public formControls = formControls;

  get timeListsNotEmpty(): boolean {
    let notEmpty = false;
    this.service.shiftsList.forEach(list => {
      if (list.timesList.length !== 0) {
        notEmpty = true;
        return false;
      }
    });
    return notEmpty;
  }

  get canBeEdited(): boolean {
    return this.service.editMode;
  }

  constructor(
    private dialog: MatDialog,
    public service: ScheduleSettingsService
  ) {}

  public shiftCanBeDeleted(times: ShiftTime[]): boolean {
    return !times.some(time => time.isBlocked);
  }

  public deleteShift(index: number): void {
    if (this.service.shiftCanBeDeleted && index > -1) {
      this.service.shiftsList.splice(index, 1);
      this.service.updateShiftsNames();
    }
    this.service.markShiftsListAsDirty();
  }

  public addTimeModal(index: number): void {
    this.dialog
      .open(TimesModalComponent, {
        panelClass: ['modal', 'noheight', 'addtime']
      })
      .beforeClosed()
      .subscribe({
        next: result => (result ? this.addTimeToShift(result, index) : null)
      });
  }

  private addTimeToShift(time: any, index: number): void {
    this.service.shiftsList[index].timesList.push(time);
    this.checkTimesForDuplicates(index);
    this.sortByTime(index);
  }

  public deleteTime(listIndex: number, timeIndex: number): void {
    if (timeIndex > -1) {
      this.service.shiftsList[listIndex].timesList.splice(timeIndex, 1);
    }
    this.checkTimesForDuplicates(listIndex);
    this.sortByTime(listIndex);
  }

  private checkTimesForDuplicates(index: number): void {
    const list = this.service.shiftsList[index].timesList;
    const counts = _.countBy(list, 'clientId');
    if (list && list.length !== 0) {
      list.forEach(
        (time: ShiftTime) => (time.isDuplicate = counts[time.clientId] > 1)
      );
    }
  }

  private sortByTime(index: number): void {
    this.service.shiftsList[index].timesList.sort(
      (a, b) => +a.start.replace(':', '') - +b.start.replace(':', '')
    );
    this.service.markShiftsListAsDirty();
  }
}
