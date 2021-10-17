import { Injectable } from '@angular/core';
import { SdkService } from './sdk.service';
import { Observable } from 'rxjs';
// import { SocketEvents } from '../../../../sdk/interfaces';

@Injectable()
export class SocketService {
  constructor(private sdk: SdkService) {}

  public test(event: any): Observable<any> {
    return new Observable<Event>(observer => {
      this.sdk.client.socket.on(event, result => observer.next(result));
    });
  }
}
