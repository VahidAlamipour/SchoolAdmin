import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { MatPaginator, MatSort, MatDialog } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { merge, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';

import { SLCService } from 'src/app/components/slc-selector/slc-selector.service';
import { EventBrokerService } from 'src/app/services/eventBroker.service';
import { SdkService } from 'src/app/services/sdk.service';
import { LayoutService } from 'src/app/services/layout.service';
import { LearnersDataSource } from './learners.datasource';
import { AddDataModalComponent } from 'src/app/components/modals/add-data-modal/components/modal/add-data-modal.component';
import { CreateLearnerModalComponent } from 'src/app/components/modals/create-learner-modal/create-learner-modal.component';
import { ImportModalComponent } from 'src/app/components/modals/import-modal/import-modal.component';
import { ImportModalPreYearsComponent } from 'src/app/components/modals/import-modal-pre-years/import-modal-pre-years.component';
import { IStudent, IParent } from '../../../../../../../sdk/interfaces';
import { IEventListener } from 'src/app/models/interfaces.model';
import { NotificationsService } from 'src/app/components/notifications/services/notifications.service';

@Component({
  selector: 'app-learners-table',
  templateUrl: './learners-table.component.html'
})
export class LearnersTableComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator, { static: true })
  private paginator: MatPaginator;
  @ViewChild(MatSort, { static: true })
  private sort: MatSort;

  public searchString: string;
  public parentsModalConfig = {
    modal: AddDataModalComponent,
    searchPlaceholder: 'Enter phone number, last name or first name',
    addButtonTitle: 'Save changes',
    canBeEmpty: true,
    addingDataName: 'parents'
  };
  public displayedColumns: string[] = ['fullName', 'parent', 'phoneNumber', 'status', 'action'];
  public dataSource: LearnersDataSource;
  private _reloadListener: IEventListener;
  private subscribers: Subscription[] = new Array();
  private learnersCountVisible: number;

  get hasFilterData(): boolean {
    const searchFieldIsFilled: boolean = this.searchString.length !== 0;
    return searchFieldIsFilled;
  }

  get hasData() {
    return this.dataSource.hasInitData$;
  }

  constructor(
    private dialog: MatDialog,
    private sdk: SdkService,
    private layout: LayoutService,
    private route: ActivatedRoute,
    private router: Router,
    private slcService: SLCService,
    private _eventBroker: EventBrokerService,
    private notificationsService: NotificationsService
  ) {
    this._reloadListener = _eventBroker.listen<boolean>('reloadData', (data: any) => {
      if (data.reload) {
        this.loadLearnersDatasource();
      }
    });
  }

  ngOnInit() {
    this.searchString = this.route.snapshot.queryParamMap.get('search') || '';
    // init table
    this.dataSource = new LearnersDataSource(this.sdk);
    this.loadLearnersDatasource();
    this.subscribers.push(
      this.dataSource.learnersSubject$.subscribe((list) => (this.learnersCountVisible = list.length)),
      this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0)),
      merge(this.sort.sortChange, this.paginator.page)
        .pipe(tap(() => this.loadLearnersDatasource()))
        .subscribe()
    );
  }

  public getActiveStatus(user: IStudent): string {
    switch (user.active) {
      case true:
        return 'Activated';
      case false:
        return 'User is inactive';
      default:
        return 'User hasn’t activated the account yet';
    }
  }

  // activation/deactivation
  public userActivation(userId: number, isActive: boolean): void {
    this.sdk.client.activationUserInSchool(userId, { role: "Learner" }).then(() => {
      this.loadLearnersDatasource()
    });
    // if (isActive) {
    //   this.sdk.client.deactivateUser(userId).then(() => this.loadLearnersDatasource());
    // } else {
    //   this.sdk.client.activateUser(userId).then(() => this.loadLearnersDatasource());
    // }
  }

  // filter by search string (with api)
  public applyFilter(searchString?: string): void {
    if (searchString !== undefined && searchString !== null) {
      this.searchString = searchString;
    }
    this.paginator.pageIndex = 0;
    this.loadLearnersDatasource();
  }

  // load data from backend
  private loadLearnersDatasource(classId = +localStorage.getItem('classSelected')): void {
    this.dataSource.loadLearners(
      {
        classId: classId === 0 ? null : classId,
        query: this.searchString,
        page: this.paginator.pageIndex,
        limit: this.paginator.pageSize,
        order: this.sort.direction
      },
      this.hasFilterData
    );
  }

  // working with modals
  public openCreateDialog(target: string, data?: IStudent): void {
    switch (target) {
      case 'create':
        const createLearnersData = {
          title: 'Create learner',
          saveButtonText: 'Create learner'
        };
        this.learnerModal(createLearnersData);
        break;
      case 'edit':
        const editLearnerData = {
          existing: data.id,
          title: 'Edit learner account',
          saveButtonText: 'Save'
        };
        this.learnerModal(editLearnerData);
        break;
      default:
        break;
    }
  }

  public importModal(): void {
    const fullStructure = this.slcService.structureSubject.value;
    const academicYearId = +localStorage.getItem('yearSelected');
    const segmentId = +localStorage.getItem('segmentSelected');
    const levelId = +localStorage.getItem('levelSelected');
    const classId = +localStorage.getItem('classSelected');
    const structure = {
      academicYear: fullStructure.academicYears.find((academicYear) => academicYear.id === academicYearId),
      segment: fullStructure.segments.find((segment) => segment.id === segmentId),
      level: fullStructure.levels.find((level) => level.id === levelId),
      class: fullStructure.classes.find((classs) => classs.id === classId)
    };

    this.layout.blurWrapContainer();
    const createModal = this.dialog.open(ImportModalComponent, {
      panelClass: ['modal', 'import'],
      restoreFocus: false,
      autoFocus: false,
      data: { type: 'learner', structure: structure }
    });
    createModal.beforeClosed().subscribe({
      next: () => {
        setTimeout(() => {
          this.layout.unblurWrapContainer()
          this.loadLearnersDatasource();
          this.slcService.getStructure();
        }, 4000);
      }
    });
  }
  public importPreYearsModal(): void {
    const fullStructure = this.slcService.structureSubject.value;
    const academicYearId = +localStorage.getItem('yearSelected');
    const segmentId = +localStorage.getItem('segmentSelected');
    const levelId = +localStorage.getItem('levelSelected');
    const classId = +localStorage.getItem('classSelected');
    const structure = {
      academicYear: fullStructure.academicYears.find((academicYear) => academicYear.id === academicYearId),
      segment: fullStructure.segments.find((segment) => segment.id === segmentId),
      level: fullStructure.levels.find((level) => level.id === levelId),
      class: fullStructure.classes.find((classs) => classs.id === classId)
    };

    this.layout.blurWrapContainer();
    const createModal = this.dialog.open(ImportModalPreYearsComponent, {
      panelClass: ['modal', 'import'],
      restoreFocus: false,
      autoFocus: false,
      data: { type: 'learner', structure: structure, fullStructure }
    });
    createModal.beforeClosed().subscribe({
      next: () => {
        this.layout.unblurWrapContainer()
        this.loadLearnersDatasource();
        this.slcService.getStructure();
      }
    });
  }

  private learnerModal(data: any): void {
    this.layout.blurWrapContainer();
    const createModal = this.dialog.open(CreateLearnerModalComponent, {
      panelClass: ['modal'],
      restoreFocus: false,
      autoFocus: false,
      data: data
    });
    createModal.beforeClosed().subscribe({
      next: (result) => {
        this.layout.unblurWrapContainer();
        if (result.needToUpdate) {
          if (result.delete && this.learnersCountVisible && this.learnersCountVisible === 1) {
            this.paginator.previousPage();
          }
          this.loadLearnersDatasource();
          this.slcService.getStructure();
        }
      }
    });
  }

  public addParentsModal(data: IStudent): void {
    this.layout.blurWrapContainer();
    const dataModal = this.dialog.open(AddDataModalComponent, {
      panelClass: ['modal', 'add_data'],
      data: {
        ...this.parentsModalConfig,
        selectedItems: data.parents
      }
    });
    dataModal.beforeClosed().subscribe({
      next: (result) => {
        this.layout.unblurWrapContainer();
        if (result) {
          this.sdk.client
            .updateStudent(data.id, {
              ...data,
              parentsIds: result.map((parent: IParent) => parent.id)
            })
            .then(() => this.loadLearnersDatasource())
            .then(() => {
              this.notificationsService.notifyUser({
                message: 'Learner has been successfully updated',
                type: 'success'
              });
            });
        }
      }
    });
  }

  public changeTheRoles(route: string, element: IStudent, $event: MouseEvent) {
    this.router.navigate([element.id, route], { relativeTo: this.route });
  }

  ngOnDestroy() {
    this._reloadListener.ignore();
    if (this.subscribers.length > 0) {
      this.subscribers.map((subscriber) => subscriber.unsubscribe());
    }
  }
}
