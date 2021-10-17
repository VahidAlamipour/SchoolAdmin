import { MatSelectModule } from '@angular/material/select';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PopupModule } from 'src/app/components/popup/popup.module';
import { ModalsModule } from 'src/app/components/modals/modals.module';
import { SearchInputModule } from 'src/app/components/search-input/search-input.module';
import { CustomMatPaginatorIntl } from 'src/app/providers/CustomMatPaginatorIntl';
import { EducatorsComponent } from './component/educators.component';
import { EDUCATORS_ROUTES } from './educators.route';
import {
  MatTableModule,
  MatPaginatorModule,
  MatPaginatorIntl,
  MatFormFieldModule,
  MatInputModule,
  MatSortModule,
  MatButtonModule,
  MatMenuModule,
  MatTooltipModule,
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
    MatMenuModule,
    MatTooltipModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    ModalsModule,
    PopupModule,
    SearchInputModule,
    EDUCATORS_ROUTES
  ],
  declarations: [EducatorsComponent],
  providers: [{ provide: MatPaginatorIntl, useClass: CustomMatPaginatorIntl }]
})
export class EducatorsModule {}
