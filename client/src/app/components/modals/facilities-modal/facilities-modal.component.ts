import { Component, OnInit, Inject, HostBinding } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material';
import { FormBuilder } from '@angular/forms';

import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';
import { AddDataModalComponent } from '../add-data-modal/components/modal/add-data-modal.component';
import { SdkService } from 'src/app/services/sdk.service';
import { IRoom, ISubject, ITeacher } from '../../../../../../sdk/interfaces';
import { SidebarService } from '../../sidebar/sidebar.service';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-facilities-modal',
  templateUrl: './facilities-modal.component.html'
})
export class FacilitiesModalComponent implements OnInit {
  @HostBinding('class') classes = 'modal_box';

  public coursesModalConfig = {
    modal: AddDataModalComponent,
    searchPlaceholder: 'Enter course name',
    addButtonTitle: 'Save changes',
    canBeEmpty: true,
    addingDataName: 'courses'
  };

  public allEducators: Array<ITeacher>;
  public existingFacility: IRoom;
  public detailsForm = this.formBuilder.group({
    teacher: ['']
  });
  public compareFn: ((f1: any, f2: any) => boolean) | null = this
    .compareByValue;

  constructor(
    private formBuilder: FormBuilder,
    private dialog: MatDialog,
    private sdk: SdkService,
    public dialogRef: MatDialogRef<FacilitiesModalComponent>,
    public sidebarService : SidebarService,
    public cookieService : CookieService,
    @Inject(MAT_DIALOG_DATA) public data
  ) {
    this.existingFacility = data.facilityData;
  }

  ngOnInit() {
    this.sdk.client
      .getTeachers({ limit: -1 })
      .then(res => (this.allEducators = res.list));

    if (this.existingFacility) {
      this.setExistingData();
    }
  }

  private setExistingData(): void {
    this.sdk.client.getRoom(this.existingFacility.id).then((data: IRoom) => {
      const form = this.detailsForm.controls;
      Object.keys(data).forEach(name => {
        if (form[name]) {
          form[name].patchValue(data[name], { onlySelf: true });
        }
      });
    });
  }

  public onSubmitFormDetails(data: IRoom): void {
    const roomData: IRoom = {
      ...data,
      capacity: +data.capacity,
      subjectsIds: this.detailsForm
        .get('subjects')
        .value.map((course: ISubject) => course.id),
      teacherId: data.teacher ? data.teacher.id : 0
    };
    if (this.existingFacility) {
      this.sdk.client
        .updateRoom(this.existingFacility.id, roomData)
        .then(() => {
          this.dialogRef.close(true);
          this.sidebarService.loadFacilitiesDatasource(parseInt(this.cookieService.get('schoolId'))) 
        });
    } else {
      this.sdk.client.newRoom(roomData).then(() => {
        this.dialogRef.close(true);
        this.sidebarService.loadFacilitiesDatasource(parseInt(this.cookieService.get('schoolId'))) 
      });
    }
  }

  public onDeleteClick(): void {
    this.classes = 'modal_box collapse';
    setTimeout(() => {
      const confirmModal = this.dialog.open(ConfirmationModalComponent, {
        panelClass: ['modal', 'confirm'],
        backdropClass: 'hide',
        autoFocus: false,
        disableClose: true,
        restoreFocus: false,
        role: 'alertdialog',
        data: { title: 'Are you sure you want to delete this facility?' }
      });
      confirmModal.beforeClosed().subscribe({
        next: result =>
          result
            ? this.sdk.client.deleteRoom(this.existingFacility.id)
              .then(() =>{
                this.dialogRef.close(true);
                this.sidebarService.loadFacilitiesDatasource(parseInt(this.cookieService.get('schoolId')))
              }) 
              .catch(() => this.dialogRef.close(true))
            : (this.classes = 'modal_box')
      });
  }, 300);
}

  public onNoClick(): void {
  this.dialogRef.close(false);
}

  // function for setting select
  private compareByValue(f1: any, f2: any) {
  return f1 && f2 && f1.name === f2.name;
}
}
