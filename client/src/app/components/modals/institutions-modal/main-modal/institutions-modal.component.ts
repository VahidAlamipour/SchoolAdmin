import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  HostBinding,
  ViewChild,
  ElementRef
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Subscription, BehaviorSubject } from 'rxjs';
import * as moment from 'moment';
import * as _ from 'lodash';

import { AddDataModalComponent } from '../../add-data-modal/components/modal/add-data-modal.component';
import { ScheduleSettingsService } from 'src/app/components/schedule-settings/services/schedule-settings.service';
import { NotificationsService } from 'src/app/components/notifications/services/notifications.service';
import { InstitutionsModalService } from '../services/institutions-modal.service';
import { fadeAnimation } from 'src/app/animations/animations';
import {
  IAdministrator,
  ISchool,
  IDay
} from '../../../../../../../sdk/interfaces';
import { AcademicYear, ISBModal } from 'src/app/models/interfaces.model';
import { CONFIG } from 'src/app/config';

@Component({
  selector: 'app-institutions-modal',
  templateUrl: './institutions-modal.component.html',
  animations: [fadeAnimation]
})
export class InstitutionsModalComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'modal_box';
  @ViewChild('imageReader', { static: false })
  private imageReader: ElementRef;

  public adminsModalConfig = {
    modal: AddDataModalComponent,
    searchPlaceholder: 'Enter phone number, last name or first name',
    addButtonTitle: 'Add administrator',
    institutionFilter: true,
    addingDataName: 'administrators'
  };

  public imageData: { name: string; base64: string } = { name: '', base64: '' };
  public editMode: boolean;
  public institutionData: ISchool;
  public detailsForm: FormGroup;
  public scheduleSettingsForm: FormGroup;
  private subscribers: Subscription[] = [];
  private _uploading = new BehaviorSubject<boolean>(false);
  public uploading$ = this._uploading.asObservable();

  get countrySelected(): boolean {
    return this.detailsForm.controls.country.valid;
  }

  get scheduleSettingsFormValid(): boolean {
    return this.scheduleSettingsForm.valid && this.scheduleService.shiftsValid;
  }

  get hasScheduleSettings(): boolean {
    return this.detailsForm.controls.scheduleSettings.value;
  }

  get formValid(): boolean {
    return (
      this.detailsForm.valid &&
      this.detailsForm.dirty &&
      (this.hasScheduleSettings ? this.scheduleSettingsFormValid : true)
    );
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ISBModal,
    private institutionsModal: MatDialogRef<InstitutionsModalComponent>,
    private notificationsService: NotificationsService,
    private scheduleService: ScheduleSettingsService,
    private formBuilder: FormBuilder,
    public service: InstitutionsModalService
  ) {
    this.detailsForm = this.formBuilder.group({
      country: ['', Validators.required],
      city: ['', Validators.required],
      institutionFullName: ['', Validators.required],
      institutionShortName: ['', Validators.required],
      admin: [[]],
      scheduleSettings: [false]
    });
  }

  ngOnInit() {
    this.service.loadCountries();
    this.subscribers.push(
      this.detailsForm.controls.scheduleSettings.valueChanges.subscribe(() =>
      {
        this.initScheduleSettingsForm()
      }
        
      )
    );
    this.subscribers.push(
      this.detailsForm.controls.country.valueChanges.subscribe(country =>
        this.service.loadCities(country.id)
      )
    );
  }

  private initScheduleSettingsForm(): void {
    this.scheduleSettingsForm = this.formBuilder.group({
      academicYear: ['', Validators.required],
      terms: [[], Validators.required],
      studyDays: [[], Validators.required]
    });
  }

  // send data to server
  public onSubmitClick(): void {
    this._uploading.next(true);
    const detailsForm = this.detailsForm.value;
    const institutionData: ISchool = {
      name: detailsForm.institutionShortName,
      fullName: detailsForm.institutionFullName,
      cityId: detailsForm.city.id,
      image: this.imageData,
      ...(detailsForm.admin.length
        ? {
            adminId: detailsForm.admin.map((admin: IAdministrator) => admin.id)
          }
        : null)
    };

    if (this.hasScheduleSettings) {
      const ssForm = this.scheduleSettingsForm.value;
      const academicYear: AcademicYear = {
        yearId: ssForm.academicYear.id,
        daysIds: ssForm.studyDays.map((day: IDay) => day.id),
        shifts: this.scheduleService.shiftsList.map(list => ({ times: list.timesList })),
        periods: ssForm.terms.map((period: any) => ({
          startDate: moment(period.startDate, CONFIG.VIEW_DATE_FORMAT).format(
            'YYYY-MM-DD'
          ),
          endDate: moment(period.endDate, CONFIG.VIEW_DATE_FORMAT).format(
            'YYYY-MM-DD'
          )
        }))
      };
      this.service
        .uploadInstitutionWithSchedule(institutionData, academicYear)
        .then((response)=>{
          this.notificationsService.notifyUser({
            message: `${response.academicYear.start}-${response.academicYear.end} has been set as the default Academic Year. The default Academic Year can be changed later in the Curriculum Builder.`,
            type: 'success'
          });

        })
        .then(() => setTimeout(() => this.institutionsModal.close(true), 450));
    } else {
      this.service
        .uploadInstitution(institutionData)
        .then(() => setTimeout(() => this.institutionsModal.close(true), 450));
    }
  }

  public handleInputChange(e: any): void {
    const file = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
    if (file.size > 2000000) {
      this.notificationsService.notifyUser({
        message: `Size of the image is larger than expected. Image max size 2mb.`,
        type: 'error'
      });
    } else {
      const fileReader = new FileReader();
      this.imageData.name = file.name || 'image';
      fileReader.onload = this._handleReaderLoaded.bind(this);
      fileReader.readAsDataURL(file);
    }
  }

  private _handleReaderLoaded(e: any): void {
    const reader = e.target;
    this.imageData.base64 = reader.result;
    this.detailsForm.markAsDirty();
  }

  public clearImageReader(): void {
    this.imageReader.nativeElement.value = this.imageData.base64 = this.imageData.name =
      '';
  }

  public onNoClick(): void {
    this.institutionsModal.close(false);
  }

  ngOnDestroy() {
    this._uploading.next(false);
    if (this.subscribers.length > 0) {
      this.subscribers.map(subscriber => subscriber.unsubscribe());
    }
  }
}
