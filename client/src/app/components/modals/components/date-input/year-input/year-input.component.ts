import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { MatDatepicker, MAT_DATE_FORMATS } from '@angular/material';
import * as moment from 'moment';

import { YEAR_FORMAT } from '../formats';

@Component({
  selector: 'year-input',
  templateUrl: './year-input.component.html',
  providers: [{ provide: MAT_DATE_FORMATS, useValue: YEAR_FORMAT }]
})
export class YearInputComponent implements OnInit {
  @Input()
  public label: string;
  @Input()
  public placeholder: string;
  @Input()
  public parentForm: FormGroup;
  @Input()
  public formName: string;

  public maxDate = new Date();
  public startAt = new Date(1992, 1, 1);

  constructor() {}

  ngOnInit() {
    this[this.formName] = new FormControl('');
    this.parentForm.addControl(this.formName, this[this.formName]);
  }

  public chosenYearHandler(
    date: moment.Moment,
    datepicker: MatDatepicker<moment.Moment>
  ) {
    this[this.formName].setValue(new Date(date.year(), 1, 1));
    datepicker.close();
  }
}
