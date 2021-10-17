import { MatSelectModule } from '@angular/material/select';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ModalsModule } from 'src/app/components/modals/modals.module';
import { SearchInputModule } from 'src/app/components/search-input/search-input.module';
import { CustomMatPaginatorIntl } from 'src/app/providers/CustomMatPaginatorIntl';
import { FacilitiesComponent } from './component/facilities.component';
import {
  MatTableModule,
  MatPaginatorModule,
  MatPaginatorIntl,
  MatFormFieldModule,
  MatInputModule,
  MatSortModule,
  MatButtonModule,
  MatDialogModule,
  MatProgressSpinnerModule
} from '@angular/material';

@NgModule({
  imports: [
    CommonModule,
    BrowserAnimationsModule,
    MatTableModule,
    MatSelectModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSortModule,
    MatButtonModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    ModalsModule,
    SearchInputModule
  ],
  declarations: [FacilitiesComponent],
  providers: [{ provide: MatPaginatorIntl, useClass: CustomMatPaginatorIntl }]
})
export class FacilitiesModule {}
