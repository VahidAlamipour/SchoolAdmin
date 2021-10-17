import {
  Component,
  OnInit,
  Input,
  SimpleChanges,
  OnChanges
} from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MAT_DATE_FORMATS } from '@angular/material';

import { FULLDATE_FORMAT } from '../formats';
import { VALIDATION_MESSAGES } from '../../validation_messages';

@Component({
  selector: 'fulldate-input',
  templateUrl: './fulldate-input.component.html',
  providers: [{ provide: MAT_DATE_FORMATS, useValue: FULLDATE_FORMAT }]
})
export class FulldateInputComponent implements OnInit, OnChanges {
  public validation_messages = VALIDATION_MESSAGES;

  @Input()
  public label: string;
  @Input()
  public placeholder: string;
  @Input()
  public parentForm: FormGroup;
  @Input()
  public formName: string;
  @Input()
  public disabled = false;
  @Input()
  public required = false;
  @Input()
  public minDate: Date;
  @Input()
  public maxDate = new Date();
  @Input()
  public startAt = new Date(1992, 1, 1);

  private initDisable: boolean;

  constructor() {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.disabled) {
      if (this.initDisable && !changes.disabled.currentValue) {
        this[this.formName].enable();
      } else if (this.initDisable && changes.disabled.currentValue) {
        this[this.formName].disable();
      }
    }
  }

  ngOnInit() {
    if (this.required) {
      this[this.formName] = new FormControl('', Validators.required);
    } else {
      this[this.formName] = new FormControl('');
    }
    this.parentForm.addControl(this.formName, this[this.formName]);
  }
}
