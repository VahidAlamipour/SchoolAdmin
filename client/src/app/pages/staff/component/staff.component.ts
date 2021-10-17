import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { MatPaginator, MatSort, MatDialog } from '@angular/material';
import { Router, ActivatedRoute } from '@angular/router';
import { merge, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';

import { SdkService } from 'src/app/services/sdk.service';
import { LayoutService } from 'src/app/services/layout.service';
import { CreateAdminModalComponent } from 'src/app/components/modals/create-admin-modal/create-admin-modal.component';
import { StaffDataSource } from '../staff.datasource';
import { ISBModal } from 'src/app/models/interfaces.model';
import { IUser } from '../../../../../../sdk/interfaces';

@Component({
  selector: 'app-staff',
  templateUrl: './staff.component.html'
})
export class StaffComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator, { static: true })
  private paginator: MatPaginator;
  @ViewChild(MatSort, { static: true })
  private sort: MatSort;

  private adminsCountVisible: number;
  public searchString: string;
  public dataSource: StaffDataSource;
  public displayedColumns: string[] = ['fullName', 'phoneNumber', 'address', 'institution', 'status', 'action'];

  private staffTypes: any[];
  public filterBox: Array<any>;
  public selectedTypeFilter: string = String('');
  private subscribers: Subscription[] = new Array();

  get adminsData(): boolean {
    return this.dataSource.adminsCount$ && this.dataSource.adminsCount > 0;
  }

  get hasFilterData(): boolean {
    let filterIsFilled: boolean;
    this.selectedTypeFilter !== '' ? (filterIsFilled = true) : (filterIsFilled = false);
    const searchFieldIsFilled: boolean = this.searchString.length !== 0;
    return filterIsFilled || searchFieldIsFilled;
  }

  get hasData() {
    return this.dataSource.hasInitData$;
  }

  constructor(
    private dialog: MatDialog,
    private sdk: SdkService,
    private layout: LayoutService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.searchString = this.route.snapshot.queryParamMap.get('search') || '';
    this.loadStaffTypes();
    // init table
    this.dataSource = new StaffDataSource(this.sdk);
    this.loadDatasource();
    this.subscribers.push(
      this.dataSource.adminsSubject$.subscribe((list) => (this.adminsCountVisible = list.length)),
      this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0)),
      merge(this.sort.sortChange, this.paginator.page)
        .pipe(tap(() => this.loadDatasource()))
        .subscribe()
    );
  }

  private loadStaffTypes(): void {
    const staffTypes: Array<any> = new Array();
    this.sdk.client
      .getStaffRoles()
      .then((data) =>
        data.forEach((type) =>
          staffTypes.push({
            value: type,
            name: this.beautifyType(type)
          })
        )
      )
      .then(() => {
        this.staffTypes = staffTypes;
        this.filterBox = [{ value: '', name: 'All' }, ...staffTypes];
        this.selectedTypeFilter = this.filterBox[0].value;
      });
  }

  private beautifyType(type: string): string {
    return (
      type.charAt(0).toUpperCase() +
      type
        .slice(1)
        .replace(/_/g, ' ')
        .toLowerCase()
    );
  }

  // filter by search string (with api)
  public applyFilter(searchString?: string): void {
    if (searchString !== undefined && searchString !== null) {
      this.searchString = searchString;
    }
    this.paginator.pageIndex = 0;
    this.loadDatasource();
  }

  // load data from backend
  public loadDatasource(): void {
    this.dataSource.loadAdmins(
      {
        query: this.searchString || null,
        type: this.selectedTypeFilter,
        page: this.paginator.pageIndex,
        limit: this.paginator.pageSize,
        order: this.sort.direction ? this.sort.direction : 'asc'
      },
      this.hasFilterData
    );
  }

  // modals
  public openDialog(mode?: string, data?: any): void {
    let modalData: ISBModal;
    switch (mode) {
      case 'edit':
        modalData = {
          title: 'Edit administrator',
          saveButtonText: 'Save',
          data: data
        };
        break;
      default:
        modalData = {
          title: 'Create administrator',
          saveButtonText: 'Create administrator'
        };
        break;
    }
    this.createModal(modalData);
  }

  private createModal(data: any) {
    this.layout.blurWrapContainer();
    const modalRef = this.dialog.open(CreateAdminModalComponent, {
      panelClass: ['modal', 'noheight'],
      data: data
    });
    modalRef.beforeClosed().subscribe({
      next: (result) => {
        this.layout.unblurWrapContainer();
        if (result.needToUpdate) {
          if (result.delete && this.adminsCountVisible && this.adminsCountVisible === 1) {
            this.paginator.previousPage();
          }
          this.loadDatasource();
        }
      }
    });
  }

  // get staff types
  public getTypes(types: string[]): string {
    const tempTypes: Array<any> = new Array();
    if (this.staffTypes && types) {
      types.forEach((type) => tempTypes.push(this.staffTypes.find((staffType) => type === staffType.value)));
    }
    return tempTypes.map((type) => type.name).join(', ');
  }

  // activation/deactivation
  public canBeDeactivated(isActive: boolean, types: string[]): boolean {
    return isActive ? !types.some((type) => type === 'ACCOUNT_ADMINISTRATOR') : true;
  }

  public userActivation(userId: number, isActive: boolean) {
    if (isActive) {
      this.sdk.client.deactivateUser(userId).then(() => this.loadDatasource());
    } else {
      this.sdk.client.activateUser(userId).then(() => this.loadDatasource());
    }
  }

  public getActiveStatus(user: IUser): string {
    switch (user.active) {
      case true:
        return 'Activated';
      case false:
        return 'User is inactive';
      default:
        return 'User hasn’t activated the account yet';
    }
  }

  public getActiveStatusIcon(user: IUser): string {
    switch (user.active) {
      case true:
        return 'check-icon';
      case false:
        return 'cross-icon';
      default:
        return 'warn-icon';
    }
  }

  // navigate to 'Roles' page
  public changeTheRoles(route: string, element: IUser) {
    this.router.navigate([element.id, route], { relativeTo: this.route });
  }

  ngOnDestroy() {
    if (this.subscribers.length > 0) {
      this.subscribers.map((subscriber) => subscriber.unsubscribe());
    }
  }
}
