import { Component, OnInit, Inject, HostBinding } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ISchool } from '../../../../../../../sdk/interfaces';

@Component({
  selector: 'app-admin-roles-modal',
  templateUrl: './admin-roles-modal.component.html'
})
export class AdminRolesModalComponent implements OnInit {
  @HostBinding('class') classes = 'modal_box roles';

  public institutionForm: FormGroup;
  public selectedItems: any[];
  public institutionSuggestions: ISchool[];

  get formValid(): boolean {
    return this.institutionForm.valid && this.institutionForm.dirty;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<AdminRolesModalComponent>
  ) {}

  ngOnInit() {
    this.selectedItems = this.data.selectedItems;
    this.institutionSuggestions = this.data.autocompleteSuggestions;
    this.institutionForm = this.formBuilder.group({
      school: ['', Validators.required] // school->institution | with back
    });
  }

  public transferData(): void {
    const form = this.institutionForm;
    this.selectedItems.push(form.value);
    this.dialogRef.close(this.selectedItems);
  }

  public onNoClick(): void {
    this.dialogRef.close();
  }
}
