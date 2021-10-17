import {
  Component,
  OnChanges,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  SimpleChanges,
  HostListener,
  ChangeDetectionStrategy
} from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import {
  trigger,
  state,
  style,
  transition,
  animate
} from '@angular/animations';
import { Subscription } from 'rxjs';

import { VALIDATION_MESSAGES } from '../../validation_messages';
import { ScheduleSettingsService } from 'src/app/components/schedule-settings/services/schedule-settings.service';

@Component({
  selector: 'auto-input',
  templateUrl: './auto-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('selectorDrop', [
      state(
        'void',
        style({
          transform: 'scaleY(0.8) translateY(-20%)',
          minWidth: '100%',
          opacity: 0
        })
      ),
      state(
        'showing',
        style({
          opacity: 1,
          minWidth: 'calc(100% + 32px)',
          transform: 'scaleY(1) translateY(-20%)'
        })
      ),
      state(
        'showing-multiple',
        style({
          opacity: 1,
          minWidth: 'calc(100% + 64px)',
          transform: 'scaleY(1) translateY(-20%)'
        })
      ),
      transition('void => *', animate('120ms cubic-bezier(0, 0, 0.2, 1)')),
      transition(
        '* => void',
        animate('100ms 25ms linear', style({ opacity: 0 }))
      )
    ])
  ]
})
export class AutoInputComponent implements OnChanges, OnInit, OnDestroy {
  public validation_messages = VALIDATION_MESSAGES;
  @ViewChild('input', { static: false }) inputElem: ElementRef;
  @Input() label: string;
  @Input() placeholder: string;
  @Input() required = false;
  @Input() readonly = false;
  @Input() suggestions: any[];
  @Input() parentForm: FormGroup;
  @Input() formName: string;
  @Input() inputTypeHomeRoomClass?: boolean = null;
  @Input() inputTypeHomeRoomClassFlag?: boolean = null;
  @Input() showRemoveIconInInput?: boolean = true;

  @Output()
  private loadEvent: EventEmitter<any> = new EventEmitter<any>();
  @Output()
  private resetEvent: EventEmitter<any> = new EventEmitter<any>();

  public showLabel = true;
  public dropVisibility = false;
  public filteredSuggestions: any[];
  public selectedHomeRoomClasses: any[] = [];

  public inputValue = '';
  private controlSubscription: Subscription;
  public errorFlag: boolean = false;

  @HostListener('document:click', ['$event.target'])
  public onClick(targetElement: any) {
    const clickedInsideInput = targetElement.classList.contains(
      'mat-input-element'
    );
    const clickedInsideComponent =
      (targetElement.classList.contains('auto_line') ||
        targetElement.classList.contains('mat-input-element')) &&
      targetElement.id.includes(this.formName);

    if (clickedInsideInput) {
      this.inputFocus();
    }
    if (!(clickedInsideComponent && this.dropVisibility)) {
      this.inputBlur();
    }
  }

