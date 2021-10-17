import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { fadeAnimation } from 'src/app/animations/animations';
import * as moment from 'moment';

import { VALIDATION_MESSAGES } from '../../components/validation_messages';
import { ShiftTime } from 'src/app/models/interfaces.model';

@Component({
  selector: 'app-times-modal',
  templateUrl: './times-modal.component.html',
  animations: [fadeAnimation]
})
export class TimesModalComponent {
  public validation_messages = VALIDATION_MESSAGES;
  public hours: Array<number> = Array.apply(null, { length: 24 }).map(
    (value: any, index: number) => index
  );
  private minuteStep = 5;
  public minutes: Array<string> = [];

  public selectedStartHour: number = this.hours[11];
  public selectedStartMinute = '00';
  public selectedEndHour: number = this.hours[12];
  public selectedEndMinute = '00';

  get startIsBefore(): boolean {
    const startMom = moment(this.getTheTime().start, 'HH:mm');
    const endMom = moment(this.getTheTime().end, 'HH:mm');
    return startMom.isBefore(endMom);
  }

  constructor(public dialogRef: MatDialogRef<TimesModalComponent>) {
    this.setMinutes();
  }

  private setMinutes(): void {
    let startTime = 0;
    for (let i = 0; startTime < 60; i++) {
      const mm = startTime % 60;
      this.minutes[i] = ('0' + mm).slice(-2);
      startTime = startTime + this.minuteStep;
    }
  }

  private getTheTime(): ShiftTime {
    return {
      start: `${this.selectedStartHour}:${this.selectedStartMinute}`,
      end: `${this.selectedEndHour}:${this.selectedEndMinute}`,
      clientId:
        this.selectedStartHour +
        this.selectedStartMinute +
        this.selectedEndHour +
        this.selectedEndMinute,
      isDuplicate: false
    };
  }

  public onClick(action) {
    if (action) {
      this.dialogRef.close(this.getTheTime());
    } else {
      this.dialogRef.close(action);
    }
  }
}
