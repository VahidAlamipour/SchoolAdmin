import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  MatTableModule,
  MatPaginatorModule,
  MatSortModule,
  MatButtonModule,
  MatDialogModule,
  MatProgressSpinnerModule,
  MatSelectModule
} from '@angular/material';

import { InstitutionsService } from './services/institutions.service';
import { ModalsModule } from 'src/app/components/modals/modals.module';
import { PopupModule } from 'src/app/components/popup/popup.module';
import { SearchInputModule } from 'src/app/components/search-input/search-input.module';
import { InstitutionsComponent } from './component/institutions.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatSelectModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    ModalsModule,
    PopupModule,
    SearchInputModule
  ],
  declarations: [InstitutionsComponent],
  providers: [InstitutionsService]
})
export class SBModule {}
