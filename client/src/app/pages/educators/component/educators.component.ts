import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { MatPaginator, MatSort, MatDialog } from '@angular/material';
import { Router, ActivatedRoute } from '@angular/router';
import { merge, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';

import { CreateEducatorModalComponent } from 'src/app/components/modals/create-educator-modal/create-educator-modal.component';
import { ImportModalComponent } from 'src/app/components/modals/import-modal/import-modal.component';
import { EducatorsDataSource } from '../educators.datasource';
import { LayoutService } from 'src/app/services/layout.service';
import { SdkService } from 'src/app/services/sdk.service';
import { ITeacher } from '../../../../../../sdk/interfaces';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-educators',
  templateUrl: './educators.component.html'
})
export class EducatorsComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator, { static: true })
  private paginator: MatPaginator;
  @ViewChild(MatSort, { static: true })
  private sort: MatSort;

  private educatorsCountVisible: number;
  private educatorTypes: any[];
  public filterBox: Array<any>;
  public selectedTypeFilter: string = String('');
  public searchString: string;

  public displayedColumns: string[] = ['fullName', 'phoneNumber', 'education', 'type', 'status', 'action'];

  public dataSource: EducatorsDataSource;
  private subscribers: Subscription[] = [];

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
    private router: Router,
    private route: ActivatedRoute,
    public layout: LayoutService,
    private cookieService : CookieService
  ) {}

  ngOnInit() {
    this.layout.selectedPagination !== null && this.layout.selectedPagination !== undefined ? this.paginator.pageSize = this.layout.selectedPagination : null;


    this.loadEducatorsRoles();
    this.searchString = this.route.snapshot.queryParamMap.get('search') || '';
    this.dataSource = new EducatorsDataSource(this.sdk);
    this.subscribers.push(
      this.dataSource.educatorsSubject$.subscribe((list) => (this.educatorsCountVisible = list.length)),
      this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0)),
      merge(this.sort.sortChange, this.paginator.page)
        .pipe(tap(() => this.loadEducatorsPage()))
        .subscribe()
    );
    this.loadEducatorsPage();

  }

  public saveSelectedPagination(event) {
    this.layout.selectedPagination = event.pageSize;
  }

  private loadEducatorsRoles(): void {
    const educatorTypes: Array<any> = new Array();
    this.sdk.client
      .getTeachersRoles()
      .then((data) =>
        data.forEach((type) =>
          educatorTypes.push({
            value: type,
            name: this.beautifyType(type)
          })
        )
      )
      .then(() => {
        this.educatorTypes = educatorTypes;
        this.filterBox = [{ value: '', name: 'All' }, ...educatorTypes];
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
    this.loadEducatorsPage();
  }

  // load data from backend
  public loadEducatorsPage() {
    let schoolId = this.sdk.client.getSchools({ limit: -1, cityId: +this.cookieService.get('cityId') })
    .then((res) => {
     let schoolId = res.list[0].id;
    this.dataSource.loadEducators(
      {
        query: this.searchString,
        type: this.selectedTypeFilter,
        page: this.paginator.pageIndex,
        limit: this.paginator.pageSize,
        order: this.sort.direction,
        schoolId : schoolId
      },
      this.hasFilterData);}
    );
  }

  // get educators types
  public getTypes(types: string[]): string {
    const tempTypes: Array<string> = new Array();
    if (this.educatorTypes) {
      types.forEach((type) => {
        this.educatorTypes.forEach((educatorType) => {
          if (type === educatorType.value) {
            let tempType: string;
            tempType = educatorType.name;
            tempTypes.push(tempType);
          }
        });
      });
    }
    return tempTypes.join(', ');
  }

  public getActiveStatus(user: ITeacher): string {
    switch (user.active) {
      case true:
        return 'Activated';
      case false:
        return 'User is inactive';
      default:
        return 'User hasn’t activated the account yet';
    }
  }

  public getActiveStatusIcon(user: ITeacher): string {
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
    this.sdk.client.activationUserInSchool(userId,{role:"Educator"}).then(() =>{ 
      this.loadEducatorsPage()});
    // if (isActive) {
    //   this.sdk.client.deactivateUser(userId).then(() => this.loadEducatorsPage());
    // } else {
    //   this.sdk.client.activateUser(userId).then(() => this.loadEducatorsPage());
    // }
  }

  // navigate to 'Roles' page
  public changeTheRoles(route: string, element: ITeacher) {
    this.router.navigate([element.id, route], { relativeTo: this.route });
  }

  // working with modals
  public openModal(mode: string, element?: ITeacher) {
    switch (mode) {
      case 'create':
        const createData = {
          saveButtonText: 'Create educator'
        };
        this.createModal(createData);
        break;
      case 'edit':
        const editData = {
          existing: element,
          saveButtonText: 'Save'
        };
        this.createModal(editData);
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
      data: { type: 'educator', structure: null }
    });
    createModal.beforeClosed().subscribe({
      next: () => this.layout.unblurWrapContainer()
    });
  }

  private createModal(data: any): void {
    this.layout.blurWrapContainer();
    const createModal = this.dialog.open(CreateEducatorModalComponent, {
      panelClass: 'modal',
      data: data
    });
    createModal.beforeClosed().subscribe({
      next: (result) => {
        this.layout.unblurWrapContainer();
        if (result.needToUpdate) {
          if (result.delete && this.educatorsCountVisible && this.educatorsCountVisible === 1) {
            this.paginator.previousPage();
          }
          this.loadEducatorsPage();
        }
      }
    });
  }

  ngOnDestroy() {
    if(!this.router.routerState.snapshot.url.endsWith('/roles')){
      this.layout.selectedPagination = undefined;
    }
    if (this.subscribers.length > 0) {
      this.subscribers.map((subscriber) => subscriber.unsubscribe());
    }
  }
}
