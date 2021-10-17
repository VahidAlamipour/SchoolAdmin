import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { from } from 'rxjs';
import { NotificationsService } from 'src/app/components/notifications/services/notifications.service';
import {
  trigger,
  state,
  style,
  transition,
  animate
} from '@angular/animations';

import { SdkService } from 'src/app/services/sdk.service';
import { SLCService } from '../../slc-selector/slc-selector.service';
import { AuthService } from 'src/app/auth/auth.service';
import { InstitutionSelectorData } from 'src/app/models/interfaces.model';
import { ICity, ISchool } from '../../../../../../sdk/interfaces';
import { templateJitUrl } from '@angular/compiler';

@Component({
  selector: 'app-institution-selector',
  templateUrl: './institution-selector.component.html',
  animations: [
    trigger('selectorDrop', [
      state(
        'void',
        style({
          transform: 'scaleY(0.8) translateY(-20%)',
          minWidth: '100%',
          opacity: 0
        })
      ),
      state(
        'showing',
        style({
          opacity: 1,
          minWidth: 'calc(100% + 32px)',
          transform: 'scaleY(1) translateY(-20%)'
        })
      ),
      state(
        'showing-multiple',
        style({
          opacity: 1,
          minWidth: 'calc(100% + 64px)',
          transform: 'scaleY(1) translateY(-20%)'
        })
      ),
      transition('void => *', animate('120ms cubic-bezier(0, 0, 0.2, 1)')),
      transition(
        '* => void',
        animate('100ms 25ms linear', style({ opacity: 0 }))
      )
    ])
  ]
})
export class InstitutionSelectorComponent implements OnInit {
  public searchValue: string;
  private allCities: ICity[];
  private allInstitutionsInTheCity: ISchool[];
  public selectedCity: ICity;
  public selectedInstitution: ISchool;

  public selectorData: InstitutionSelectorData = {
    name: '',
    opened: false,
    itemsArray: [],
    filteredArray: []
  };

  constructor(
    private sdk: SdkService,
    private cookieService: CookieService,
    private router: Router,
    private authService: AuthService,
    private slcService: SLCService,
    private notificationsService: NotificationsService
  ) { }

  ngOnInit() {
    this.sdk.client
      .getCities({ limit: -1 })
      .then(res => (this.allCities = res.list))
      .finally(() => this.selectCity());

    this.refreshData(true);
  }

  private selectCity(): void {
    const cityCookieExists: boolean = this.cookieService.check('cityId');
    if (cityCookieExists) {
      const cityCookieId: number = +this.cookieService.get('cityId');
      this.slcService.selectedSchool.city = this.selectedCity = this.allCities.find(
        city => city.id === cityCookieId
      );
    }
    if (!cityCookieExists || !this.selectedCity) {
      this.slcService.selectedSchool.city = this.selectedCity = this.allCities[0]; // should be 0
      this.cookieService.set('cityId', this.selectedCity.id.toString(), undefined, '/');
    }
    if (this.selectedCity) {
      this.getInstitutionsInCity(this.selectedCity.id);
    }
  }

  private getInstitutionsInCity(cityId: number): void {
    const institutionsSubscription = from(
      this.sdk.client.getSchools({ limit: -1, cityId: cityId })
    ).subscribe(
      res => {
        this.allInstitutionsInTheCity = res.list;
        if (!this.cookieService.check('schoolId')) {
          this.cookieService.set(
            'schoolId',
            res.list[0].id.toString(), undefined, '/'
          );
        }
      },
      error => console.error('got an error: ' + error),
      () => {
        this.checkCookies();
        institutionsSubscription.unsubscribe();
      }
    );
  }


  private checkCookies(): void {
    const cookieExists: boolean = this.cookieService.check('schoolId');
    if (cookieExists) {
      const schoolCookieId: number = +this.cookieService.get('schoolId');
      localStorage.setItem("SchoolID", String(schoolCookieId))
      console.log('cookieExists:', cookieExists, 'schoolId:', schoolCookieId);
      this.slcService.selectedSchool.school = this.selectedInstitution = this.allInstitutionsInTheCity.find(
        institution => institution.id === schoolCookieId
      );
    }
    if (!cookieExists || !this.selectedInstitution) {
      console.log('no schoolId in cookie');
      this.slcService.selectedSchool.school = this.selectedInstitution = this.allInstitutionsInTheCity[0];
      this.cookieService.set(
        'schoolId',
        this.selectedInstitution.id.toString(), undefined, '/'
      );
    }
    if (this.selectedInstitution) {
      this.authService.institutionSelected.next(true);
    }
  }

