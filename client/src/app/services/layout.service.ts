import { Injectable } from '@angular/core';
import { Subject, Observable, BehaviorSubject } from 'rxjs';

@Injectable()
export class LayoutService {
  public selectedPagination: number; 
  private sub: Subject<string> = new Subject();
  public noscroll: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  public wrapObservable: Observable<string> = this.sub.asObservable();
  public contentScrollTopNumber: number;

  constructor() {}

  public blurWrapContainer(): void {
    this.sub.next('wrap blurred');
  }

  public unblurWrapContainer(): void {
    this.sub.next('wrap');
  }

  public contentScroll(event: number): void {
    this.contentScrollTopNumber = event;
  }

  public contentCanScroll(event: boolean): void {
    this.noscroll.next(!event);
  }
}
