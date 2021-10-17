import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { MatPaginator, MatSort, MatDialog } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { merge } from 'rxjs';

import { SdkService } from 'src/app/services/sdk.service';
import { LayoutService } from 'src/app/services/layout.service';
import { EventBrokerService } from 'src/app/services/eventBroker.service';
import { SubclassesDataSource } from './subclass.datasource';
import { CreateSubclassModalComponent } from 'src/app/components/modals/create-subclass-modal/create-subclass-modal.component';
import { IEventListener } from 'src/app/models/interfaces.model';
import { IClass, IGroup, ISubGroup } from '../../../../../../../sdk/interfaces';
import { SLCService } from 'src/app/components/slc-selector/slc-selector.service';

@Component({
  selector: 'app-learners-subclasses',
  templateUrl: './learners-subclasses.component.html'
})
export class LearnersSubclassesComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator, { static: true })
  private paginator: MatPaginator;
  @ViewChild(MatSort, { static: true })
  private sort: MatSort;

  public searchString = '';

  public displayedColumns: string[] = [
    'course',
    'subclasses',
    'learners',
    'action'
  ];

  public dataSource: SubclassesDataSource;
  private _reloadListener: IEventListener;

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
    private _eventBroker: EventBrokerService,
  ) {
    this._reloadListener = _eventBroker.listen<boolean>(
      'reloadData',
      (value: any) => {
        if (value.reload) {
          this.loadSubclassesDatasource();
        }
      }
    );
  }

  ngOnInit() {
    // init table
    this.dataSource = new SubclassesDataSource(this.sdk);
    this.loadSubclassesDatasource();
    this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0));
    merge(this.sort.sortChange, this.paginator.page)
      .pipe(tap(() => this.loadSubclassesDatasource()))
      .subscribe();
  }

  ngOnDestroy() {
    this._reloadListener.ignore();
  }

  // filter by search string (with api)
  public applyFilter(searchString?: string): void {
    if (searchString !== undefined && searchString !== null) {
      this.searchString = searchString;
    }
    this.paginator.pageIndex = 0;
    this.loadSubclassesDatasource();
  }

  // load data from backend
  private loadSubclassesDatasource(
    classId = +localStorage.getItem('classSelected')
  ): void {
    this.dataSource.loadSubclasses(
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

  // navigate to edit groups page
  public openEditPage(element: IGroup): void {
    this.router.navigate([element.id], { relativeTo: this.route });
  }

  // working with modals
  public createSubclassModal(): void {
    this.layout.blurWrapContainer();
    const createModal = this.dialog.open(CreateSubclassModalComponent, {
      panelClass: ['modal', 'noheight'],
      restoreFocus: false,
      autoFocus: false,
      data: { saveButtonText: 'Create subclass' }
    });
    createModal.beforeClosed().subscribe({
      next: result => {
        this.layout.unblurWrapContainer();
        if (result) {
          this.paginator.firstPage();
          this.loadSubclassesDatasource();
        }
      }
    });
  }

  public getSubgroupsString(subgroups: ISubGroup[]): string {
    return subgroups.map(subgroup => subgroup.name).join(' + ');
  }
}
