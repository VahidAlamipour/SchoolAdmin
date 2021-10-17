import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { VALIDATION_MESSAGES } from '../../validation_messages';

@Component({
  selector: 'check-input',
  templateUrl: './check-input.component.html'
})
export class CheckInputComponent implements OnInit {
  @Input() label: string;
  @Input() required = false;

  @Input() parentForm: FormGroup;
  @Input() formName: string;

  public validation_messages = VALIDATION_MESSAGES;

  constructor() {}

  ngOnInit() {
    if (this.required) {
      this[this.formName] = new FormControl(false, Validators.required);
    } else {
      this[this.formName] = new FormControl(false);
    }
    this.parentForm.addControl(this.formName, this[this.formName]);
  }
}
