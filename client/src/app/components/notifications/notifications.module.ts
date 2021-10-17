import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NotificationsService } from './services/notifications.service';
import { NotificationsGroupComponent } from './components/notifications-group/notifications-group.component';
import { NotificationComponent } from './components/notification/notification.component';

@NgModule({
  imports: [CommonModule],
  declarations: [NotificationsGroupComponent, NotificationComponent],
  providers: [NotificationsService],
  exports: [NotificationsGroupComponent]
})
export class NotificationsModule {}
