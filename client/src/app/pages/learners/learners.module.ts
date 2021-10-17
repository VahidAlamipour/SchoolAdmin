import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  MatTableModule,
  MatPaginatorModule,
  MatPaginatorIntl,
  MatFormFieldModule,
  MatInputModule,
  MatSortModule,
  MatButtonModule,
  MatDialogModule,
  MatProgressSpinnerModule,
  MatProgressBarModule,
  MatTabsModule,
  MatMenuModule,
  MatSelectModule,
  MatTooltipModule
} from '@angular/material';

import { SLCSelectorModule } from 'src/app/components/slc-selector/slc-selector.module';
import { ModalsModule } from 'src/app/components/modals/modals.module';
import { PopupModule } from 'src/app/components/popup/popup.module';
import { SearchInputModule } from 'src/app/components/search-input/search-input.module';
import { CustomMatPaginatorIntl } from 'src/app/providers/CustomMatPaginatorIntl';
import { LearnersPageComponent } from './components/page/learners-page.component';
import { LearnersSubclassesComponent } from './components/subclasses/learners-subclasses.component';
import { LearnersTableComponent } from './components/learners/learners-table.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    BrowserAnimationsModule,
    MatTableModule,
    MatSelectModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSortModule,
    MatButtonModule,
    MatDialogModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    ModalsModule,
    MatTabsModule,
    MatMenuModule,
    PopupModule,
    SearchInputModule,
    SLCSelectorModule
  ],
  declarations: [
    LearnersPageComponent,
    LearnersTableComponent,
    LearnersSubclassesComponent
  ],
  providers: [{ provide: MatPaginatorIntl, useClass: CustomMatPaginatorIntl }]
})
export class LearnersModule {}
