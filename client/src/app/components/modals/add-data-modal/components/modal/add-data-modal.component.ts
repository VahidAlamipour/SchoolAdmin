import { Component, Inject, ViewChild, HostBinding } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

import { SdkService } from 'src/app/services/sdk.service';
import { AddDataModalService } from '../../services/add-data-modal.service';
import { AddDataListComponent } from '../list/add-data-list.component';
import { ISchool } from '../../../../../../../../sdk/interfaces';

@Component({
  selector: 'app-add-data-modal',
  templateUrl: './add-data-modal.component.html'
})
export class AddDataModalComponent {
  @HostBinding('class') classes = 'modal_box add_data';
  @ViewChild(AddDataListComponent, { static: false })
  private list: AddDataListComponent;

  public institutionForm: FormGroup;
  public institutionSuggestions: Array<ISchool> = new Array();
  private canBeEmpty: boolean;

  get noSelectedItems(): boolean {
    return this.canBeEmpty
      ? false
      : this.service.selectedItems && this.service.selectedItems.length === 0;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<AddDataModalComponent>,
    private sdk: SdkService,
    private service: AddDataModalService,
    private fb: FormBuilder
  ) {
    this.service.selectedItems = data.selectedItems
      ? Array.from(data.selectedItems)
      : [];
    this.canBeEmpty = data.canBeEmpty;
    if (data.institutionFilter) {
      this.institutionForm = fb.group({});
    }
  }

  public loadInstitutions(): void {
    this.sdk.client
      .getSchools({ limit: -1 })
      .then(res => (this.institutionSuggestions = res.list));
  }

  public transferData(): void {
    this.dialogRef.close(this.service.selectedItems);
  }

  public searchEvent(searchString: string): void {
    if (searchString !== undefined && searchString !== null) {
      this.list.searchString = searchString;
    }
    this.list.getData(true);
  }

  public onNoClick(): void {
    this.dialogRef.close(false);
  }
}
