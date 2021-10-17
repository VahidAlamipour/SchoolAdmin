import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { MatPaginator, MatSort, MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import { merge, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';

import { SdkService } from 'src/app/services/sdk.service';
import { InstitutionsService } from '../services/institutions.service';
import { LayoutService } from 'src/app/services/layout.service';
import { InstitutionsDataSource } from './institutions.datasource';
import { AddDataModalComponent } from 'src/app/components/modals/add-data-modal/components/modal/add-data-modal.component';
import { InstitutionsModalComponent } from 'src/app/components/modals/institutions-modal/main-modal/institutions-modal.component';
import { ISchool } from '../../../../../../sdk/interfaces';
import { ISBModal } from 'src/app/models/interfaces.model';
import { InstitutionService } from '../../institution/services/institution.service';

@Component({
  selector: 'app-schools',
  templateUrl: './institutions.component.html'
})
export class InstitutionsComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator, { static: true })
  private paginator: MatPaginator;
  @ViewChild(MatSort, { static: true })
  private sort: MatSort;

  public searchString = '';

  public parentsModalConfig = {
    modal: AddDataModalComponent,
    searchPlaceholder: 'Enter phone number, last name or first name',
    addButtonTitle: 'Add parents',
    addingDataName: 'parents'
  };
  public dataSource: InstitutionsDataSource;
  public displayedColumns: string[] = [
    'shortName',
    'fullName',
    'city',
    'action'
  ];
  public filterBox: Array<any>;
  public selectedCityId: number;
  private subscribers: Subscription[] = new Array();

  constructor(
    private dialog: MatDialog,
    private sdk: SdkService,
    private service: InstitutionsService,
    private router: Router,
    private layout: LayoutService,
    private instService: InstitutionService
  ) {}

  ngOnInit() {
    this.setCityFilter();
    // init table
    this.dataSource = new InstitutionsDataSource(this.sdk);
    this.loadInstitutionsDatasource();
    this.subscribers.push(
      this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0))
    );
    this.subscribers.push(
      merge(this.sort.sortChange, this.paginator.page)
        .pipe(tap(() => this.loadInstitutionsDatasource()))
        .subscribe()
    );
  }

  // filter by search string (with api)
  public applyFilter(searchString?: string): void {
    if (searchString !== undefined && searchString !== null) {
      this.searchString = searchString;
    }
    this.paginator.pageIndex = 0;
    this.loadInstitutionsDatasource();
  }

  // getting data for 'filter by city'
  private setCityFilter(): void {
    this.service.getCities();
    const citiesSubscription = this.service.cities$.subscribe({
      next: cities => {
        this.filterBox = [{ id: 0, name: 'All' }, ...cities];
        this.selectedCityId = this.filterBox[0].id;
      },
      complete: () => citiesSubscription.unsubscribe()
    });
  }

  // load data from backend
  private loadInstitutionsDatasource(): void {
    this.dataSource.loadInstitutions({
      cityId: this.selectedCityId,
      query: this.searchString || null,
      page: this.paginator.pageIndex,
      limit: this.paginator.pageSize,
      order: this.sort.direction ? this.sort.direction : 'asc'
    });
  }

  // modals
  public openDialog(mode?: string, data?: ISchool): void {
    let modalData: ISBModal;
    switch (mode) {
      case 'edit':
        modalData = {
          title: 'Edit institution',
          saveButtonText: 'Save',
          data: data
        };
        break;
      default:
        modalData = {
          title: 'Create institution',
          saveButtonText: 'Create institution'
        };
        break;
    }
    this.createModal(modalData);
  }

  private createModal(data: any) {
    this.layout.blurWrapContainer();
    this.dialog
      .open(InstitutionsModalComponent, {
        panelClass: ['modal', 'institutions'],
        data: data
      })
      .beforeClosed()
      .subscribe({
        next: result => {
          this.layout.unblurWrapContainer();
          if (result) {
            this.setCityFilter();
            this.loadInstitutionsDatasource();
            this.paginator.firstPage();
          }
        }
      });
  }

  public institutionSelected(institution: ISchool, event: any): void {
    this.instService.editMode = event.target.className.includes('edit');
    this.router.navigate(['/institution', institution.id]);
  }

  ngOnDestroy() {
    if (this.subscribers.length > 0) {
      this.subscribers.map(subscriber => subscriber.unsubscribe());
    }
  }
}
