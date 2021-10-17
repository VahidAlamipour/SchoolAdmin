import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
  OnChanges
} from '@angular/core';
import { MatDialog } from '@angular/material';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import * as _ from 'lodash';
import * as moment from 'moment';

import { fadeAnimation } from 'src/app/animations/animations';
import { ScheduleSettingsService } from '../../services/schedule-settings.service';
import { LayoutService } from 'src/app/services/layout.service';
import { AddYearModalComponent } from 'src/app/components/modals/institutions-modal/add-year-modal/add-year-modal.component';
import { ConfirmModalComponent } from 'src/app/components/modals/confirm-modal/confirm-modal.component';
import {
  IAcademicYear,
  IDay,
  IShift
} from '../../../../../../../sdk/interfaces';
import { Shift, TermsDates } from 'src/app/models/interfaces.model';
import { formControls } from '../../models/formcontrols.model';
import { CONFIG } from 'src/app/config';

@Component({
  selector: 'schedule-settings',
  templateUrl: './schedule-settings.component.html',
  animations: [fadeAnimation]
})
export class ScheduleSettingsComponent implements OnChanges, OnInit, OnDestroy {
  @Input()
  public parentForm: FormGroup;
  @Input()
  public institutionId: number;
  @Input()
  public editMode: boolean;

  @Output() 
  addYearToNewSchool: EventEmitter<any> = new EventEmitter<any>();

  private academicYearSubscription: Subscription;
  public academicYearsList: any[] = [];
  public formControls = formControls;

  get studydaysNotEmpty(): boolean {
    return (
      this.parentForm &&
      this.parentForm.controls &&
      this.parentForm.controls[formControls.studyDaysControl] &&
      this.parentForm.controls[formControls.studyDaysControl].value &&
      this.parentForm.controls[formControls.studyDaysControl].value.length !== 0
    );
  }

  get termsNotEmpty(): boolean {
    return (
      this.parentForm &&
      this.parentForm.controls &&
      this.parentForm.controls[formControls.termsControl] &&
      this.parentForm.controls[formControls.termsControl].value &&
      this.parentForm.controls[formControls.termsControl].value.length !== 0
    );
  }

  get showSettingsBlock(): boolean {
    return this.editMode || (this.academicYearsList && this.academicYearsList.length !== 0);
  }

  get yearCanBeEdited(): boolean {
    return this.parentForm.controls[formControls.academicYearControl].value
      .yearId
      ? false
      : true;
  }

  get studyDaysCanBeEdited(): boolean {
    let shifts = this.parentForm.controls[formControls.academicYearControl].value.shifts;
    let blockCounter: number = 0;
    shifts && shifts.forEach(item => {
      var blockedTime = item.times.filter(time => time.isBlocked);
      blockCounter += blockedTime.length;
    });
    return blockCounter < 1;
  }

