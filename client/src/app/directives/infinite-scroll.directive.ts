import { Directive, AfterViewInit, ElementRef, Input } from '@angular/core';
import { map, pairwise, filter, exhaustMap, startWith } from 'rxjs/operators';
import { fromEvent, Observable } from 'rxjs';

interface ScrollPosition {
  sH: number;
  sT: number;
  cH: number;
}

const DEFAULT_SCROLL_POSITION: ScrollPosition = {
  sH: 0,
  sT: 0,
  cH: 0
};

@Directive({
  selector: '[infiniteScroll]'
})
export class InfiniteScrollDirective implements AfterViewInit {
  @Input()
  private scrollCallback: any;
  @Input()
  private immediateCallback = true;
  @Input()
  private scrollPercent = 70;
  private scrollEvent$: Observable<{}>;
  private userScrolledDown$: Observable<[ScrollPosition, ScrollPosition]>;
  private requestOnScroll$: any;

  constructor(private elm: ElementRef) {}

  ngAfterViewInit() {
    this.registerScrollEvent();
    this.streamScrollEvents();
    this.requestCallbackOnScroll();
  }

  private registerScrollEvent(): void {
    this.scrollEvent$ = fromEvent(this.elm.nativeElement, 'scroll');
  }

  private streamScrollEvents(): void {
    this.userScrolledDown$ = this.scrollEvent$.pipe(
      map(
        (e: any): ScrollPosition => ({
          sH: e.target.scrollHeight,
          sT: e.target.scrollTop,
          cH: e.target.clientHeight
        })
      ),
      pairwise(),
      filter(
        positions =>
          this.isUserScrollingDown(positions) &&
          this.isScrollExpectedPercent(positions[1])
      )
    );
  }

  private requestCallbackOnScroll() {
    this.requestOnScroll$ = this.userScrolledDown$;
    if (this.immediateCallback) {
      this.requestOnScroll$ = this.requestOnScroll$.pipe(
        startWith([DEFAULT_SCROLL_POSITION, DEFAULT_SCROLL_POSITION])
      );
    }
    this.requestOnScroll$
      .pipe(exhaustMap(() => this.scrollCallback()))
      .subscribe(null, err => console.log(err));
  }

  private isUserScrollingDown = (
    positions: [ScrollPosition, ScrollPosition]
  ) => {
    return positions[0].sT < positions[1].sT;
  }

  private isScrollExpectedPercent = (position: ScrollPosition) => {
    return (position.sT + position.cH) / position.sH > this.scrollPercent / 100;
  }
}
