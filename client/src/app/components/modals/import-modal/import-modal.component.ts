import {
  Component,
  Inject,
  HostBinding,
  ViewChild,
  ElementRef
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

import { SdkService } from 'src/app/services/sdk.service';
import { IImportError } from '../../../../../../sdk/interfaces';
import { fadeAnimation } from 'src/app/animations/animations';
import { SLCService } from '../../slc-selector/slc-selector.service';

@Component({
  selector: 'app-import-modal',
  templateUrl: './import-modal.component.html',
  animations: [fadeAnimation]
})
export class ImportModalComponent {
  @HostBinding('class') classes = 'modal_box';
  @ViewChild('fileReader', { static: false }) private fileReader: ElementRef;
  public uploading = false;
  public endMode: boolean;
  public fileName: string;
  public structure: any;
  public errors: IImportError[];
  public parsed: number;
  public notParsed: number;
  public path: string;
  public isStopped: boolean;
  private fileData: FormData;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data,
    public dialogRef: MatDialogRef<ImportModalComponent>,
    private sdk: SdkService,
    private slcService: SLCService
  ) {
    this.endMode = !!data.endMode;
    this.errors = data.result ? data.result.progress.errors : [];
    this.parsed = data.result ? data.result.progress.parsed : 0;
    this.notParsed = data.result ? data.result.progress.notParsed : 0;
    this.isStopped = data.result ? data.result.progress.isStopped : false;
    this.path = data.path;

    this.structure = Object.values({
      ...this.slcService.selectedSchool,
      ...data.structure
    })
      .map((item: any) => item.name)
      .join(' > ');
  }

  public getTemplateLink(): string {
    return `assets/templates/list_of_${this.data.type}s.xlsx`;
  }

  public onImportClick(): void {
    this.uploading = true;
    this.sdk.client
      .import(this.data.type, this.fileData)
      .then(() => this.onNoClick());
  }

  public handleInputChange(e: any): void {
    const file = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
    this.fileName = file.name || 'file';
    const data = new FormData();
    data.append('fileData', file);
    if (this.data.structure) {
      data.append('academicYearName', this.data.structure.academicYear.name);
      data.append('academicYearId', this.data.structure.academicYear.id);
      data.append('segmentName', this.data.structure.segment.name);
      data.append('segmentId', this.data.structure.segment.id);
      data.append('levelName', this.data.structure.level.name);
      data.append('levelId', this.data.structure.level.id);
      data.append('className', this.data.structure.class.name);
      data.append('classId', this.data.structure.class.id);
    }
    this.fileData = data;
  }

  public getItemPath(): string {
    return this.structure;
  }

  public clearFileReader(): void {
    this.fileReader.nativeElement.value = this.fileName = this.fileData = null;
  }

  public onNoClick(): void {
    this.dialogRef.close(false);
  }
}
