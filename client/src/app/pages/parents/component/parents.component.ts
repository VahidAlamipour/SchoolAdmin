import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatPaginator, MatSort, MatDialog } from '@angular/material';
import { CookieService } from 'ngx-cookie-service';
import { merge, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';

import { AddDataModalComponent } from 'src/app/components/modals/add-data-modal/components/modal/add-data-modal.component';
import { CreateParentModalComponent } from 'src/app/components/modals/create-parent-modal/create-parent-modal.component';
import { ImportModalComponent } from 'src/app/components/modals/import-modal/import-modal.component';
import { ParentsDataSource } from '../parents.datasource';
import { LayoutService } from 'src/app/services/layout.service';
import { SdkService } from 'src/app/services/sdk.service';
import { IParent, IStudent, IClass } from '../../../../../../sdk/interfaces';
import { NotificationsService } from 'src/app/components/notifications/services/notifications.service';

@Component({
  selector: 'app-parents',
  templateUrl: './parents.component.html'
})
export class ParentsComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator, { static: true })
  private paginator: MatPaginator;
  @ViewChild(MatSort, { static: true })
  private sort: MatSort;

  public searchString: string;
  private learnersModalConfig = {
    modal: AddDataModalComponent,
    searchPlaceholder: 'Enter phone number, last name or first name',
    addButtonTitle: 'Save changes',
    addingDataName: 'learners'
  };

  public displayedColumns: string[] = ['fullName', 'phoneNumber', 'learners', 'class', 'status', 'action'];
  public dataSource: ParentsDataSource;
  public filterBox = [{ classId: 0, name: 'All' }];
  public selectedClassId = this.filterBox[0].classId;
  private subscribers: Subscription[] = new Array();
  private parentsCountVisible: number;

  get hasFilterData(): boolean {
    let filterIsFilled: boolean;
    this.selectedClassId !== 0 ? (filterIsFilled = true) : (filterIsFilled = false);
    const searchFieldIsFilled: boolean = this.searchString.length !== 0;
    return filterIsFilled || searchFieldIsFilled;
  }

  get hasData() {
    return this.dataSource.hasInitData$;
  }

  constructor(
    private dialog: MatDialog,
    private sdk: SdkService,
    private router: Router,
    private route: ActivatedRoute,
    private layout: LayoutService,
    private cookieService: CookieService,
    private notificationsService: NotificationsService
  ) {}

  ngOnInit() {
    this.searchString = this.route.snapshot.queryParamMap.get('search') || '';
    this.dataSource = new ParentsDataSource(this.sdk, this.cookieService);
    this.subscribers.push(
      this.dataSource.parentsSubject$.subscribe((list) => (this.parentsCountVisible = list.length)),
      this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0)),
      merge(this.sort.sortChange, this.paginator.page)
        .pipe(tap(() => this.loadParentsPage()))
        .subscribe()
    );
    this.sdk.client
      .getClasses({ limit: -1 })
      .then((res) => this.setClassFilter(res.list.filter((item) => item.studentsCount)));
    this.loadParentsPage();
  }

  // filter by search string (with api)
  public applyFilter(searchString?: string): void {
    if (searchString !== undefined && searchString !== null) {
      this.searchString = searchString;
    }
    this.paginator.pageIndex = 0;
    this.loadParentsPage();
  }

  // getting data for 'filter by class'
  private setClassFilter(classes: IClass[]) {
    classes.forEach((classs) =>
      this.filterBox.push({
        name: classs.showName ? classs.name : classs.level.name + classs.name,
        classId: classs.id
      })
    );
  }

  public getClassNameById(classId: number) {
    const className = this.filterBox.find((item) => item.classId === classId);
    return className ? className.name : '';
  }

  // load data from backend
  public loadParentsPage() {
    this.dataSource.loadParents(
      {
        query: this.searchString,
        classId: +this.selectedClassId,
        page: this.paginator.pageIndex,
        limit: this.paginator.pageSize,
        order: this.sort.direction
      },
      this.hasFilterData
    );
  }

  public getActiveStatus(user: IParent): string {
    switch (user.active) {
      case true:
        return 'Activated';
      case false:
        return 'User is inactive';
      default:
        return 'User hasn’t activated the account yet';
    }
  }

  public getActiveStatusIcon(user: IParent): string {
    switch (user.active) {
      case true:
        return 'check-icon';
      case false:
        return 'cross-icon';
      default:
        return 'warn-icon';
    }
  }

  // activation/deactivation
  public userActivation(userId: number, isActive: boolean) {
    this.sdk.client.activationUserInSchool(userId,{role:"Parent"}).then(() =>
      this.loadParentsPage());
    // if (isActive) {
    //   this.sdk.client.deactivateUser(userId).then(() => this.loadParentsPage());
    // } else {
    //   this.sdk.client.activateUser(userId).then(() => this.loadParentsPage());
    // }
  }

  // navigate to 'Roles' page
  public changeTheRoles(route: string, element: IParent) {
    this.router.navigate([element.id, route], { relativeTo: this.route });
  }

  // working with modals
  public openModal(mode: string, element: IParent) {
    switch (mode) {
      case 'create':
        const createData = {
          title: 'Create parent',
          saveButtonText: 'Create parent'
        };
        this.createModal(createData);
        break;
      case 'edit':
        const editData = {
          title: 'Edit parent account',
          existing: element,
          saveButtonText: 'Save'
        };
        this.createModal(editData);
        break;
      case 'addLearners':
        this.addLearnersModal(element);
        break;
      default:
        break;
    }
  }

  public importModal(): void {
    this.layout.blurWrapContainer();
    const createModal = this.dialog.open(ImportModalComponent, {
      panelClass: ['modal', 'import'],
      restoreFocus: false,
      autoFocus: false,
      data: { type: 'parent', structure: null }
    });
    createModal.beforeClosed().subscribe({
      next: () => this.layout.unblurWrapContainer()
    });
  }

  private createModal(data: any) {
    this.layout.blurWrapContainer();
    const dialogRef = this.dialog.open(CreateParentModalComponent, {
      panelClass: 'modal',
      data: data
    });
    dialogRef.beforeClosed().subscribe({
      next: (result) => {
        this.layout.unblurWrapContainer();
        if (result.needToUpdate) {
          if (result.delete && this.parentsCountVisible && this.parentsCountVisible === 1) {
            this.paginator.previousPage();
          }
          this.loadParentsPage();
        }
      }
    });
  }

  private addLearnersModal(data: IParent) {
    this.layout.blurWrapContainer();
    const dataModal = this.dialog.open(AddDataModalComponent, {
      panelClass: ['modal', 'add_data'],
      data: {
        ...this.learnersModalConfig,
        selectedItems: data.students
      }
    });
    dataModal.beforeClosed().subscribe({
      next: (result) => {
        this.layout.unblurWrapContainer();
        if (result) {
          this.sdk.client
            .updateParent(data.id, {
              ...data,
              studentsIds: result.map((learner: IStudent) => learner.id)
            })
            .then(() => this.loadParentsPage())
            .then(() => {
              this.notificationsService.notifyUser({
                message: 'Parent has been successfully updated',
                type: 'success'
              });
            });
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.subscribers.length > 0) {
      this.subscribers.map((subscriber) => subscriber.unsubscribe());
    }
  }
}
