import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-add-year-modal',
  templateUrl: './add-year-modal.component.html'
})
export class AddYearModalComponent {
  public dateForm: FormGroup = this.fb.group({});
  //#region
  public createModeList = [
    { label: "Blank academic year", id: 0, "checked": true },
    { label: "Duplicate an academic year", id: 1, "checked": false }
  ];
  public _createModeOption = '';
  //#endregion
  constructor(
    private dialogRef: MatDialogRef<AddYearModalComponent>,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data
  ) {
  }
  /**
   * onCheckCreateStatus
   */
  public onChangeCreateMode(mrChange) {
    this._createModeOption = mrChange.value;
  }
  public addYearDisabler() {
    if (this._createModeOption) {
      if (this.dateForm.invalid) {
        return true;
      }
      return !(this.dateForm.controls.duplicatedYear && this.dateForm.controls.duplicatedYear.value);
    } else {
      return this.dateForm.invalid;
    }

  }
  public onClick(action: boolean) {
    if (action) {
      let value = { ...this.dateForm.value.academicYear };
      if (this._createModeOption) {
        value = {
          ...this.dateForm.value.duplicatedYear,
          id: this.dateForm.value.academicYear.id,
          name: this.dateForm.value.academicYear.name
        };
        delete value.yearId;
        delete value.terms;
        value.shifts.forEach(shift => {
          shift.times.forEach(time => {
            time.isBlocked = false;
          });
        });
        value.duplicatedYearId = this.dateForm.value.duplicatedYear.id;
      }
      this.dialogRef.close(value);
    } else {
      this.dialogRef.close(action);
    }
  }
}
