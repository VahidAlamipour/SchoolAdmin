import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject } from 'rxjs';
import * as moment from 'moment';

import { SdkService } from 'src/app/services/sdk.service';
import { AuthService } from 'src/app/auth/auth.service';

import { MatDialog } from '@angular/material';
import { LayoutService } from 'src/app/services/layout.service';
import { AddDataModalComponent } from 'src/app/components/modals/add-data-modal/components/modal/add-data-modal.component';
import { ConfirmModalComponent } from 'src/app/components/modals/confirm-modal/confirm-modal.component';
import { fadeAnimation, heightAnimation } from 'src/app/animations/animations';
import {
  ISchool,
  IDay,
  IAdministrator
} from '../../../../../../sdk/interfaces';
import { InstitutionService } from '../services/institution.service';
import { NotificationsService } from 'src/app/components/notifications/services/notifications.service';
import { ScheduleSettingsService } from 'src/app/components/schedule-settings/services/schedule-settings.service';
import { AcademicYear } from 'src/app/models/interfaces.model';
import { ScheduleSettingsComponent } from 'src/app/components/schedule-settings/components/schedule-settings-block/schedule-settings.component';
import { CONFIG } from 'src/app/config';
import { SidebarService } from 'src/app/components/sidebar/sidebar.service';

@Component({
  selector: 'app-institution',
  templateUrl: './institution.component.html',
  animations: [fadeAnimation, heightAnimation]
})
export class InstitutionComponent implements OnInit {
  @ViewChild(ScheduleSettingsComponent, { static: true })
  private scheduleSettings: ScheduleSettingsComponent;
  @ViewChild('imageReader', { static: false })
  private imageReader: ElementRef;

  private loaderTime = 500;

  public adminsModalConfig = {
    modal: AddDataModalComponent,
    searchPlaceholder: 'Enter phone number, last name or first name',
    addButtonTitle: 'Add administrator',
    institutionFilter: true,
    addingDataName: 'administrators'
  };

  public oneInstitutionMode: boolean;
  public institutionId: number;
  public institutionData: ISchool;
  public imageData: { name: string; base64: string } = { name: '', base64: '' };

  public detailsForm: FormGroup = this.formBuilder.group({});
  public scheduleForm: FormGroup = this.formBuilder.group({});

  private _fullsizeLoading = new BehaviorSubject<boolean>(true);
  private _uploading = new BehaviorSubject<boolean>(false);
  public fullsizeLoading$ = this._fullsizeLoading.asObservable();
  public uploading$ = this._uploading.asObservable();

  private selectedAcademicYear: any = {};

  public academicYears: any[] = [];

  public isNewSchool: boolean = false;
  public schoolInfoEdited = null;

  get countrySelected(): boolean {
    return this.detailsForm.controls.country.valid;
  }

  get hasScheduleSettings(): boolean {
    return (
      this.scheduleSettings.academicYearsList &&
      this.scheduleSettings.academicYearsList.length !== 0
    );
  }

  get scheduleFormValid(): boolean {
    return this.scheduleForm.valid && this.sService.shiftsValid;
  }

  get scheduleFormDirty(): boolean {
    return this.scheduleForm.dirty;
  }

  get shiftsListIsDirty(): boolean {
    return this.sService.shiftsListIsDirty;
  }

  get detailsFormValid(): boolean {
    return this.detailsForm.valid;
  }

  get detailsFormDirty(): boolean {
    return this.detailsForm.dirty;
  }
  get daysIsDirty(): boolean {
    try {
      let selectedYear = this.sService.originAcademicYearslist.filter(y => y.id == this.scheduleForm.controls.academicYear.value.id)[0];
      let days: IDay[] = selectedYear.days.filter(d => d.selected);
      days = days.sort(function (a, b) {
        return a.id - b.id;
      });
      let currentDays: IDay[] = this.scheduleForm.controls.studyDays.value;
      currentDays = currentDays.sort(function (a, b) {
        return a.id - b.id;
      });
      if (days.length != currentDays.length) {
        return true;
      }
      if (days.length <= 0 && currentDays.length <= 0) {
        return false;
      }
      if (days[0].id == currentDays[0].id) {
        return false;
      } else {
        return true;
      }
    } catch (error) {
      return false;
    }

  }

  get formsValid(): boolean {
    return this.hasScheduleSettings
      ? (this.detailsFormDirty ||
        this.scheduleFormDirty ||
        this.shiftsListIsDirty ||
        this.daysIsDirty) &&
      (this.detailsFormValid && this.scheduleFormValid)
      : this.detailsFormDirty && this.detailsFormValid;
  }

