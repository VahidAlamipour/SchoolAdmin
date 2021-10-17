import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-start-page',
  templateUrl: './start-page.component.html'
})
export class StartPageComponent implements OnInit {
  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    // console.log('StartPageComponent');
  }

  public goToLogin(): void {
    this.authService.goToExternalLogin();
  }
}
