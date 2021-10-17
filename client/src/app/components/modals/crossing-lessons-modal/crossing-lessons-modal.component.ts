import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

import { ICrossLesson, CrossLessons } from '../../../../../../sdk/interfaces';

@Component({
  selector: 'app-crossing-lessons-modal',
  templateUrl: './crossing-lessons-modal.component.html'
})
export class CrossingLessonsModalComponent {
  public crossLessons = CrossLessons;
  public selectedOption = CrossLessons.break;

  constructor(
    @Inject(MAT_DIALOG_DATA) public crossLessonsData: ICrossLesson[],
    public dialogRef: MatDialogRef<CrossingLessonsModalComponent>
  ) {}

  public onClick(action: CrossLessons): void {
    this.dialogRef.close(action);
  }
}
