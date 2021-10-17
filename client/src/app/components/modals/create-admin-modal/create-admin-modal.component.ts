import { Component, OnInit, Inject, HostBinding } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import * as moment from 'moment';

import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';
import { AddDataModalComponent } from '../add-data-modal/components/modal/add-data-modal.component';
import { SdkService } from 'src/app/services/sdk.service';
import { IAdministrator, ISchool } from '../../../../../../sdk/interfaces';

@Component({
  selector: 'app-create-admin-modal',
  templateUrl: './create-admin-modal.component.html'
})
export class CreateAdminModalComponent implements OnInit {
  @HostBinding('class')
  private classes = 'modal_box';

  public institutionsModalConfig = {
    modal: AddDataModalComponent,
    searchPlaceholder: 'Enter name of institution',
    addButtonTitle: 'Save changes',
    addingDataName: 'institutions'
  };

  private _uploading = new BehaviorSubject<boolean>(false);
  public uploading$ = this._uploading.asObservable();
  public detailsForm: FormGroup;
  public editMode: boolean;

  get formValid(): boolean {
    return this.detailsForm.valid && this.detailsForm.dirty;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private formBuilder: FormBuilder,
    private sdk: SdkService,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<CreateAdminModalComponent>
  ) {}

  ngOnInit() {
    if (this.data && this.data.data) {
      this.editMode = true;
      this.setExistingData(Object.assign({}, this.data.data));
    } else {
      this.initForm();
    }
  }

  private initForm(): void {
    this.detailsForm = this.formBuilder.group({
      name: [''],
      lastName: [''],
      middleName: [''],
      birthday: [''],
      email: [''],
      msisdn: [''],
      address: [''],
      ...(this.editMode ? null : { institutions: [[], Validators.required] })
    });
  }

  private setExistingData(data: IAdministrator): void {
    this.initForm();
    const form = this.detailsForm.controls;
    Object.keys(data).forEach((name) => {
      if (form[name]) {
        form[name].patchValue(data[name], { onlySelf: true });
      }
    });
  }

  public onSubmitForm(form: any): void {
    this._uploading.next(true);
    const adminData: IAdministrator = {
      ...form,
      ...(form.birthday
        ? {
            birthday: moment({
              year: moment(form.birthday).year(),
              month: moment(form.birthday).month(),
              day: moment(form.birthday).date()
            }).format('YYYY-MM-DD')
          }
        : { birthday: null }),
      ...(this.editMode
        ? null
        : {
            schoolsId: form.institutions.map((institution: ISchool) => institution.id)
          }) // schoolsId->institutionsId | with back
    };
    if (this.data.data) {
      this.sdk.client
        .updateAdmin(this.data.data.id, adminData)
        .then(() => this.dialogRef.close({ needToUpdate: true }));
    } else {
      this.sdk.client.newAdmin(adminData).then(() => this.dialogRef.close({ needToUpdate: true }));
    }
  }

  public canBeDeleted(): boolean {
    return !this.data.data.types.some((type: string) => type === 'ACCOUNT_ADMINISTRATOR');
  }

  public onDeleteClick(): void {
    this.classes = 'modal_box collapse';
    setTimeout(() => {
      const confirmModal = this.dialog.open(ConfirmationModalComponent, {
        panelClass: ['modal', 'confirm'],
        backdropClass: 'hide',
        autoFocus: false,
        restoreFocus: false,
        role: 'alertdialog',
        data: { title: 'Are you sure you want to delete this administrator?' }
      });
      confirmModal.beforeClosed().subscribe({
        next: (result) =>
          result
            ? this.sdk.client
                .deleteAdmin(this.data.data.id)
                .then(() => this.dialogRef.close({ needToUpdate: true, delete: true }))
            : (this.classes = 'modal_box')
      });
    }, 300);
  }

  public onNoClick(): void {
    this.dialogRef.close({ needToUpdate: false });
  }
}