  constructor(private schedService: ScheduleSettingsService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.suggestions) {
      this.filteredSuggestions = changes.suggestions.currentValue;
      if (!changes.suggestions.firstChange) {
        this.inputBlur();
      }
    }
  }

  ngOnInit() {
    window.onbeforeunload = () => this.ngOnDestroy();
    this.loadEvent.emit();
    if (this.required) {
      this[this.formName] = new FormControl('', Validators.required);
    } else {
      this[this.formName] = new FormControl('');
    }
    if (this.label === 'nolabel') {
      this.showLabel = false;
    }
    this.parentForm.addControl(this.formName, this[this.formName]);
    this.controlSubscription = this.parentForm.controls[
      this.formName
    ].valueChanges.subscribe(r => (this.inputValue = this.getItemTitle(r)));
    this.selectedHomeRoomClasses = [];
    this.selectedHomeRoomClasses = this.schedService.selectedHomeRoomClassesArr;
    
  }

  public keyHandler(event: KeyboardEvent): void {
    event.code === 'Enter'
      ? (event.preventDefault(), this.inputEnter())
      : this.callFilter();
  }

  private callFilter(): void {
    if (this.inputValue.length === 0) {
      this.clearInput();
    } else {
      if (this.formName === 'homeClass') {
        this.filteredSuggestions = this.suggestions.filter((item: any) =>
          (item.level.name + item.name + item.segmentname)
            .toLowerCase()
            .includes(this.inputValue.toLowerCase())
        );
      } else {
        this.filteredSuggestions = this.suggestions.filter((item: any) =>
          item.name.toLowerCase().includes(this.inputValue.toLowerCase())
        );
      }
    }
  }

  public selectItem(item: any, homeClass: boolean): void {
    this.errorFlag = false;
    if (homeClass === true) {
      this.schedService.selectedHomeRoomClassesArr.forEach(
        (selectedElem) => {
          if (selectedElem.yearId === item.yearId) {
            this.errorFlag = true;            
          }
        }
      )

      if (!this.schedService.selectedHomeRoomClassesArr.includes(item)) {
        if (!this.errorFlag) {
          this.schedService.selectedHomeRoomClassesArr.push(item); 
        }
      }
  
      const placeIndex = this.filteredSuggestions.indexOf(item);
      this.filteredSuggestions.splice(placeIndex, 1);
    }
  
    this.resetEvent.emit();
    if (this.formName === 'homeClass') {
      this.parentForm.controls[this.formName].patchValue(this.schedService.selectedHomeRoomClassesArr);
    } else {
      this.parentForm.controls[this.formName].patchValue(item);
    }
    
    this.parentForm.controls[this.formName].markAsDirty();
    this.inputBlur();
    this.setItemToLocalstorage(this.formName, item.id);
    this.formName === 'homeClass' ? this.inputValue = '' : null
  }

  public clearInput(blur?: boolean): void {
    this.resetEvent.emit();
    this.parentForm.controls[this.formName].patchValue('');
    this.parentForm.controls[this.formName].markAsDirty();
    this.removeItemFromLocalstorage(this.formName);
    this.filteredSuggestions = this.suggestions;
    if (blur) {
      this.inputBlur();
    }
  }

  private inputFocus(): void {
    this.dropVisibility = true;
  }

  private inputBlur(): void {
    this.dropVisibility = false;
    this.inputElem.nativeElement.blur();
    if (
      this.parentForm.controls[this.formName] &&
      this.parentForm.controls[this.formName].value &&
      this.parentForm.controls[this.formName].value.length !== 0
    ) {
      // this.inputValue = this.getItemTitle(
      //   this.parentForm.controls[this.formName].value
      // );
    } else {
      this.clearInput();
    }
  }

  private inputEnter(): void {
    if (this.inputValue.length !== 0 && this.filteredSuggestions.length !== 0) {
      this.selectItem(this.filteredSuggestions[0], this.inputTypeHomeRoomClass);
    }
  }

  private getItemTitle(item: any): string {
    let isArr = Array.isArray(item)
    if (isArr == true && this.inputTypeHomeRoomClass === true && this.inputTypeHomeRoomClassFlag == true) {
      if (item.length !== null && item.length > 0) {
        if(item[item.length - 1].name) {
          if (item[item.length - 1].level) {
            return item[item.length - 1].level.name + item[item.length - 1].name
          } else {
            return item[item.length - 1].name
          }
        }
      }
    }
    if (item && item.name && this.inputTypeHomeRoomClass !== true) {
      if (item.level) {
        return item.level.name + item.name;
      } else {
        return item.name;
      }
    } else {
      return item;
    }
  }

  // working with localstorage
  private getItemFromLocalstorage(itemName: string): string {
    const localName =
      'auto' + itemName.replace(/^\w/, c => c.toUpperCase()) + 'IdSelected';
    return localStorage.getItem(localName);
  }

  private removeItemFromLocalstorage(itemName: string): void {
    const localName =
      'auto' + itemName.replace(/^\w/, c => c.toUpperCase()) + 'IdSelected';
    return localStorage.removeItem(localName);
  }

  private setItemToLocalstorage(itemName: string, itemId: string): void {
    const localName =
      'auto' + itemName.replace(/^\w/, c => c.toUpperCase()) + 'IdSelected';
    localStorage.setItem(localName, itemId);
  }

  ngOnDestroy() {
    this.removeItemFromLocalstorage(this.formName);
    this.controlSubscription.unsubscribe();
  }
}
