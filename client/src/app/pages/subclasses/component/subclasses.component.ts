import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material';
import { BehaviorSubject } from 'rxjs';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem
} from '@angular/cdk/drag-drop';

import { AuthService } from 'src/app/auth/auth.service';
import { SdkService } from 'src/app/services/sdk.service';
import { LayoutService } from 'src/app/services/layout.service';
import { IGroup, IStudent, ISubGroup } from '../../../../../../sdk/interfaces';
import { ConfirmationModalComponent } from 'src/app/components/modals/confirmation-modal/confirmation-modal.component';
import { SLCService } from '../../../components/slc-selector/slc-selector.service';

@Component({
  selector: 'app-subclasses',
  templateUrl: './subclasses.component.html'
})
export class SubclassesComponent implements OnInit {
  private recievedId: number;
  public currentData: IGroup;
  public defaultSubclass: IStudent[] = new Array();
  public subSubclasses: ISubGroup[];
  public maxSubclassesCount = 5;
  disabled = false;

  private _uploading = new BehaviorSubject<boolean>(false);
  public uploading$ = this._uploading.asObservable();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private sdk: SdkService,
    private authService: AuthService,
    private SLCService: SLCService,
    public layout: LayoutService,
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.recievedId = params.id;
    });
    this.sdk.client
      .getGroup(this.recievedId)
      .then(data => this.setExisting(data));
    this.maxSubclassesCount = Number(this.authService.localData.config.subgroupsMaxCount);
  }

  private setExisting(data: IGroup): void {
    this.currentData = data;
    this.subSubclasses = data.subgroups;
    this.defaultSubclass = data.unassignedStudents;
    for(let i = 0; i<this.subSubclasses.length;i++){
      this.subSubclasses[i].msg = '';
    }
  }

  public sortSubSubclasses(): void {
    this.subSubclasses.forEach(subclass => {
      subclass.students.sort((a, b) => a.lastName.localeCompare(b.lastName));
    });
  }

  public addSubclass(): void {
    const subclass: ISubGroup = {
      name: `${this.currentData.subject.name} ${this.subSubclasses.length + 1}`,
      students: []
    };
    this.subSubclasses.push(subclass);
    for(let i = 0; i<this.subSubclasses.length;i++){
      this.subSubclasses[i].msg = '';
    }
    // check duplicates and empty fields 
    for(let i = 0; i < this.subSubclasses.length;i++) {
      for(let j = 0; j < this.subSubclasses.length;j++) {
        if(i !== j) {
          if(this.subSubclasses[i].name === this.subSubclasses[j].name){
            this.subSubclasses[j].msg =
            this.subSubclasses[j].name === null || this.subSubclasses[j].name.match(/^ *$/) !== null ? 'The field cannot be empty' 
            : 'Subclass names cannot be the same. Please change your Subclass names' 
          }
        }
      }
    }
    const emptyIndex = this.subSubclasses.findIndex(a=>  a.name === null || a.name.match(/^ *$/) !== null)   
    if(emptyIndex > -1){ 
      this.subSubclasses[emptyIndex].msg ='The field cannot be empty' 
    } 
    const hasMsg = this.subSubclasses.findIndex(empty => empty.msg != '');  
    this.disabled =  hasMsg > -1 ? true : false;
  }

  onTextChanged(event, index){  
    for(let i = 0; i<this.subSubclasses.length;i++){
      this.subSubclasses[i].msg = '';
    }
    
    for(let i = 0; i < this.subSubclasses.length;i++) {
      for(let j = 0; j < this.subSubclasses.length;j++) {
        if(i !== j) {
          if(this.subSubclasses[i].name === this.subSubclasses[j].name){
            this.subSubclasses[j].msg =
            this.subSubclasses[j].name === null || this.subSubclasses[j].name.match(/^ *$/) !== null ? 'The field cannot be empty' 
            : 'Subclass names cannot be the same. Please change your Subclass names'
          }
        }
      }
    }
    const emptyIndex = this.subSubclasses.findIndex(a=>  a.name === null || a.name.match(/^ *$/) !== null)   
    if(emptyIndex > -1){ 
      this.subSubclasses[emptyIndex].msg ='The field cannot be empty' 
    } 
    const hasMsg = this.subSubclasses.findIndex(empty => empty.msg != '');  
    this.disabled =  hasMsg > -1 ? true : false;
  }

  public onSubmitSubclass(): void {
    this._uploading.next(true);
    const subclasses: ISubGroup[] = new Array();
    this.subSubclasses.forEach(subclass => {
      const tempSubclass: ISubGroup = {
        id: subclass.id,
        name: subclass.name,
        studentsIds: subclass.students.map(learner => learner.id)
      };
      subclasses.push(tempSubclass);
    });
    const subclassData: IGroup = {
      subjectId: this.currentData.subject.id,
      subgroups: subclasses
    };
    this.sdk.client
      .updateGroup(this.recievedId, subclassData)
      .then(() => this.onNoClick());
      this.SLCService.editPageRedir = true; 
  }

  // drag&drop list methods
  public drop(event: CdkDragDrop<string[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }

  // remove item from subclass
  public removeItem(array: IStudent[], index: number): void {
    if (index >= 0) {
      const removed = array.splice(index, 1);
      this.defaultSubclass = [...this.defaultSubclass, ...removed];
    }
  }

  // remove subclass
  public removeSubSubclass(index: number, learners: IStudent[]): void {
    if (index >= 0) {
      this.subSubclasses.splice(index, 1);
      this.defaultSubclass = [...this.defaultSubclass, ...learners];
    }
    const hasMsg = this.subSubclasses.findIndex(empty => empty.msg != '');  
    this.disabled =  hasMsg > -1 ? true : false;
  }

  // delete subclasses
  public onDeleteClick(): void {
    setTimeout(() => {
      const confirmModal = this.dialog.open(ConfirmationModalComponent, {
        panelClass: ['modal', 'confirm'],
        autoFocus: false,
        restoreFocus: false,
        role: 'alertdialog',
        data: { title: 'Are you sure you want to delete this subclasses?' }
      });
      confirmModal.beforeClosed().subscribe({
        next: result => {
          if (result) {
            this.sdk.client
              .deleteGroup(this.recievedId)
              .then(() => this.onNoClick());
          }
        }
      });
    }, 300);
  }

  // navigate to previous page
  public onNoClick(): void {
    this.SLCService.editPageRedir = true; 
    this.router.navigate(['/subclasses']);
  }
}