  constructor(
    private notificationsService: NotificationsService,
    private sService: ScheduleSettingsService,
    private cookieService: CookieService,
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private sdk: SdkService,
    public authService: AuthService,
    public service: InstitutionService,
    private layout: LayoutService,
    private dialog: MatDialog,
    private sidebarservice : SidebarService
  ) {
    this.detailsForm = this.formBuilder.group({
      country: ['', Validators.required],
      city: ['', Validators.required],
      institutionFullName: ['', Validators.required],
      institutionShortName: ['', Validators.required],
      institutionCurrentActiveYear: ['', Validators.required],
      institutionCurrentActiveYearName: '',
      ...(authService.isAccountAdmin ? null : { admin: [[]] })
    });
  }

  ngOnInit() {
    this.service.loadCountries();
    this.route.params.subscribe(params =>
      params && params.id
        ? ((this.oneInstitutionMode = false), (this.institutionId = params.id))
        : ((this.oneInstitutionMode = true),
          (this.institutionId = +this.cookieService.get('schoolId')))
    );
    this.detailsForm.controls.country.valueChanges.subscribe(country =>
      this.service.loadCities(country.id)
    );

    this.sdk.client
      .getSchool(this.institutionId)
      .then(data => (this.institutionData = data))
      .then(() => this.sdk.client.getAcademicYears({ schoolId: this.institutionId, limit: -1 }).then(data => this.academicYears = data.list))
      .finally(() => this.setData(this.institutionData));
  }

  private setData(data: ISchool): void {
    const form = this.detailsForm.controls;
    if (this.authService.isAccountAdmin) {
      this._fullsizeLoading.next(true);
      this.service
        .loadInstitutionAdmins(this.institutionData.id)
        .then(admins => form.admin.patchValue(admins.list))
        .finally(() => this._fullsizeLoading.next(false));
    }
    Object.keys(data).forEach(name => {
      switch (name) {
        case 'city':
          const city = { id: data[name].id, name: data[name].name };
          form.country.patchValue(data[name].country, { onlySelf: true });
          form.city.patchValue(city, { onlySelf: true });
          break;
        case 'fullName':
          form.institutionFullName.patchValue(data[name], { onlySelf: true });
          break;
        case 'name':
          form.institutionShortName.patchValue(data[name], { onlySelf: true });
          break;
        case 'image':
          this.imageData = data[name];
          break;
        case 'activeAcademicYear':
          if (data[name] && this.academicYears) {
            let ActiveAcademicYear = this.academicYears.find(y => y.id === data[name]);
            if (ActiveAcademicYear) {
              this.selectedAcademicYear = {...ActiveAcademicYear};
              form.institutionCurrentActiveYear.patchValue({ id: ActiveAcademicYear.id, name: ActiveAcademicYear.name }, { onlySelf: true });
              form.institutionCurrentActiveYearName.patchValue(ActiveAcademicYear.name, { onlySelf: true });
            }
          }
          break;
        default:
          if (form[name]) {
            form[name].patchValue(data[name], { onlySelf: true });
          }
          break;
      }
    });
    this._fullsizeLoading.next(false);
  }

