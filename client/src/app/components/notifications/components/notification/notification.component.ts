import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  OnInit
} from '@angular/core';

import { NotificationsService } from '../../services/notifications.service';
import { INotification } from '../../models/notifications.model';

@Component({
  selector: 'notification',
  templateUrl: './notification.component.html'
})
export class NotificationComponent implements OnInit {
  @Input()
  public notificationData: INotification;
  @Input()
  public index: number;
  @Output()
  public clearEvent: EventEmitter<any> = new EventEmitter();

  private timer: any;
  private notificationTimeout = 4500;

  constructor(public service: NotificationsService) {}

  @HostListener('mouseover')
  private mouseOver(): void {
    clearTimeout(this.timer);
  }
  @HostListener('mouseleave')
  private setTimer(): void {
    if (!this.notificationData.permanent) {
      this.timer = setTimeout(
        () => this.clearEvent.emit(),
        this.notificationTimeout
      );
    }
  }

  ngOnInit() {
    this.setTimer();
  }

  public getIcon(type: string): string {
    switch (type) {
      case 'success':
        return 'done-icon';
      case 'error':
        return 'error-icon';
      default:
        return 'attention-icon';
    }
  }
}
