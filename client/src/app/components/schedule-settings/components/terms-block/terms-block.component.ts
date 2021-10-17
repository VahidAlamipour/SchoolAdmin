import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { MatDialog } from '@angular/material';
import { FormGroup } from '@angular/forms';
import * as _ from 'lodash';
import * as moment from 'moment';

import { ScheduleSettingsService } from '../../services/schedule-settings.service';
import { TermsModalComponent } from 'src/app/components/modals/institutions-modal/terms-modal/terms-modal.component';
import { fadeAnimation } from 'src/app/animations/animations';
import { formControls } from '../../models/formcontrols.model';
import { TermsDates } from 'src/app/models/interfaces.model';
import { CONFIG } from 'src/app/config';

@Component({
  selector: 'terms-block',
  templateUrl: './terms-block.component.html',
  animations: [fadeAnimation]
})
export class TermsBlockComponent implements OnInit, OnDestroy {
  @Input()
  public parentForm: FormGroup;
  @Input()
  public yearCanBeEdited: boolean;

  public formControls = formControls;

  @Input()
  public academicYearsList: any[] = [];

  get termsNotEmpty(): boolean {
    return (
      this.parentForm.controls[formControls.termsControl].value &&
      this.parentForm.controls[formControls.termsControl].value.length !== 0
    );
  }

  get canBeEdited(): boolean {
    return this.service.editMode ? this.yearCanBeEdited : false;
  }

  constructor(
    private dialog: MatDialog,
    public service: ScheduleSettingsService
  ) {}

  ngOnInit() {}

  public addTermModal(): void {
    if (!this.parentForm.controls[formControls.academicYearControl].invalid) {
      this.dialog
        .open(TermsModalComponent, {
          panelClass: ['modal', 'noheight', 'periods'],
          autoFocus: false,
          data: { dates: this.getDatesForTerms() }
        })
        .beforeClosed()
        .subscribe({
          next: result => {
            if (result) {
              this.parentForm.controls[formControls.termsControl].patchValue([
                ...this.parentForm.controls[formControls.termsControl].value,
                ...[
                  {
                    startDate: moment(result.startDate).format(
                      CONFIG.VIEW_DATE_FORMAT
                    ),
                    endDate: moment(result.endDate).format(
                      CONFIG.VIEW_DATE_FORMAT
                    )
                  }
                ]
              ]);
              this.parentForm.controls[formControls.termsControl].markAsDirty();
              this.parentForm.controls[
                formControls.termsControl
              ].updateValueAndValidity();
            }
          }
        });
    }
  }

  private getDatesForTerms(): TermsDates {
    const terms = this.parentForm.controls[formControls.termsControl].value;
    const academicYear = this.parentForm.controls[
      formControls.academicYearControl
    ].value;
    const dates: any = {
      startDate: null,
      endDate: new Date(academicYear.name.split(' - ')[1], 11, 31),
      academicYearsList: this.academicYearsList,
      currentFormYearId: academicYear ? academicYear.id : null,
      terms: terms
    };
    if (terms.length !== 0) {
      const lastTerm = this.parentForm.controls[formControls.termsControl]
        .value[terms.length - 1];
      dates.startDate = moment(
        lastTerm.endDate,
        CONFIG.VIEW_DATE_FORMAT
      ).add(1, 'days').toDate();
    } else {
      dates.startDate = new Date(academicYear.name.split(' - ')[0], 0, 1);
    }
    return dates;
  }

  public deleteTerm(index: number, isLast: boolean): void {
    const control = this.parentForm.controls[formControls.termsControl];
    if (index > -1 && isLast) {
      control.value.splice(index, 1);
    }
    control.markAsDirty();
    control.updateValueAndValidity();
  }

  ngOnDestroy() {}
}