  private controlEditMode(enable: boolean): void {
    this._fullsizeLoading.next(true);
    setTimeout(() => (this.service.editMode = enable), this.loaderTime - 250);
    setTimeout(() => this._fullsizeLoading.next(false), this.loaderTime);
  }
  public confirmChangeAcademicYear(val): Promise<boolean> {
    this.layout.blurWrapContainer();
    const confirmModal = this.dialog.open(ConfirmModalComponent, {
      panelClass: ['modal', 'confirm', 'w', 'year'],
      autoFocus: false,
      restoreFocus: true,
      role: 'alertdialog',
      data: { title:'Change Active Academic Year', content: `<p class="confirmAcademicYear" >
        <span>Are you sure you want to change the Active Academic Year?</span><br />
        Users will be limited in their ability to perform certain actions in the Admin Panel,<br />
        Curriculum Builder and Gradebook for the current Academic Year.
        <a href="https://beed.ladesk.com/339025-What-happens-when-I-change-the-Active-Academic-Year" target="_blank">Click here</a>
        for details.<br /></p>` }
    });
    return new Promise(resolve =>
      confirmModal.beforeClosed().subscribe(result => {
        this.layout.unblurWrapContainer();
        if(result){
          this.selectedAcademicYear = {...val};
          this.detailsForm.controls.institutionCurrentActiveYearName.patchValue(val.name, { onlySelf: true });
        }else{
          this.detailsForm.controls.institutionCurrentActiveYear.patchValue({ id: this.selectedAcademicYear.id, name: this.selectedAcademicYear.name }, { onlySelf: true });
          this.detailsForm.updateValueAndValidity();
        }
        return resolve(result);
      })
    );
  }
  public async editButtonClick(): Promise<void> {
    if (this.service.editMode) {
      this._uploading.next(true);
      const detailsForm = this.detailsForm.value;
      const scheduleForm = this.scheduleForm.value;
      const shiftsEditMode = !!scheduleForm.academicYear.yearId;
      const institutionData: ISchool = {
        name: detailsForm.institutionShortName,
        fullName: detailsForm.institutionFullName,
        cityId: detailsForm.city.id,
        image: this.imageData,
        activeAcademicYear:detailsForm.institutionCurrentActiveYear.id,
        ...(detailsForm.admin.length
          ? {
            adminId: detailsForm.admin.map(
              (admin: IAdministrator) => admin.id
            )
          }
          : null)
      };
      const academicYear: AcademicYear = {
        yearId: scheduleForm.academicYear.id,
        daysIds: scheduleForm.studyDays.map((day: IDay) => day.id),
        shifts: this.sService.shiftsList.map(list => ({
          id: list.id || null,
          times: list.timesList
        })),
        periods: scheduleForm.terms.map((period: any) => ({
          startDate: moment(period.startDate, CONFIG.VIEW_DATE_FORMAT).format(
            'YYYY-MM-DD'
          ),
          endDate: moment(period.endDate, CONFIG.VIEW_DATE_FORMAT).format(
            'YYYY-MM-DD'
          )
        })),
        duplicatedYearId: scheduleForm.academicYear.duplicatedYearId
      };

      const stopEdit = () => (
        this._uploading.next(false),
        this.controlEditMode(false)
        ,this.onNoClick()
      );
      let academicYearInfo;
      const requestFunction = () =>
        shiftsEditMode
          ? this.service.updateAcademicYearData(
            this.institutionId,
            academicYear
          )
          : this.scheduleForm.dirty && academicYear.yearId
            ? this.service.uploadAcademicYearData(
              this.institutionId,
              academicYear
            ).then(response => {
              academicYearInfo = response;
              if (response.isActive) {
                this.notificationsService.notifyUser({
                  message: `${response.academicYear.start}-${response.academicYear.end} has been set as the default Academic Year. The default Academic Year can be changed later in the Curriculum Builder.`,
                  type: 'success'
                });
              }

            })
            : new Promise(resolve => resolve());

      await requestFunction();
      if(academicYearInfo && academicYearInfo.academicYear) {
        if(institutionData.activeAcademicYear === academicYearInfo.academicYear.id) {
          institutionData.activeAcademicYear = academicYearInfo.yearId;
        } 
        if(!shiftsEditMode) {
          scheduleForm.academicYear.yearId = academicYearInfo.academicYear.id;
          scheduleForm.academicYear.id = academicYearInfo.yearId;
        }
      }
      this.schoolInfoEdited = this.institutionData;
      this.schoolInfoEdited.activeAcademicYear = institutionData.activeAcademicYear;
      this.schoolInfoEdited.academicYearList = this.academicYears;

      this.service
        .uploadInstitutionData(this.institutionId, institutionData)
        .then(() => stopEdit());
    } else {
      this.controlEditMode(true);
    }
    if(this.schoolInfoEdited!=null && this.schoolInfoEdited.id == localStorage.getItem('SchoolID')){
    this.sidebarservice.loadCurrentInstituteInfo(this.schoolInfoEdited) 
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
    this.imageReader.nativeElement.value = this.imageData.name = this.imageData.base64 =
      '';
    this.detailsForm.markAsDirty();
  }

  public onNoClick(): void {
    this.sdk.client.getAcademicYears({ schoolId: this.institutionId, limit: -1 })
    .then(data => this.academicYears = data.list);
    this.controlEditMode(false);
    //this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    // const currentUrl = this.router.url + '?';
    // this.router.navigateByUrl(currentUrl).then(() => {
    //   this.router.navigated = false;
    //   this.router.navigate([this.router.url]);
    // });
  }
  public addNewAcademicYearHandler(data) {
    if(this.academicYears.length === 0) {
      this.isNewSchool = true;
    }
    this.academicYears.push(data);
    if(this.isNewSchool) {
      this.selectedAcademicYear = {...data};
      this.detailsForm.controls.institutionCurrentActiveYearName.patchValue(data.name, { onlySelf: true });
      this.detailsForm.controls.institutionCurrentActiveYear.patchValue({ id: data.id, name: data.name }, { onlySelf: true });
      this.detailsForm.updateValueAndValidity();
    }
  }

  public checkSelectedAcademicHasYearSetting(): boolean {
    if(this.academicYears) {
      const yearWithoutSetting = this.academicYears.filter(y => !y.terms || !y.shifts);
      const scheduleForm = this.scheduleForm.value;
      const detailsForm = this.detailsForm.value;
      if(this.academicYears.length > 1 && yearWithoutSetting && yearWithoutSetting.length > 0 && detailsForm.institutionCurrentActiveYear && detailsForm.institutionCurrentActiveYear.id) {
        const currentAciveAcademicYear = yearWithoutSetting.find(y => y.id === detailsForm.institutionCurrentActiveYear.id);
        if(currentAciveAcademicYear && currentAciveAcademicYear.id) {
          if((!scheduleForm.studyDays || !scheduleForm.terms || scheduleForm.academicYear.id !=  currentAciveAcademicYear.id) ){
            return false;
          }
        }
      }
    }
    return true;
  }
}
