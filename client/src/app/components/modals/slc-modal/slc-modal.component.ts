import { Component, OnInit, Inject, HostBinding } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material';
import { Validators, FormBuilder } from '@angular/forms';

import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';
import { SdkService } from 'src/app/services/sdk.service';
import { SidebarService } from '../../sidebar/sidebar.service';
import { CookieService } from 'ngx-cookie-service';
import { SLCService } from '../../slc-selector/slc-selector.service';

@Component({
  selector: 'app-slc-modal',
  templateUrl: './slc-modal.component.html'
})
export class SLCModalComponent implements OnInit {
  @HostBinding('class') classes = 'modal_box';

  public formDetails = this.formBuilder.group({
    name: ['', Validators.required]
  });
  private existingLevels: number[];
  public allLevels = [];
  public allEducators = [];
  public classLevel: any;
  private allLevelsValues: Map<number, number> = new Map();
  public ayInfo;

  constructor(
    private formBuilder: FormBuilder,
    private dialog: MatDialog,
    private sdk: SdkService,
    public dialogRef: MatDialogRef<SLCModalComponent>,
    public sidebarService : SidebarService,
    public cookieService : CookieService,
    public sLCService: SLCService,
    @Inject(MAT_DIALOG_DATA) public data
  ) { }

  ngOnInit() {
    if (this.data.name === 'class') {
      let yearSelected = +localStorage.getItem('yearSelected');
      this.sdk.client
        .getTeachers({ limit: -1, yearId: yearSelected, disabled: 0 })
        .then(
          res => {
            this.allEducators = res.list.filter(
              educator =>
                (!educator.homeClass || educator.homeClass['year_id'] != yearSelected) ||
                (this.data.existing && this.data.existing.teacher
                  ? educator.id === this.data.existing.teacher.id
                  : false)
            )
          }
        );
      this.classLevel = this.data.level; 
      this.formDetails = this.formBuilder.group({
        name: ['', [Validators.required, Validators.pattern(/[^\s\\]/)]],
        classLevel: [this.classLevel, Validators.required],
        showName: [false]
      });
    } else if (this.data.name === 'level') {
      this.existingLevels = this.data.existingLevels;
      this.sdk.client.getLevelsValues().then(levelValues => {
        this.allLevelsValues = new Map(
          levelValues.map((level): [number, number] => [+level.name, level.id])
        );
        this.allLevels = Array.from(this.allLevelsValues.keys());
      });
    }
    if (this.data.existing) {
      if (this.data.name === 'class') {
        this.setExistingClassData();
      } else {
        this.setExistingData();
      }
    }
  }

  private setExistingData(): void {
    const data = this.data.existing;
    const form = this.formDetails.controls;
    Object.keys(data).forEach(name => {
      if (form[name]) {
        form[name].patchValue(data[name], { onlySelf: true });
        if (this.data.name === 'level') {
          form[name].patchValue(+data[name], { onlySelf: true });
        }
      }
    });
  }

  private setExistingClassData(): void {
    this.sdk.client.getClass(this.data.existing.id).then(data => {
      const form = this.formDetails.controls;
      Object.keys(data).forEach(name => {
        if (form[name]) {
          form[name].patchValue(data[name], { onlySelf: true });
          if (this.data.name === 'level') {
            form[name].patchValue(+data[name], { onlySelf: true });
          }
        }
      });
    });
  }

  public onSubmitFormDetails(formData: any): void {
    let request: Promise<any>;
    if (this.formDetails.valid) {
      if (this.data.mode === 'edit') {
        switch (this.data.name) {
          case 'segment':
            request = this.sdk.client.updateSegment(
              this.data.existing.id,
              formData
            );
            break;
          case 'level':
            request = this.sdk.client.updateLevel(this.data.existing.id, {
              value: this.allLevelsValues.get(formData.name),
              segmentId: +localStorage.getItem('segmentSelected')
            });
            break;
          case 'class':
            request = this.sdk.client.updateClass(this.data.existing.id, {
              name: formData.name,
              showName: formData.showName,
              teacherId: formData.teacher ? formData.teacher.id : 0,
              levelId: +localStorage.getItem('levelSelected')
            });
            break;
          default:
            break;
        }
      } else if (this.data.mode === 'create') {
        switch (this.data.name) {
          case 'segment':
            request = this.sdk.client.newSegment(formData);
            break;
          case 'level':
            request = this.sdk.client.newLevel({
              value: this.allLevelsValues.get(formData.name),
              segmentId: +localStorage.getItem('segmentSelected')
            });
            break;
          case 'class':
            request = this.sdk.client.newClass({
              name: formData.name,
              showName: formData.showName,
              yearId: +localStorage.getItem('yearSelected'),
              levelId: +localStorage.getItem('levelSelected'),
              ...(formData.teacher && formData.teacher.id
                ? { teacherId: formData.teacher.id }
                : null)
            });
            break;
          default:
            break;
        }
      }
    }
    request.then(() =>
      this.dialogRef.close({ name: this.data.name, result: this.data.mode })
    );
  }

  public isLevelDisabled(level: number): boolean {
    return this.existingLevels.includes(level);
  }

  public onDeleteClick(): void {
    if (this.cookieService.get('cityId')) {
      this.sdk.client.getSchools({ limit: -1, cityId: Number(this.cookieService.get('cityId')) })
      .then(res=> { 
        let schoolid = Number(this.cookieService.get('schoolId'));
        this.ayInfo = res.list.filter(school=>school.id == schoolid);
      });
    } 
    let request: Promise<any>;
    this.classes = 'modal_box collapse';
    setTimeout(() => {
      const confirmModal = this.dialog.open(ConfirmationModalComponent, {
        panelClass: ['modal', 'confirm'],
        backdropClass: 'hide',
        autoFocus: false,
        restoreFocus: false,
        role: 'alertdialog',
        data: {
          title: `Are you sure you want to delete this ${this.data.name}?`
        }
      });
      confirmModal.beforeClosed().subscribe({
        next: (result: boolean) => {
          this.dialogRef.close({ name: this.data.name, result: 'delete' })
          if (result) {
            switch (this.data.name) {
              case 'segment':
                request = this.sdk.client.deleteSegment(this.data.existing.id);
                this.sLCService.getSegments();
                break;
              case 'level':
                request = this.sdk.client.deleteLevel(this.data.existing.id);
                break;
              case 'class':
                request = this.sdk.client.deleteClass(this.data.existing.id);
                break;
              default:
                break;
            }
            request.then(() => {
              this.dialogRef.close({ name: this.data.name, result: 'delete' })
              this.updateSidebar(this.ayInfo);
            }
            );
          } else {
            this.classes = 'modal_box';
          }
        }
      });
    }, 300);
  }

  public updateSidebar(ayInfo : any ) {
    if(ayInfo &&ayInfo[0].activeAcademicYear){
    this.sidebarService.loadClasses(ayInfo[0].activeAcademicYear)
    this.sidebarService.loadLessons({
      academicYearId: ayInfo[0].activeAcademicYear,
      classId: null,
      startDate: null,
      endDate: null,
      shiftId: null,
    })
  }
  }

  public onNoClick(): void {
    this.dialogRef.close();
  }
}
