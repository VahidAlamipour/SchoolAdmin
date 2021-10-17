import { Component, OnInit, Inject, HostBinding } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material';
import { FormBuilder } from '@angular/forms';
import * as moment from 'moment';

import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';
import { AddDataModalComponent } from '../add-data-modal/components/modal/add-data-modal.component';
import { SdkService } from 'src/app/services/sdk.service';
import { NotificationsService } from 'src/app/components/notifications/services/notifications.service';
import { IParent, IStudent } from '../../../../../../sdk/interfaces';

@Component({
  selector: 'app-create-parent-modal',
  templateUrl: './create-parent-modal.component.html'
})
export class CreateParentModalComponent implements OnInit {
  @HostBinding('class') classes = 'modal_box';

  public learnersModalConfig = {
    modal: AddDataModalComponent,
    searchPlaceholder: 'Enter phone number, last name or first name',
    addButtonTitle: 'Save changes',
    addingDataName: 'learners'
  };

  public familyRoles = ['mother', 'father', 'guardian'];
  private _parentsStatusOption = '';
  private _customParentStatus = '';
  private parentStatus = { name: '' };
  public parentsStatusesArray = ['married', 'divorced', 'separated', 'widowed'];

  get parentStatusOption() {
    return this._parentsStatusOption;
  }
  set parentStatusOption(value) {
    this._parentsStatusOption = value;
    this.updateParentStatus();
  }
  get customParentStatus() {
    return this._customParentStatus;
  }
  set customParentStatus(value) {
    this._customParentStatus = value;
    this.updateParentStatus();
  }

  public parentDetailsForm = this.formBuilder.group({});

  constructor(
    private formBuilder: FormBuilder,
    private sdk: SdkService,
    private notificationsService: NotificationsService,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<CreateParentModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data
  ) {}

  ngOnInit() {
    if (this.data && this.data.existing) {
      this.setExistingData();
    }
  }

  private setExistingData(): void {
    this.sdk.client.getParent(this.data.existing.id).then((data: IParent) => {
      // if(!data.active){
      //   this.notificationsService.notifyUser({
      //     message: `Please activate ${data.name+" "+data.lastName} as a parent then proceed to update`,
      //     type: 'default'
      //   });
      //   this.dialogRef.close({ needToUpdate: false });
      //   return false;
      // }
      const form = this.parentDetailsForm.controls;
      Object.keys(data).forEach((name) => {
        if (form[name]) {
          form[name].patchValue(data[name], { onlySelf: true });
        }
        if (name === 'parentsStatus' && data[name] && data[name].length) {
          if (this.parentsStatusesArray.includes(data[name])) {
            this._parentsStatusOption = data[name];
          } else {
            this._parentsStatusOption = 'other';
            this._customParentStatus = data[name];
          }
        }
        if (name === 'birthday') {
          form.initBirthday.patchValue(data[name], { onlySelf: true });
        }
      });
    });
  }

  public onSubmitParentDetails(form: any): void {
    const birthday = moment({
      year: moment(form.initBirthday).year(),
      month: moment(form.initBirthday).month(),
      day: moment(form.initBirthday).date()
    });
    const parentData: IParent = {
      ...form,
      ...(form.initBirthday ? { birthday: birthday.format('YYYY-MM-DD') } : { birthday: null }),
      parentsStatus: this.parentStatus.name,
      studentsIds: this.parentDetailsForm.get('students').value.map((learner: IStudent) => learner.id)
    };

    const requestFunction = () =>
      this.data.existing
        ? this.sdk.client.updateParent(this.data.existing.id, parentData)
        : this.sdk.client.newParent(parentData);

    requestFunction().then(() => {
      this.notificationsService.notifyUser({
        message: `Parent has been successfully ${this.data.existing ? 'updated' : 'created'}`,
        type: 'success'
      });
      this.dialogRef.close({ needToUpdate: true });
    });
  }

  private updateParentStatus(): void {
    this.parentStatus.name =
      this._parentsStatusOption === 'other' ? this._customParentStatus : this._parentsStatusOption;
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
        data: { title: 'Are you sure you want to delete this parent?' }
      });
      confirmModal.beforeClosed().subscribe({
        next: (result) =>
          result
            ? this.sdk.client
                .deleteParent(this.data.existing.id)
                .then(() => this.dialogRef.close({ needToUpdate: true, delete: true }))
            : (this.classes = 'modal_box')
      });
    }, 300);
  }

  public onNoClick(): void {
    this.dialogRef.close({ needToUpdate: false });
  }
}
