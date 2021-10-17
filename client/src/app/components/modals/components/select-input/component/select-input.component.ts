import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter
} from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { VALIDATION_MESSAGES } from '../../validation_messages';

@Component({
  selector: 'select-input',
  templateUrl: './select-input.component.html'
})
export class SelectInputComponent implements OnInit, OnChanges {
  @Input() label: string;
  @Input() placeholder: string;
  @Input() dataItems: [];
  @Input() zeroOption = false;
  @Input() required = false;
  @Input() disabled = false;
  @Input() readonly = false;
  // @Input() addButton = false;
  @Input() addButtonLabel: string;

  @Input() parentForm: FormGroup;
  @Input() formName: string;

  @Output() selectionChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() addEvent: EventEmitter<any> = new EventEmitter<any>();

  public showLabel = true;
  public showPlaceholder: string;
  private initDisable: boolean;
  public validation_messages = VALIDATION_MESSAGES;

  public compareFn: ((f1: any, f2: any) => boolean) | null = this
    .compareByValue;

  get showAddButton(): boolean {
    return this.addButtonLabel
      ? !this.dataItems || this.dataItems.length === 0
      : false;
  }

  constructor() {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.disabled) {
      if (this.initDisable && !changes.disabled.currentValue) {
        this.parentForm.controls[this.formName].enable();
      } else if (this.initDisable && changes.disabled.currentValue) {
        this.parentForm.controls[this.formName].disable();
      }
    }
    if (changes.readonly) {
      if (this.initDisable && !changes.readonly.currentValue) {
        this.parentForm.controls[this.formName].enable();
      } else if (this.initDisable && changes.readonly.currentValue) {
        this.parentForm.controls[this.formName].disable();
      }
    }
    if (
      (this.dataItems && this.dataItems.length === 0) ||
      this.dataItems === undefined
    ) {
      if (this.label === 'nolabel') {
        this.showPlaceholder = `No ${this.formName.toLowerCase()} data`;
      } else {
        this.showPlaceholder = `No ${this.label.toLowerCase()} data`;
      }
    } else {
      this.showPlaceholder = this.placeholder;
    }
  }

  ngOnInit() {
    if (this.required) {
      this[this.formName] = new FormControl('', Validators.required);
    } else {
      this[this.formName] = new FormControl('');
    }
    if (this.label === 'nolabel') {
      this.showLabel = false;
    }
    this.parentForm.addControl(this.formName, this[this.formName]);
    if (this.disabled || this.readonly) {
      this.parentForm.controls[this.formName].disable();
      this.initDisable = true;
    }
  }

  public itemTitle(item: any): string {
    let string = '';

    if (this.formName === 'class') {
      if (!item.showName) {
        string = `${item.level.name}${item.name}`;
      } else {
        string = `${item.name}`;
      }
      return `${string}`;
    }
    if (this.formName === 'time') {
      string = `${item.start} - ${item.end}`;
      return `${string}`;
    }
    if (this.formName === 'group') {
      string = `Subclass "${item.name}"`;
      return `${string}`;
    }
    if (item.name) {
      if (item.lastName) {
        string = `${item.name} ${item.lastName}`;
      } else {
        string = item.name;
      }
    } else {
      string = item;
    }

    return `${string}`;
  }

  // function for setting select
  private compareByValue(f1: any, f2: any) {
    if (f1 && f2) {
      if (f1.id && f2.id) {
        return f1 && f2 && f1.id === f2.id;
      }
      return f1 && f2 && f1 === f2;
    }
  }
}
