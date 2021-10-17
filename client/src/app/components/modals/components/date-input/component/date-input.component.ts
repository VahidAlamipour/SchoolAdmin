import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'date-input',
  templateUrl: './date-input.component.html'
})
export class DateInputComponent {
  @Input()
  public type: string;
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
  public maxDate: Date;
}
