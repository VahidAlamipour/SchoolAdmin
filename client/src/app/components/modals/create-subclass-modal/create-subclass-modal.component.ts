import { Component, OnInit, Inject, HostBinding, ChangeDetectorRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { FormBuilder, FormGroup } from '@angular/forms';

import { AuthService } from 'src/app/auth/auth.service';
import { SdkService } from 'src/app/services/sdk.service';
import { ISubject, ISubGroup } from '../../../../../../sdk/interfaces';
import { VALIDATION_MESSAGES } from '../components/validation_messages';

@Component({
  selector: 'app-create-subclass-modal',
  templateUrl: './create-subclass-modal.component.html'
})
export class CreateSubclassModalComponent implements OnInit {
  @HostBinding('class') classes = 'modal_box';

  public validation_messages = VALIDATION_MESSAGES;

  public coursesList: ISubject[] = [];
  public numberOfSubclasses: number[];
  public numberOfSubclassesInputs: Array<any> = new Array();
  public disabled = false;
  public errorMsg : string = '';

  public detailsForm: FormGroup = this.formBuilder.group({});
  public subclassesForm: FormGroup = this.formBuilder.group({});

  get selectedClassId() {
    return +localStorage.getItem('classSelected');
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private formBuilder: FormBuilder,
    private sdk: SdkService,
    private authService: AuthService,
    public dialogRef: MatDialogRef<CreateSubclassModalComponent>,
    public readonly cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.sdk.client
      .getClass(this.selectedClassId)
      .then(classs =>
        this.detailsForm.controls.class.patchValue(
          classs.level.name + classs.name
        )
      );
    this.sdk.client
      .getSubjects({ limit: -1 })
      .then(data => (this.coursesList = data.list));
    this.fillNumberOfSubclasses(Number(this.authService.localData.config.subgroupsMaxCount));
  }

  private fillNumberOfSubclasses(count: number): void {
    this.numberOfSubclasses = new Array();

    for (let i = 1; i <= count; i++) {
      this.numberOfSubclasses.push(i);
    }
  }

  public courseSelectedChange(subject: any): void {  
    this.disabled = false;
    this.errorMsg = '';
    let size = 0;
    if(this.subclassesForm.value ){ 
      for(var index in this.subclassesForm.value ){  
        delete this.subclassesForm.value[index];  
        size++;
      } 
      this.subclassesForm.reset();
    } 
    if(Object.keys(this.subclassesForm.value).length !== 0){
      let i = 0;
      for(var index in this.subclassesForm.value ){  
        for (let i = 0; i < size; i++) {
        const subclassInput = {
          id: i + 1,
          label: `Subclass ${i + 1}`,
          formName: `subclass${i + 1}`
        }; 
        this.subclassesForm.controls[subclassInput.formName].setValue(
          `${subject.value.name} ${subclassInput.id}`
        ); 
        }
      } 
    }
    this.cd.markForCheck(); 

  }

  public numberOfSubclassesSelectionChange(subclassCount: number): void {    
    this.disabled = false;
    this.errorMsg = '';
    this.numberOfSubclassesInputs = [];
    if(this.subclassesForm.value ){ 
     for(var index in this.subclassesForm.value ){  
       delete this.subclassesForm.value[index];  
     } 
     this.subclassesForm.reset();
   }
   
   this.cd.markForCheck();
    for (let i = 0; i < subclassCount; i++) {
      const subclassInput = {
        id: i + 1,
        label: `Subclass ${i + 1}`,
        formName: `subclass${i + 1}`
      };
      this.numberOfSubclassesInputs.push(subclassInput);
      setTimeout(
        () =>{
         this.subclassesForm.controls[subclassInput.formName].patchValue(
            `${this.detailsForm.get('subject').value.name} ${subclassInput.id}`
          );
        },
        0
      );
    }
  }

  public textChanged(data: any):void {
    let arr = [];
    for( let index in this.subclassesForm.value ){ 
      if(this.subclassesForm.value[index] != null){
      arr.push(this.subclassesForm.value[index])
      }
    }
    const findDuplicates = arr.filter((s => v => s.has(v) || !s.add(v))(new Set));
    const findEmptyOrWhitespace = arr.filter(text=>text === null || text.match(/^ *$/) !== null);
    this.disabled = findDuplicates.length > 0  || findEmptyOrWhitespace.length > 0 ? true : false;
    this.errorMsg = 
    findDuplicates.length > 0 ? 'Subclass names cannot be the same. Please change your Subclass names' :
    findEmptyOrWhitespace.length > 0 || data=== null || data.match(/^ *$/) !== null ? 'The field cannot be empty' 
    : '';
  }

  public onSubmitDetails(form: any): void {
    this.cd.markForCheck();
    const subclasses: ISubGroup[] = [];
    const subForm = this.subclassesForm.value;
    Object.keys(subForm).forEach(name =>{
      if(subForm[name]!=null){
      subclasses.push({ name: subForm[name] })}}
    );
    this.sdk.client
      .newGroup({
        subjectId: form.subject.id,
        classId: this.selectedClassId,
        subgroups: subclasses
      })
      .then(() => this.dialogRef.close(true));
  }

  public onNoClick(): void {
    this.dialogRef.close();
  }
}
