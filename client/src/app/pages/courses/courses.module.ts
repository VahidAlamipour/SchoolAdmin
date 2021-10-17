import { MatSelectModule } from '@angular/material/select';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CustomMatPaginatorIntl } from 'src/app/providers/CustomMatPaginatorIntl';
import { ModalsModule } from 'src/app/components/modals/modals.module';
import { CoursesComponent } from './component/courses.component';
import { SearchInputModule } from 'src/app/components/search-input/search-input.module';

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
  MatMenuModule
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
    MatMenuModule,
    MatProgressSpinnerModule,
    ModalsModule,
    SearchInputModule
  ],
  declarations: [CoursesComponent],
  providers: [{ provide: MatPaginatorIntl, useClass: CustomMatPaginatorIntl }]
})
export class CoursesModule {}
