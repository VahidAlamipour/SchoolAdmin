import {
  Component,
  OnInit,
  Input,
  HostBinding,
  SimpleChanges,
  OnChanges
} from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { VALIDATION_MESSAGES } from '../../validation_messages';
import { fadeAnimation } from 'src/app/animations/animations';

@Component({
  selector: 'check-line',
  templateUrl: './check-line.component.html',
  animations: [fadeAnimation]
})
export class CheckLineComponent implements OnInit, OnChanges {
  @HostBinding('class.disabled') disabledClass = false;

  @Input() label: string;
  @Input() placeholder: string;
  @Input() required = false;
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() dataItems: [];

  @Input() parentForm: FormGroup;
  @Input() formName: string;

  public validation_messages = VALIDATION_MESSAGES;
  public showPlaceholder: string;
  private initDisable: boolean;

  constructor() {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.disabled) {
      if (this.initDisable && !changes.disabled.currentValue) {
        this[this.formName].enable();
        this.disabledClass = false;
      } else if (this.initDisable && changes.disabled.currentValue) {
        this[this.formName].disable();
        this.disabledClass = true;
      }
    }
    if (
      (this.dataItems && this.dataItems.length === 0) ||
      this.dataItems === undefined
    ) {
      this.showPlaceholder = `No data for ${this.label.toLowerCase()}.`;
    } else {
      this.showPlaceholder = this.placeholder;
    }
  }

  ngOnInit() {
    if (this.required) {
      this[this.formName] = new FormControl([], Validators.required);
    } else {
      this[this.formName] = new FormControl([]);
    }
    if (this.disabled) {
      this[this.formName].disable();
      this.initDisable = true;
      this.disabledClass = true;
    }
    this.parentForm.addControl(this.formName, this[this.formName]);
  }

  public selectItem(item: any): void {
    const formValue = this.parentForm.controls[this.formName].value;
    const selectedItems = formValue ? formValue : [];
    if (!this.disabled && !this.readonly) {
      if (this.isSelected(item)) {
        const index = selectedItems.indexOf(item);
        selectedItems.splice(index, 1);
      } else {
        selectedItems.push(item);
      }
      this.parentForm.controls[this.formName].patchValue(selectedItems);
    }
  }

  public isSelected(item: any): boolean {
    return (
      this.parentForm.controls[this.formName].value &&
      this.parentForm.controls[this.formName].value.includes(item)
    );
  }
}
