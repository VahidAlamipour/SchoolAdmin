import { Component } from '@angular/core';
import {
  trigger,
  transition,
  style,
  animate,
  state,
  sequence
} from '@angular/animations';

import { NotificationsService } from '../../services/notifications.service';

@Component({
  selector: 'notifications',
  templateUrl: './notifications-group.component.html',
  animations: [
    trigger('notificationItem', [
      state(
        'void',
        style({
          visibility: 'hidden',
          opacity: 0,
          height: 0,
          transform: 'translateY(20%)'
        })
      ),
      transition(
        'void => *',
        sequence([animate('150ms cubic-bezier(0, 0, 0.2, 1)')])
      ),
      transition('* => void', [
        style({
          height: '*',
          opacity: 1
        }),
        sequence([
          animate(
            '250ms cubic-bezier(0, 0, 0.2, 1)',
            style({
              opacity: 0,
              transform: 'translateX(100%)'
            })
          ),
          animate(
            '200ms cubic-bezier(0, 0, 0.2, 1)',
            style({
              height: 0
            })
          )
        ])
      ])
    ])
  ]
})
export class NotificationsGroupComponent {
  constructor(public service: NotificationsService) {}

  public clearNotification(index: number): void {
    this.service.clearNotification(index);
  }
}
