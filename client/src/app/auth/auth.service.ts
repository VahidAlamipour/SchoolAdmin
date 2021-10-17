import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';

import { AppInitService } from '../services/init.service';
import { UserData } from '../models/interfaces.model';
import { environment } from 'src/environments/environment';

@Injectable()
export class AuthService {
  private localStorageName = 'userData';
  public localData: UserData & {
    access: any;
    config: {
      [key: string]: string;
    };
  };

  private loggedIn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private loading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public institutionSelected: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  get isLoading(): Observable<boolean> {
    return this.loading.asObservable();
  }
  get isLoggedIn(): Observable<boolean> {
    return this.loggedIn.asObservable();
  }
  get isInstitutionSelected(): Observable<boolean> {
    return this.institutionSelected.asObservable();
  }
  get isAccountAdmin(): boolean {
    return Boolean(this.localData.access.branchesId.length);
  }

  constructor(private cookieService: CookieService, private appLoad: AppInitService, private location: Location) {
    this.appLoad.haserror ? this.goToProjectRoot() : (this.checkState(), this.checkSelect());
  }

  public checkState(): void {
    this.appLoad.isLoggedIn.subscribe((isLoggedIn) => {
      if (isLoggedIn) {
        this.grantAccess();
      } else {
        this.rejectAccess();
      }
    });
  }

  public checkSelect(): void {
    this.cookieService.get('schoolId') ? this.institutionSelected.next(true) : this.institutionSelected.next(false);
  }

  private grantAccess(): void {
    this.loggedIn.next(true);
    this.appLoad.userData.subscribe((userData: UserData) => this.setDataToLocal(userData));
  }

  private rejectAccess(): void {
    localStorage.clear();
    this.cookieService.deleteAll();
    this.loggedIn.next(false);
  }

  private setDataToLocal(data: any): void {
    this.localData = data;
    localStorage.setItem(this.localStorageName, JSON.stringify(data));
  }

  private goToProjectRoot() {
    this.cookieService.deleteAll();
    if (environment.test || environment.production) {
      window.location.replace(window.location.origin);
    }
  }

  public goToExternalLogin(): void {
    window.location.href = window.location.origin + this.location.prepareExternalUrl('/api/login');
  }

  public logout(): void {
    localStorage.clear();
    this.cookieService.deleteAll();
    this.loggedIn.next(false);
    setTimeout(() => {
      window.location.href = window.location.origin + this.location.prepareExternalUrl('/api/logout');
    }, 500);
  }
}
