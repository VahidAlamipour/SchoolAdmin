import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-start-select',
  templateUrl: './start-select.component.html'
})
export class StartSelectComponent implements OnInit {
  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {}

  public changeStatus() {
    // need to go next
    this.router.navigate(['/dashboard']);
  }
}
