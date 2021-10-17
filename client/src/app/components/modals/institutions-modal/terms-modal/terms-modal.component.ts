import {
  Component,
  Inject,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import * as moment from 'moment';
import { IAcademicYear } from '../../../../../../../sdk/interfaces';
@Component({
  selector: 'app-terms-modal',
  templateUrl: './terms-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TermsModalComponent implements OnInit, OnDestroy {
  public minStartDate: Date;
  public maxStartDate: Date;

  public minEndDate: Date;
  public maxEndDate: Date;

  public dateForm: FormGroup;

  private startDateSubscription: Subscription;
  
  public academicYearsList:IAcademicYear[] = [];

  public currentYearId?: number;
  public terms = []
  constructor(
    public dialogRef: MatDialogRef<TermsModalComponent>,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data
  ) {
    this.minStartDate = data.dates.startDate;
    this.maxStartDate = this.maxEndDate = data.dates.endDate;
    this.dateForm = this.fb.group({ startDate: ['', Validators.required] });
    this.academicYearsList = data.dates.academicYearsList;
    this.currentYearId = data.dates.currentFormYearId;
    this.terms = data.dates.terms;
  }

  ngOnInit() {
    this.startDateSubscription = this.dateForm.controls.startDate.valueChanges.subscribe(
      date => {
        this.dateForm.controls.endDate.reset();
        this.minEndDate = moment(date)
          .add(1, 'days')
          .toDate();
      }
    );
  }

  public onClick(action) {
    if (action) {
      this.dialogRef.close(this.dateForm.value);
    } else {
      this.dialogRef.close(action);
    }
  }

  public datesOverlapped(): boolean {
    if((this.dateForm.controls.startDate || this.dateForm.controls.endDate) && this.academicYearsList && this.academicYearsList.length > 0) {
      for(let y of this.academicYearsList) {
        if(y && y.terms && y.id != this.currentYearId) {
          if(this.dateForm.controls.startDate && this.dateForm.controls.startDate.value) {
            if(moment(this.dateForm.controls.startDate.value, 'YYYY-MM-DD').isBetween(
              moment(y.terms[0].start).format('YYYY-MM-DD'),
              moment(y.terms[y.terms.length - 1].end).format('YYYY-MM-DD')) ||
              moment(this.dateForm.controls.startDate.value).format('YYYY-MM-DD') === moment(y.terms[0].start).format('YYYY-MM-DD') ||
              moment(this.dateForm.controls.startDate.value).format('YYYY-MM-DD') === moment(y.terms[y.terms.length - 1].end).format('YYYY-MM-DD')) {
              this.dateForm.get('startDate').invalid;
              return true;
            }
          }
          if(this.dateForm.controls.endDate && this.dateForm.controls.endDate.value) {
            if(moment(this.dateForm.controls.endDate.value, 'YYYY-MM-DD').isBetween(
              moment(y.terms[0].start).format('YYYY-MM-DD'),
              moment(y.terms[y.terms.length - 1].end).format('YYYY-MM-DD')) ||
              moment(this.dateForm.controls.endDate.value).format('YYYY-MM-DD') === moment(y.terms[0].start).format('YYYY-MM-DD') ||
              moment(this.dateForm.controls.endDate.value).format('YYYY-MM-DD') === moment(y.terms[y.terms.length - 1].end).format('YYYY-MM-DD')) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  public currentAcademicYeardatesOverlapped(): boolean {
    if(this.dateForm.controls.startDate.value && this.terms && this.terms.length > 0) {
       for(const term of this.terms) {
          if(term.endDate && term.endDate === moment(this.dateForm.controls.startDate.value).format('DD/MM/YYYY')) {
            return true;
          }
       }
    }
    return false;
  }

  ngOnDestroy() {
    this.startDateSubscription.unsubscribe();
  }
}
