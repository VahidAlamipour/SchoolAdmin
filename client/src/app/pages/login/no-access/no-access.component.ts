import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-no-access',
  templateUrl: './no-access.component.html'
})
export class NoAccessPageComponent implements OnInit {
  public interfaces: string[];
  public email: string;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.interfaces = Object.keys(this.authService.localData.interfaces).sort();
    this.email = this.authService.localData.config.helpEmail;
  }

  public changeStatus(iface: string): void {
    window.location.href = this.authService.localData.interfaces[iface];
  }

  public logout() {
    this.authService.logout();
  }
}
