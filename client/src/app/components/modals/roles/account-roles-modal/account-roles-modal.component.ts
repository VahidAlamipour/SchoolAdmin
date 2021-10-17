import { Component, Inject, HostBinding } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-account-roles-modal',
  templateUrl: './account-roles-modal.component.html'
})
export class AccountRolesModalComponent {
  @HostBinding('class') classes = 'modal_box roles';

  public accountForm: FormGroup;

  get formValid(): boolean {
    return this.accountForm.valid && this.accountForm.dirty;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<AccountRolesModalComponent>
  ) {
    this.accountForm = this.formBuilder.group({
      isDirector: [false],
      isCurriculumDirector: [false]
    });
    data.selectedItems.forEach((item: { role: string }) =>
      this.accountForm.controls[item.role].patchValue(true)
    );
  }

  public transferData(): void {
    const selectedItems = Object.keys(this.accountForm.value).reduce(
      (arr, item) => {
        if (this.accountForm.controls[item].value) {
          arr.push({ role: item });
        }
        return arr;
      },
      []
    );
    this.dialogRef.close(selectedItems);
  }

  public onNoClick(): void {
    this.dialogRef.close();
  }
}
