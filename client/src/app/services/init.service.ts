import { Injectable } from '@angular/core';
import { Subject, ReplaySubject } from 'rxjs';

import { SdkService, loggedIn } from './sdk.service';
import { UserData } from '../models/interfaces.model';

import { CookieService } from 'ngx-cookie-service';

@Injectable()
export class AppInitService {
  public userData: Subject<UserData> = new ReplaySubject<UserData>();
  public haserror = false;

  get isLoggedIn() {
    return loggedIn.asObservable();
  }

  constructor(private sdk: SdkService, private cookieService: CookieService) { }

  public initializeApp(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.sdk.client
        .getMe()
        .then((userData) => {
          const cookSchoolId = +this.cookieService.get('schoolId')
          if (!userData)
            throw new Error("unauthorized_client");
          if (cookSchoolId) {
            const schoolIdIsValid = userData.access.allSchool.includes(cookSchoolId);
            if (!schoolIdIsValid) {
              this.cookieService.delete('cityId', '/')
              this.cookieService.delete('schoolId', '/')
              localStorage.removeItem('SchoolID')
              localStorage.removeItem('userData')
            }
          }
          loggedIn.next(true);
          this.userData.next(userData);
          return resolve();
        })
        .catch((error) => {
          console.log('init error!', error);
          loggedIn.next(false);
          resolve();
        });
    });
  }
}