  constructor(
    private layout: LayoutService,
    private dialog: MatDialog,
    public service: ScheduleSettingsService
  ) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.editMode) {
      this.service.editMode = changes.editMode.currentValue;
    }
    if (this.institutionId) {
      this.service
        .loadAcademicYears(this.institutionId)
        .then(
          () => (this.academicYearsList = this.service.originAcademicYearslist)
        )
        .finally(() => this.setAcademicYearsList(this.academicYearsList));

    } else {
      this.service
        .loadYears(this.institutionId)
        .then(years => (this.academicYearsList = years));
    }
  }

  ngOnInit() {
    this.initForm();
    this.service.loadDays();
    this.academicYearSubscription = this.parentForm.controls[
      formControls.academicYearControl
    ].valueChanges.subscribe(year =>
      this.resetHandler(
        year,
        this.parentForm.value[formControls.academicYearControl]
      )
    );

  }

  private initForm(): void {
    this.parentForm.addControl(
      formControls.academicYearControl,
      new FormControl('', Validators.required)
    );
    this.parentForm.addControl(
      formControls.termsControl,
      new FormControl([], Validators.required)
    );
    this.parentForm.addControl(
      formControls.studyDaysControl,
      new FormControl([], Validators.required)
    );
  }

  // setting existing year data
  private setAcademicYearsList(lists: IAcademicYear[]): void {

    if (lists.length) {
      this.service.loadActiveAcademicYear(this.institutionId).then(() => {
        let theYearId = this.academicYearsList[0].id;
        if (this.service.activeAcademicYearId) theYearId = this.service.activeAcademicYearId;
        this.setAcademicYear(this.academicYearsList.find(year => year.id === theYearId));
      });

    } else {
      console.log('can`t set academic year');
    }
  }

  private setAcademicYear(year: IAcademicYear): void {
    this.parentForm.controls[formControls.academicYearControl].patchValue(
      year,
      { emitEvent: false }
    );
    this.setTerms(year.terms);
    this.setStudyDays(year.days);
    this.setShifts(year.shifts);
  }

  private setTerms(terms: { id: number; start: any; end: any }[]): void {
    const formatedTerms: TermsDates[] = [];
    if (terms) {
      terms.forEach(term =>
        formatedTerms.push({
          startDate: moment(term.start).format(CONFIG.VIEW_DATE_FORMAT),
          endDate: moment(term.end).format(CONFIG.VIEW_DATE_FORMAT)
        })
      );
      this.parentForm.controls[formControls.termsControl].patchValue(
        formatedTerms
      );
    }
  }

  private setStudyDays(days: IDay[]): void {
    const selectedDays: IDay[] = [];
    const control = this.parentForm.controls[formControls.studyDaysControl];
    if (days) {
      this.service.allDays = days.map((day: IDay) => ({
        ...Object.assign({}, day),
        code: day.code.substring(0, 3)
      }));
      this.service.allDays.forEach(day => {
        if (day.selected) {
          selectedDays.push(day);
        }
      });
    }
    control.patchValue(selectedDays);
  }

  private setShifts(shifts: IShift[]): void {
    if (shifts) {
      this.service.shiftsList = shifts.map(shift => ({
        name: `${shift.name} shift`,
        id: shift.id,
        timesList: shift.times.map(time => ({
          ...time,
          clientId: time.start.replace(':', '') + time.end.replace(':', ''),
          isDuplicate: false
        }))
      }));
    }
  }

  // reset form
  public resetHandler(
    selectedYear: IAcademicYear,
    oldAYear: IAcademicYear
  ): Promise<boolean> {
    return new Promise(resolve => {
      if (this.editMode) {
        if (this.needToReset()) {
          if (oldAYear.yearId) {
            this.resetScheduleSettings();
            if (selectedYear.yearId) {
              this.setAcademicYear(selectedYear);
            }
          } else {
            this.askToReset().then(resetAnswer => {
              if (resetAnswer) {
                this.resetScheduleSettings();
                if (selectedYear.yearId) {
                  this.setAcademicYear(selectedYear);
                }
              } else {
                if (oldAYear) {
                  this.parentForm.controls[
                    formControls.academicYearControl
                  ].setValue(oldAYear, {
                    emitEvent: false
                  });
                }
              }
            });
          }
          return resolve(true);
        } else {
          if (selectedYear.yearId) {
            this.setAcademicYear(selectedYear);
            return resolve(true);
          }
        }
      } else {
        this.setAcademicYear(selectedYear);
        return resolve(true);
      }
    });
  }

  public needToReset(): boolean {
    return (
      this.termsNotEmpty ||
      this.studydaysNotEmpty ||
      this.service.shiftsNotEmpty
    );
  }

  private askToReset(): Promise<boolean> {
    this.layout.blurWrapContainer();
    const confirmModal = this.dialog.open(ConfirmModalComponent, {
      panelClass: ['modal', 'confirm', 'w'],
      autoFocus: false,
      restoreFocus: true,
      role: 'alertdialog',
      data: { text: 'All schedule settings will be erased. Are you sure?' }
    });
    return new Promise(resolve =>
      confirmModal.beforeClosed().subscribe(result => {
        this.layout.unblurWrapContainer();
        return resolve(result);
      })
    );
  }

  private resetScheduleSettings(): void {
    if (this.termsNotEmpty) {
      this.parentForm.controls[formControls.termsControl].patchValue([]);
    }
    if (this.studydaysNotEmpty) {
      this.parentForm.controls[formControls.studyDaysControl].reset();
    }
    if (this.service.shiftsNotEmpty) {
      this.service.shiftsList = [];
      this.service.addShift();
    }
  }

  public addYearHandler(): void {
    this.service.loadYears(this.institutionId).then(years => {
      const availableYears = years.filter(
        availableYear =>
          !this.academicYearsList
            .map(year => year.id)
            .includes(availableYear.id)
      );
      this.addNewAcademicYear(availableYears);
    });
  }

  private addNewAcademicYear(availableYears: IAcademicYear[]): void {
    const availableDuplicateYears = this.academicYearsList.filter(
      availableYear =>
        availableYear.terms &&
        availableYear.shifts &&
        availableYear.days
    );
    this.layout.blurWrapContainer();
    this.dialog
      .open(AddYearModalComponent, {
        panelClass: ['modal', 'noheight', 'periods'],
        data: { years: availableYears, currentYears: availableDuplicateYears }
      })
      .beforeClosed()
      .subscribe({
        next: result => {
          this.layout.unblurWrapContainer();
          if (result) {
            this.addYearToNewSchool.emit(result);
            this.academicYearsList.push(result);
            this.parentForm.controls[
              formControls.academicYearControl
            ].patchValue(result);
            this.setAcademicYear(result)
          }
        }
      });
  }

  ngOnDestroy() {
    this.resetScheduleSettings();
  }
}
