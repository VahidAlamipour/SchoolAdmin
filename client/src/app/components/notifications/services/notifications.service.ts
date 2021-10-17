import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { INotification } from '../models/notifications.model';

@Injectable()
export class NotificationsService {
  private notificationsStream: BehaviorSubject<
    INotification[]
  > = new BehaviorSubject([]);
  public notificationsStream$ = this.notificationsStream.asObservable();

  constructor() { }

  public notifyUser(notification: INotification): Promise<number> {
    return new Promise(resolve => {
      const notif: INotification = {
        id: Date.now(),
        ...notification,
        type: notification.type || 'default',
        permanent: notification.permanent || notification.type === 'error'
      };
      this.notificationsStream.next(
        this.notificationsStream.value.concat(notif)
      );
      return resolve(notif.id);
    });
  }

  public clearNotification(index: number): Promise<boolean> {
    return new Promise(
      resolve => (
        this.notificationsStream.value.splice(index, 1), resolve(true)
      )
    );
  }
  public clearAllNotification(): Promise<boolean> {
    return new Promise(
      resolve => (
        this.notificationsStream.value.splice(0, this.notificationsStream.value.length), resolve(true)
      )
    );
  }
  public clearById(id: number): Promise<boolean> {
    return new Promise(resolve =>
      this.clearNotification(
        this.notificationsStream.value.findIndex(i => i.id === id)
      ).then(() => resolve(true))
    );
  }
}
