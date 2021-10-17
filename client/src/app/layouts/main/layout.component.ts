import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

import { AuthService } from 'src/app/auth/auth.service';
import { LayoutService } from 'src/app/services/layout.service';
import { routeAnimation } from 'src/app/router/router.animation';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  animations: [routeAnimation]
})
export class MainLayoutComponent implements OnInit {
  @ViewChild('wrap', { static: false })
  private wrap: ElementRef;

  private topScroll: number;

  constructor(public layout: LayoutService, public authService: AuthService) {}

  ngOnInit() {
    this.layout.wrapObservable.subscribe(event => {
      this.wrap.nativeElement.classList = event;
    });
  }

  onScroll(event: any) {
    this.topScroll = event.target.scrollTop;
    this.layout.contentScroll(this.topScroll);
  }
}
