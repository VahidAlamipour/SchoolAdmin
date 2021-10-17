import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LayoutService } from 'src/app/services/layout.service';
import { SocketService } from '../services/socket.service';
import { MainLayoutComponent } from './main/layout.component';
import { LoginLayoutComponent } from './login/login.component';
import { SidebarModule } from './../components/sidebar/sidebar.module';
import { NotificationsModule } from '../components/notifications/notifications.module';
import { ImportProgressModule } from '../components/import-progress/import-progress.module';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    SidebarModule,
    NotificationsModule,
    ImportProgressModule
  ],
  declarations: [MainLayoutComponent, LoginLayoutComponent],
  providers: [LayoutService, SocketService]
})
export class LayoutModule {}
