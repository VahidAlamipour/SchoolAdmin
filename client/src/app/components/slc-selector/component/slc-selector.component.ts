import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material';

import { SLCModalComponent } from '../../modals/slc-modal/slc-modal.component';
import { LayoutService } from 'src/app/services/layout.service';
import { SdkService } from 'src/app/services/sdk.service';
import { SLCService } from '../slc-selector.service';
import { ILevel, IAcademicYear } from '../../../../../../sdk/interfaces';
import { CookieService } from 'ngx-cookie-service';
import { DropdownComponent } from '../../dropdown/component/dropdown.component';
import { SidebarService } from '../../sidebar/sidebar.service';

@Component({
  selector: 'slc-selector',
  templateUrl: './slc-selector.component.html'
})
export class SLCSelectorComponent implements OnDestroy {
  @Output()
  public classChanged: EventEmitter<any> = new EventEmitter<any>();
  public years: IAcademicYear[];
  public searchString: string;
  public ayInfo = null;
  @ViewChild('segmentDropDown', { static: true }) segmentDropDown: DropdownComponent;
  constructor(
    private dialog: MatDialog,
    private layout: LayoutService,
    private sdk: SdkService,
    public service: SLCService,
    private cookieService: CookieService,
    private route: ActivatedRoute,
    private router: Router,
    public sidebarService: SidebarService
  ) { }

  ngOnInit() {
    this.searchString = this.route.snapshot.queryParamMap.get('search') || '';
    const currentYear = new Date().getFullYear();
    if (!localStorage.getItem('yearSelected')) {
      this.service.editPageRedir = false;
    }
    if (!this.service.editPageRedir) {
      if (+this.cookieService.get('schoolId') === 0 && +this.cookieService.get('cityId') > 0) {
        this.sdk.client.getSchools({ limit: -1, cityId: +this.cookieService.get('cityId') })
          .then((res) => {
            this.cookieService.set('schoolId', res.list[0].id.toString(), undefined, '/');
            this.service.loadSchoolData()
              .then(
                (data) => (
                  this.service.yearsSubject.next(data.allYears),
                  (data && data.school && data.school.activeAcademicYear ? this.service.activeYearSubject.next(data.school.activeAcademicYear) : ""),
                  (
                    data.school.activeAcademicYear ?
                      localStorage.setItem("yearSelected", data.school.activeAcademicYear.toString()) :
                      data.allYears && data.allYears.find(y => y.start === currentYear) ? localStorage.setItem("yearSelected", data.allYears.find(y => y.start === currentYear).id) : ""
                  ))
              );
          }
          );
      }
      else {
        this.service.loadSchoolData()
          .then(
            (data) => {
              this.service.yearsSubject.next(data.allYears);
              let localSelectedYear = +localStorage.getItem('yearSelected');
              if (!localSelectedYear) {
                if (data && data.school) {
                  if (data.school.activeAcademicYear) {
                    this.service.activeYearSubject.next(localSelectedYear as any);
                    localStorage.setItem("yearSelected", data.school.activeAcademicYear.toString())
                  } else {
                    data.allYears && data.allYears.find(y => y.start === currentYear) ? localStorage.setItem("yearSelected", data.allYears.find(y => y.start === currentYear).id) : "";
                  }
                }
              }
              // (data && data.school && data.school.activeAcademicYear) ? this.service.activeYearSubject.next(+localStorage.getItem('yearSelected') as any) : "";
              // if (!this.searchString) {
              //   data.school.activeAcademicYear ?
              //     localStorage.setItem("yearSelected", data.school.activeAcademicYear.toString()) :
              //     data.allYears && data.allYears.find(y => y.start === currentYear) ? localStorage.setItem("yearSelected", data.allYears.find(y => y.start === currentYear).id) : "";
              // }
            }
          );
      }
    }
    this.service.editPageRedir = false;
    this.service.getStructure();

  }

  // working with structure
  public segmentInit(event: any): void {
    this.service.getLevels();
  }
  public yearInit(event: any): void {
    // this.service.getYears();
    this.service.getSegments();

  }
  public yearReselected(event?: any): void {
    localStorage.removeItem('levelSelected');
    localStorage.removeItem('classSelected');

    this.service.getSegments();
    this.service.getLevels();
    this.classChange();
  }

  public segmentReselected(event?: any): void {
    localStorage.removeItem('levelSelected');
    localStorage.removeItem('classSelected');
    this.service.getLevels();
    this.classChange();
  }

  public levelInit(event: any): void {
    this.service.getClasses();
  }

  public levelReselected(): void {
    localStorage.removeItem('classSelected');
    this.service.getClasses();
    this.classChange();
  }

  public classChange(event?: any): void {
    this.classChanged.emit(event);
  }

