import { Component, OnInit } from '@angular/core';
import { NotificationsService } from 'src/app/components/notifications/services/notifications.service';
import { SdkService } from 'src/app/services/sdk.service';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html'
})
export class TestComponent implements OnInit {
  constructor(
    private sdk: SdkService,
    private notificationsService: NotificationsService
  ) {}

  ngOnInit() {}

  public testClick(mode?): void {
    this.sdk.client.import('educator', null);

    mode
      ? this.notificationsService.notifyUser({
          message: 'Everything is alright, default message is here.'
        })
      : this.notificationsService.notifyUser({
          message: 'Everything is alright, this is permanent message.',
          permanent: true
        });
  }

  public errorClick(mode?): void {
    mode
      ? this.notificationsService.notifyUser({
          message: `Lorem ipsum dolor sit, amet consectetur adipisicing elit.
         Odio sequi nesciunt perspiciatis id perferendis fugiat ipsam sunt consequuntur
        et doloribus autem similique praesentium quasi quia magni, unde reiciendis atque maiores.`,
          type: 'error'
        })
      : this.notificationsService.notifyUser({
          message: 'Everything is not alright, learner error',
          type: 'error'
        });
  }

  public successClick(): void {
    this.notificationsService.notifyUser({
      message: 'Notification was successfully created',
      type: 'success'
    });
  }

  public twoInARow(): void {
    this.testClick();
    this.successClick();
  }
}
