import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSelectModule, MatFormFieldModule } from '@angular/material';

import { SidebarComponent } from './component/sidebar.component';
import { InstitutionSelectorModule } from '../institution-selector/institution-selector.module';
import { PrivacyComponent } from '../privacy/privacy.component';
import { SidebarService } from './sidebar.service';
import { SdkService } from 'src/app/services/sdk.service';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    MatSelectModule,
    MatFormFieldModule,
    InstitutionSelectorModule
  ],
  providers:[SidebarService],
  declarations: [SidebarComponent, PrivacyComponent],
  exports: [SidebarComponent]
})
export class SidebarModule {}
