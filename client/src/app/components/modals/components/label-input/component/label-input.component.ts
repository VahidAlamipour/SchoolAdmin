import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { VALIDATION_MESSAGES } from '../../validation_messages';

@Component({
  selector: 'label-input',
  templateUrl: './label-input.component.html'
})
export class LabelInputComponent implements OnInit {
  @Input() label: string;
  @Input() placeholder: string;
  @Input() required = false;
  @Input() readonly = false;
  @Input() disabled = false;
  @Input() istextarea = false;

  @Input() parentForm: FormGroup;
  @Input() formName: string;
  @Input() type: string;
  @Output() ontextChanged = new EventEmitter<any>();
  @Input() textchanged: string;
  public validation_messages = VALIDATION_MESSAGES;
  @Output() selectionChange: EventEmitter<any> = new EventEmitter<any>();
  constructor() {}

  ngOnInit() {
    if (this.required) {
      this[this.formName] = new FormControl('', Validators.required);
    } else {
      this[this.formName] = new FormControl('');
    }
    this.parentForm.addControl(this.formName, this[this.formName]);
  }

  onTextChanged(event){
    this.textchanged = event.target.value;  
    this.changedValue( event.target.value)
  }

  public changedValue(text: any): void {
    this.ontextChanged.emit(text);
  }
}
