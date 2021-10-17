import { Location } from '@angular/common';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { NotificationsService } from '../components/notifications/services/notifications.service';
import { SDK } from '../../../../sdk/sdk';
import { environment } from 'src/environments/environment';
import { CookieService } from 'ngx-cookie-service';

export const loggedIn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

class FrontSDK extends SDK {
  private offlineNotificationId: number;

  constructor(
    public options: any,
    public socketOptions: any,
    private location: Location,
    private cookieService: CookieService,
    private notificationsService: NotificationsService
  ) {
    super(options, socketOptions);
    window.addEventListener('offline', () =>
      notificationsService
        .notifyUser({
          message: `You're offline. Reconnecting...`,
          type: 'error',
          permanent: true
        })
        .then((id) => (this.offlineNotificationId = id))
    );
    window.addEventListener('online', () =>
      notificationsService
        .notifyUser({
          message: `Connected.\n Now you're online.`,
          type: 'success'
        })
        .then(() => notificationsService.clearById(this.offlineNotificationId))
    );
  }

  public processError(res: any) {
    if (res.status === 400 || res.status === 403) {
      this.cookieService.deleteAll();
      window.location.href = window.location.origin;
      return;
    }

    if (res.status === 401) {
      window.location.href = window.location.origin + this.location.prepareExternalUrl('/api/login');
      return;
    }
    //if (res.status === 412) {
      res.statusText = '';
    //}
    this.notificationsService.notifyUser({
      message: `${res.statusText ? res.statusText + '. ' : ''}${res.data}`,
      type: 'error'
    });
    super.processError(res);
  }
}

@Injectable({
  providedIn: 'root'
})
export class SdkService {
  public client: FrontSDK;
  constructor(
    private location: Location,
    private notificationsService: NotificationsService,
    private cookieService: CookieService
  ) {
    this.client = new FrontSDK(
      {
        baseURL: this.location.prepareExternalUrl('/api')
      },
      {
        path: this.location.prepareExternalUrl('/socket.io')
      },
      this.location,
      this.cookieService,
      this.notificationsService
    );
  }
}