  // working with modals
  public openCreateDialog(target: number): void {
    switch (target) {
      case 1:
        const segmentModalData = {
          panelClass: ['modal', 'segments'],
          data: {
            name: 'segment',
            mode: 'create',
            title: 'Segment',
            inputLabel: 'Segment name',
            inputPlaceholder: 'Enter segment name',
            saveButtonText: 'Create segment'
          }
        };
        this.createModal(segmentModalData);
        break;
      case 2:
        const levelModalData = {
          panelClass: ['modal', 'levels'],
          data: {
            name: 'level',
            mode: 'create',
            title: 'Level',
            inputLabel: 'Level',
            inputPlaceholder: 'Enter segment name',
            saveButtonText: 'Create level',
            existingLevels: this.service.levelsSubject.value.map(
              level => +level.name
            )
          }
        };
        this.createModal(levelModalData);
        break;
      case 3:
        this.sdk.client
          .getLevel(+localStorage.getItem('levelSelected'))
          .then((res: ILevel) =>
            this.createModal({
              panelClass: ['modal', 'classes'],
              data: {
                name: 'class',
                mode: 'create',
                level: res.name,
                title: 'Create Class',
                inputLabel: 'Class name',
                inputPlaceholder: 'Enter class name',
                saveButtonText: 'Create class'
              }
            })
          );
        break;
      default:
        break;
    }
  }

  public openEditDialog(mode: string, data: any): void {
    switch (mode) {
      case 'segment':
        const segmentModalData = {
          panelClass: ['modal', 'segments'],
          data: {
            name: 'segment',
            mode: 'edit',
            existing: data,
            title: 'Edit segment',
            inputLabel: 'Segment name',
            inputPlaceholder: 'Enter segment name',
            saveButtonText: 'Save'
          }
        };
        this.createModal(segmentModalData);
        break;
      case 'level':
        this.createModal({
          panelClass: ['modal', 'levels'],
          data: {
            name: 'level',
            mode: 'edit',
            title: 'Edit level',
            inputLabel: 'Level',
            inputPlaceholder: 'Enter level name',
            saveButtonText: 'Save',
            existing: data,
            existingLevels: this.service.levelsSubject.value
              .map(level => +level.name)
              .filter(level => level !== +data.name)
          }
        });
        break;
      case 'class':
        this.sdk.client
          .getLevel(+localStorage.getItem('levelSelected'))
          .then((res: ILevel) =>
            this.createModal({
              panelClass: ['modal', 'classes'],
              data: {
                name: 'class',
                mode: 'edit',
                existing: data,
                level: res.name,
                title: 'Edit class',
                inputLabel: 'Class name',
                inputPlaceholder: 'Enter class name',
                saveButtonText: 'Save'
              }
            })
          );
        break;
      default:
        break;
    }
  }

  private createModal(data: any): void {
    if (this.cookieService.get('cityId')) {
      this.sdk.client.getSchools({ limit: -1, cityId: Number(this.cookieService.get('cityId')) })
      .then(res=> { 
        let schoolid = Number(this.cookieService.get('schoolId'));
        this.ayInfo = res.list.filter(school=>school.id == schoolid);
      });
    } 
    this.layout.blurWrapContainer();
    const dialogRef = this.dialog.open(SLCModalComponent, {
      id: 'create',
      panelClass: ['modal'],
      restoreFocus: false,
      autoFocus: false,
      ...data
    });
    dialogRef.beforeClosed().subscribe({
      next: closeData => {
        this.layout.unblurWrapContainer();
        if (closeData && closeData.result) {
          if (closeData.result === 'delete') {
            switch (closeData.name) {
              case 'segment':
                localStorage.removeItem('segmentSelected');
                this.service.getSegments();
                this.segmentReselected();
                break;
              case 'level':
                this.service.getSegments();
                this.service.getLevels();
                //this.segmentReselected();
                //this.service.getStructure();
                break;
              case 'class':
                setTimeout(() => {
                  this.service.getSegments();
                  this.levelReselected();
                  //this.service.getStructure();
                }, 300);
                this.updateSidebar(this.ayInfo);
                break;

              default:
                break;
            }
          }
          if (closeData.result === 'edit') {
            switch (closeData.name) {
              case 'segment':
                this.service.getSegments();
                break;
              case 'level':
                this.service.getSegments();
                this.service.getLevels();
                break;
              case 'class':
                this.service.getClasses();
                break;

              default:
                break;
            }
          }
          if (closeData.result === 'create') {
            switch (closeData.name) {
              case 'segment':
                this.service.getSegments();
                break;
              case 'level':
                this.service.getSegments();
                this.service.getLevels();
                //this.service.getStructure();
                break;
              case 'class':
                this.service.getSegments();
                this.service.getClasses();
                //this.service.getStructure();
                this.updateSidebar(this.ayInfo);
                break;

              default:
                break;
            }
          }
        }
      }
    });
  }

  public updateSidebar(ayInfo : any ) {
    if(ayInfo &&ayInfo[0].activeAcademicYear){
    this.sidebarService.loadClasses(ayInfo[0].activeAcademicYear)
    this.sidebarService.loadLessons({
      academicYearId: ayInfo[0].activeAcademicYear,
      classId: null,
      startDate: null,
      endDate: null,
      shiftId: null,
    })
  }
  }

  public goToInstitution(): void {
    this.router.navigate([`/institution/${+this.cookieService.get('schoolId')}`]);
  }

  ngOnDestroy() {
    this.service.levelsSubject.next([]);
    this.service.classesSubject.next([]);
  }
}
