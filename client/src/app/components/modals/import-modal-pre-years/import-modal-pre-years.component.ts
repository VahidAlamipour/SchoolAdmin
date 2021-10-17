import {
  Component,
  Inject,
  HostBinding,
  ViewChild,
  ElementRef
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';

import { SdkService } from 'src/app/services/sdk.service';
import { IImportError } from '../../../../../../sdk/interfaces';
import { fadeAnimation } from 'src/app/animations/animations';
import { SLCService } from '../../slc-selector/slc-selector.service';

import { AddDataModalComponent } from 'src/app/components/modals/add-data-modal/components/modal/add-data-modal.component';


@Component({
  selector: 'app-import-modal',
  templateUrl: './import-modal-pre-years.component.html',
  animations: [fadeAnimation]
})
export class ImportModalPreYearsComponent {
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
  private fullStructure: any;
  public academicYears: any;
  public segments: any;
  public levels: any;
  public classs: any;
  public loadLearnerForm: FormGroup;
  public learnersModalConfig = {
    modal: AddDataModalComponent,
    searchPlaceholder: 'Enter mobile number, last name or first name',
    addButtonTitle: 'Save changes',
    canBeEmpty: true,
    addingDataName: 'learners',
    classId:'',
    title:'Choose Learner'
  };

  constructor(
    @Inject(MAT_DIALOG_DATA) public data,
    public dialogRef: MatDialogRef<ImportModalPreYearsComponent>,
    private sdk: SdkService,
    private slcService: SLCService,
    private formBuilder: FormBuilder,
  ) {
    this.academicYears = data.fullStructure.academicYears;
    this.segments = data.fullStructure.segments;
    this.fullStructure = data.fullStructure;
    this.loadLearnerForm = this.formBuilder.group({
      academicYear: [this.academicYears[0], Validators.required],
      segment: [this.segments[0], Validators.required],
      level: ['', Validators.required],
      class: ['', Validators.required],
      students:['',Validators.required],
      scheduleSettings: [false]
    });
    this.levelFiltering();
    this.classFiltering();
    this.endMode = !!data.endMode;
    this.errors = data.result ? data.result.progress.errors : [];
    this.parsed = data.result ? data.result.progress.parsed : 0;
    this.notParsed = data.result ? data.result.progress.notParsed : 0;
    this.isStopped = data.result ? data.result.progress.isStopped : false;
    this.path = data.path;
    this.structure = data.structure;
    // this.structure = Object.values({
    //   ...this.slcService.selectedSchool,
    //   ...data.structure
    // })
    //   .map((item: any) => item.name)
    //   .join(' > ');
  }

  public levelFiltering() {
    var levelsO = this.fullStructure.levels
      .filter(l => l.segmentId == this.loadLearnerForm.controls.segment.value.id);
    this.levels = levelsO;
    this.loadLearnerForm.controls.level.setValue(this.levels[0]);
    this.classFiltering();
  }
  public classFiltering() {
    var classesO = this.fullStructure.classes
      .filter(l => l.yearId == this.loadLearnerForm.controls.academicYear.value.id &&
        l.levelId == this.loadLearnerForm.controls.level.value.id);
    this.classs = classesO;
    this.loadLearnerForm.controls.class.setValue(this.classs[0]);
    this.modalConfigChanger();
    
  }
  /**
   * modalConfigChanger
   * it's changing class of students 
   */
  public modalConfigChanger() {
    this.loadLearnerForm.controls.class.value && (this.learnersModalConfig.classId = this.loadLearnerForm.controls.class.value.id);
  }

  public onImportClick(): void {
    this.sdk.client
      .import(this.data.type, 
        {
          learners:this.loadLearnerForm.controls.students.value,
          classId : this.structure.class.id,
          sameYear:this.structure.academicYear.id == this.loadLearnerForm.controls.academicYear.value.id,
          toYear:this.structure.academicYear.id,
          fromYear:this.loadLearnerForm.controls.academicYear.value.id
      })
      .then(() => this.onNoClick()).catch(error=>this.onNoClick());
  }

  public handleInputChange(e: any): void {
    const file = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
    this.fileName = file.name || 'file';
    const data = new FormData();
    data.append('fileData', file);
    if (this.data.structure) {
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
