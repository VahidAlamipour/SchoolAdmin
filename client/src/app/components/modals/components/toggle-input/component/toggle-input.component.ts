import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { VALIDATION_MESSAGES } from '../../validation_messages';

@Component({
  selector: 'toggle-input',
  templateUrl: './toggle-input.component.html'
})
export class ToggleInputComponent implements OnInit, OnChanges {
  @Input() label: string;
  @Input() required = false;
  @Input() disabled = false;

  @Input() parentForm: FormGroup;
  @Input() formName: string;

  @Input() mainStyle: any;
  @Input() labelStyle: any;

  private initDisable: boolean;

  public validation_messages = VALIDATION_MESSAGES;

  constructor() {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.disabled) {
      if (this.initDisable && !changes.disabled.currentValue) {
        this.parentForm.controls[this.formName].enable();
      } else if (this.initDisable && changes.disabled.currentValue) {
        this.parentForm.controls[this.formName].disable();
      }
    }
  }

  ngOnInit() {
    if (this.required) {
      this[this.formName] = new FormControl(false, Validators.required);
    } else {
      this[this.formName] = new FormControl(false);
    }
    if (this.disabled) {
      this.parentForm.controls[this.formName].disable();
      this.initDisable = true;
    }
    this.parentForm.addControl(this.formName, this[this.formName]);
  }
}
