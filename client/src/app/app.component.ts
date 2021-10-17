import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

declare let gtag: Function;

@Component({
  selector: 'admin-app',
  template: `
    <router-outlet></router-outlet>
  `
})
export class AppComponent {
  constructor(
    public router: Router
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        gtag('config', 'UA-86881823-2', {
          page_path: event.urlAfterRedirects
        });
      }
    });
  }
}
