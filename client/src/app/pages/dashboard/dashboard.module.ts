import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule, MatButtonModule } from '@angular/material';

import { DashboardComponent } from './component/dashboard.component';
import { BigSearchModule } from 'src/app/components/big-search/big-search.module';

@NgModule({
  imports: [CommonModule, MatTabsModule, MatButtonModule, BigSearchModule],
  declarations: [DashboardComponent]
})
export class DashboardModule {}
