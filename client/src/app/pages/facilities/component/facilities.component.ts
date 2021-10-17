import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { MatPaginator, MatSort, MatDialog } from '@angular/material';
import { tap } from 'rxjs/operators';
import { merge, Subscription } from 'rxjs';

import { FacilitiesModalComponent } from 'src/app/components/modals/facilities-modal/facilities-modal.component';
import { FacilitiesDataSource } from '../facilities.datasource';
import { LayoutService } from 'src/app/services/layout.service';
import { SdkService } from 'src/app/services/sdk.service';
import { ISubject, IRoom } from '../../../../../../sdk/interfaces';

@Component({
  selector: 'app-facilities',
  templateUrl: './facilities.component.html'
})
export class FacilitiesComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator, { static: true })
  private paginator: MatPaginator;
  @ViewChild(MatSort, { static: true })
  private sort: MatSort;

  public searchString = '';

  public displayedColumns: string[] = [
    'name',
    'course',
    'description',
    'refersTo',
    'capacity',
    'action'
  ];

  public dataSource: FacilitiesDataSource;

  public filterBox: ISubject[] = [{ id: 0, name: 'All' }];

  public selectedCourse = this.filterBox[0].id;
  private subscribers: Subscription[] = [];

  get facilitiesData(): boolean {
    return (
      this.dataSource.facilitiesCount$ && this.dataSource.facilitiesCount > 0
    );
  }

  get hasFilterData(): boolean {
    let filterIsFilled: boolean;
    this.selectedCourse !== 0
      ? (filterIsFilled = true)
      : (filterIsFilled = false);
    const searchFieldIsFilled: boolean = this.searchString.length !== 0;
    return filterIsFilled || searchFieldIsFilled;
  }

  get hasData() {
    return this.dataSource.hasInitData$;
  }

  constructor(
    private dialog: MatDialog,
    private sdk: SdkService,
    private layout: LayoutService
  ) {}

  ngOnInit() {
    this.dataSource = new FacilitiesDataSource(this.sdk);
    this.dataSource.loadFacilities({
      page: 0,
      limit: 10
    });
    this.subscribers.push(
      this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0)),
      merge(this.sort.sortChange, this.paginator.page)
        .pipe(tap(() => this.loadFacilitiesPage()))
        .subscribe()
    );
    this.sdk.client
      .getSubjects({ limit: -1 })
      .then(res => res.list.forEach(element => this.filterBox.push(element)));
  }

  // filter by search string (with api)
  public applyFilter(searchString?: string): void {
    if (searchString !== undefined && searchString !== null) {
      this.searchString = searchString;
    }
    this.paginator.pageIndex = 0;
    this.loadFacilitiesPage();
  }

  // load data from backend
  public loadFacilitiesPage() {
    this.dataSource.loadFacilities(
      {
        query: this.searchString,
        subject: +this.selectedCourse,
        page: this.paginator.pageIndex,
        limit: this.paginator.pageSize,
        order: this.sort.direction
      },
      this.hasFilterData
    );
  }

  // open 'create facility' modal
  public openCreateDialog() {
    this.layout.blurWrapContainer();
    const modal = this.dialog.open(FacilitiesModalComponent, {
      panelClass: ['modal', 'noheight'],
      restoreFocus: false,
      data: {
        title: 'Create facility',
        saveButtonText: 'Create facility'
      }
    });
    modal.beforeClosed().subscribe({
      next: result => {
        this.layout.unblurWrapContainer();
        if (result) {
          this.paginator.firstPage();
          this.loadFacilitiesPage();
        }
      }
    });
  }

  // open 'edit facility' modal
  public openEditDialog(facilityData: IRoom): void {
    this.layout.blurWrapContainer();
    const modal = this.dialog.open(FacilitiesModalComponent, {
      id: 'edit',
      panelClass: ['modal', 'noheight'],
      restoreFocus: false,
      data: {
        title: 'Edit facility',
        saveButtonText: 'Save',
        facilityData: facilityData
      }
    });
    modal.beforeClosed().subscribe({
      next: result => {
        this.layout.unblurWrapContainer();
        if (result) {
          this.paginator.firstPage();
          this.loadFacilitiesPage();
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.subscribers.length > 0) {
      this.subscribers.map(subscriber => subscriber.unsubscribe());
    }
  }
}
