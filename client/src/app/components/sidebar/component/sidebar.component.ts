import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import {
  trigger,
  transition,
  style,
  animate,
  state
} from '@angular/animations';
import { AuthService } from 'src/app/auth/auth.service';
import { environment } from 'src/environments/environment';
import { SdkService } from 'src/app/services/sdk.service';
import { IPageQuery, IPageResponse } from '../../../../../../sdk/sdk';
import { CookieService } from 'ngx-cookie-service';
import { ISchool } from '../../../../../../sdk/interfaces';

import { BehaviorSubject, Observable, of, from } from 'rxjs';
import { InstitutionsService } from 'src/app/pages/institutions/services/institutions.service';
import { rest } from 'lodash';
import { TimetableService } from 'src/app/pages/timetable/services/timetable.service';
import { SLCService } from '../../slc-selector/slc-selector.service';
import { SidebarService } from '../sidebar.service';
@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  animations: [
    trigger('dropup', [
      state(
        'void',
        style({
          visibility: 'hidden',
          opacity: 0,
          transform: 'translateY(-10%)'
        })
      ),
      state(
        'showing',
        style({
          visibility: 'visible',
          opacity: 1,
          transform: 'translateY(-80%)'
        })
      ),
      transition('void => *', animate('200ms cubic-bezier(0, 0, 0.2, 1)')),
      transition(
        '* => void',
        animate('100ms 25ms linear', style({ opacity: 0 }))
      )
    ]),
    trigger('dropupOverlay', [
      state('void', style({ background: 'rgba(0, 0, 0, 0)' })),
      state('*', style({ background: 'rgba(0, 0, 0, 0.3)' })),
      transition('void => *', animate('300ms ease')),
      transition('* => void', animate('100ms 25ms linear'))
    ])
  ]
})
export class SidebarComponent implements OnInit {
  public userData: any;
  public modes: Array<any> = new Array();
  public selectedMode: string;
  public showDropup = false;
  public showPrivacy = false;
  public logoutFrameSrc: SafeUrl;
  public schoolId: number;
  public activeAcademicYear: number;
  public warning = { wInstitution: null, wLearner: null, wTimetable: null, wFacilities: null, wCourse: null, timetableCount: 0, classCount: 0 }

  get isDeveloper(): boolean {
    return !environment.production && !environment.test;
  }

  constructor(
    public router: Router,
    public authService: AuthService,
    private sanitizer: DomSanitizer,
    private sdk: SdkService,
    private cookieService: CookieService,
    private service: SidebarService
  ) { }

  ngOnInit() {
    this.userData = this.authService.localData;
    this.modeSetData(this.userData.interfaces);
    this.warningCondition();
  }

  public warningCondition() {
    if (+this.cookieService.get('cityId') > 0) {
      this.sdk.client.getSchools({ limit: -1, cityId: +this.cookieService.get('cityId') })
        .then((res) => {
          // this.cookieService.set('schoolId', res.list[0].id.toString(),undefined,'/');
          if(this.cookieService.get('schoolId')){
            this.warning = this.service.loadCurrentInstituteInfo(res.list.filter(school=>school.id == parseInt(this.cookieService.get('schoolId'))));
          }
          else{
            this.warning = this.service.loadCurrentInstituteInfo(res.list.filter(school=> school.id == res.list[0].id));
          }
        });
    }
  }

  ngOnChanges() {
    this.warningCondition();
  }

  private modeSetData(interfaces: any): void {
    const translations = {
      ADMIN: 'Admin panel',
      CURRICULUM: 'Curriculum builder',
      DIARY: 'Gradebook',
      JOURNEYS: 'Journeys',
      CONNECT: 'Connect',
    };

    Object.keys(interfaces)
      .map(value => ({
        value,
        viewValue: translations[value] || value,
        link: interfaces[value].link
      }))
      .forEach(item => {
        this.modes.push(item);
        if (item.value === 'ADMIN') {
          this.selectedMode = item.value;
        }
      });
  }

  public modeSelectionChange(event): void {
    Object.keys(this.userData.interfaces).forEach((mode: string) => {
      if (event.value === mode) {
        window.location.href = this.userData.interfaces[mode].link;
      }
    })
    this.warningCondition();
    ;
  }

  public goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  public openLogout(): void {
    this.showDropup = this.showDropup === false ? true : false;
  }

  public logout(): void {
    if (environment.production || environment.test) {
      this.logoutFrameSrc = this.sanitizer.bypassSecurityTrustResourceUrl(
        `${environment.iframeURL}account/signout`
      );
      setTimeout(() => this.authService.logout(), 200);
    } else {
      this.authService.logout();
    }
    this.authService.logout();
  }

  public showProfile(): void {
    this.router.navigate(['profile']);
  }

  public privacyPolicyControl(control: boolean): void {
    this.showPrivacy = control;
  }

  onNavigateFAQ(){
    window.open("https://beed.ladesk.com/248184-LMS---Admin-Panel", "_blank");
  }
}
