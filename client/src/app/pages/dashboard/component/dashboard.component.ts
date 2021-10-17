import { Component } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';

import { LayoutService } from 'src/app/services/layout.service';
import { AuthService } from 'src/app/auth/auth.service';
import { CreateLearnerModalComponent } from 'src/app/components/modals/create-learner-modal/create-learner-modal.component';
import { CreateParentModalComponent } from 'src/app/components/modals/create-parent-modal/create-parent-modal.component';
import { CreateEducatorModalComponent } from 'src/app/components/modals/create-educator-modal/create-educator-modal.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  public searchMode = 'all users';

  constructor(
    private dialog: MatDialog,
    public authService: AuthService,
    private layout: LayoutService
  ) {}

  // tab with search switched
  public tabsEvent(event: any): void {
    this.searchMode = event.tab.textLabel.toLowerCase();
  }

  // quick action buttons
  public quickAction(mode: string): void {
    const data = { saveButtonText: 'create' };
    let modal: MatDialogRef<any>;
    this.layout.blurWrapContainer();
    switch (mode) {
      case 'learner':
        modal = this.dialog.open(CreateLearnerModalComponent, {
          panelClass: 'modal',
          data: { ...data, title: 'Create learner' }
        });
        break;
      case 'parent':
        modal = this.dialog.open(CreateParentModalComponent, {
          panelClass: 'modal',
          data: { ...data, title: 'Create parent' }
        });
        break;
      case 'educator':
        modal = this.dialog.open(CreateEducatorModalComponent, {
          panelClass: 'modal',
          data: { ...data, title: 'Create educator' }
        });
        break;
      default:
        break;
    }
    modal
      .beforeClosed()
      .subscribe({ next: () => this.layout.unblurWrapContainer() });
  }
}
