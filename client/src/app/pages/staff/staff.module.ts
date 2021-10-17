import { MatSelectModule } from '@angular/material/select';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CustomMatPaginatorIntl } from 'src/app/providers/CustomMatPaginatorIntl';
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
  MatMenuModule,
  MatTooltipModule
} from '@angular/material';

import { ModalsModule } from 'src/app/components/modals/modals.module';
import { PopupModule } from 'src/app/components/popup/popup.module';
import { SearchInputModule } from 'src/app/components/search-input/search-input.module';
import { StaffComponent } from './component/staff.component';

@NgModule({
  imports: [
    CommonModule,
    BrowserAnimationsModule,
    MatTableModule,
    MatSelectModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatMenuModule,
    MatSortModule,
    MatButtonModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    ModalsModule,
    PopupModule,
    SearchInputModule
  ],
  declarations: [StaffComponent],
  providers: [{ provide: MatPaginatorIntl, useClass: CustomMatPaginatorIntl }]
})
export class StaffModule {}