  public searchItems(): void {
    let filteredArray: Array<ICity | ISchool> = new Array();
    filteredArray = this.selectorData.itemsArray.filter(
      (item: ICity | ISchool) =>
        item.name.toLowerCase().includes(this.searchValue.toLowerCase())
    );
    this.selectorData.filteredArray = filteredArray;
  }

  public onSelectedItemClick(name: string): void {

    this.selectorData.name = name;
    this.selectorData.opened = true;
    switch (name) {
      case 'city':
        this.selectorData.itemsArray = this.selectorData.filteredArray = this.allCities;
        break;
      case 'institution':
        this.getInstitutionsInCity(this.selectedCity.id);
        this.selectorData.itemsArray = this.selectorData.filteredArray = this.allInstitutionsInTheCity;
        break;
      default:
        break;
    }
  }

  public async onListItemClick(item: ICity | ISchool, name: string) {
    if (this.router.url !== '/select') {
      if (name === 'city') {
        this.cookieService.set('cityId', item.id.toString(), undefined, '/');
        this.cookieService.delete('schoolId');
        const newSchools = await this.sdk.client.getSchools({ limit: -1, cityId: item.id });
        this.cookieService.set('schoolId', newSchools.list[0].id.toString(), undefined, '/');

      } else {
        this.cookieService.set('schoolId', item.id.toString(), undefined, '/');
      }
      localStorage.clear();
      setTimeout(() => {
        let wholeURl = this.router.url.split('/');
        const latestCell = wholeURl[wholeURl.length - 1];
        if (this.router.url.includes('/subclasses/')) {
          location.replace(`./learners`);
        } else if(latestCell && latestCell.toLowerCase() === 'roles') {
          location.replace(`./${wholeURl[wholeURl.length - 3]}`);
        } else {
          location.reload();
        }
      }, 200)

      return false;
    }

    //#region is select page
    let isSubclass = false;
    if (this.router.url.includes('/subclasses/')) {
      isSubclass = true;
    }
    this.notificationsService.clearAllNotification();
    switch (name) {
      case 'city':
        if (this.selectedCity !== item) {
          this.slcService.selectedSchool.city = this.selectedCity = item;
          this.cookieService.set('cityId', item.id.toString(), undefined, '/');
          this.cookieService.delete('schoolId');
          this.getInstitutionsInCity(item.id);
          this.refreshData(false, isSubclass, true);
        }
        break;
      case 'institution':
        this.slcService.selectedSchool.school = this.selectedInstitution = item;
        this.cookieService.set('schoolId', item.id.toString(), undefined, '/');
        this.refreshData(false, isSubclass);
        break;
      default:
        break;
    }
    this.closeSelector();
    //#endregion

  }


  public closeSelector(): void {
    this.selectorData.opened = false;
    this.searchValue = null;
  }

  private async refreshData(isInit?: boolean, isFromSubclass?: boolean, changecity?: boolean): Promise<void> {
    let userData = localStorage.getItem('userData');

    const schoolId = this.cookieService.get('schoolId');
    if (userData && schoolId) {
      const school = await this.sdk.client.getSchool(parseInt(schoolId))
      let user = JSON.parse(userData);
      if (user) {
        user.school = school;
        userData = JSON.stringify(user);
      }
    }

    localStorage.clear();
    localStorage.setItem('userData', userData);
    if (this.cookieService.get('schoolId')) {
      this.authService.institutionSelected.next(true);
    }
    if (isFromSubclass) {
      this.router.navigate(['/learners']);
      return;
    }
    if (this.router.url === '/select' || isInit) {
      return;
    } else {
      this.router.routeReuseStrategy.shouldReuseRoute = () => false;
      const currentUrl = this.router.url;
      this.router.navigateByUrl(currentUrl).then(() => {
        this.router.navigated = false;
        this.router.navigate([this.router.url]);
      });
    }
  }
}