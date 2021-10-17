import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule,
  MatListModule,
  MatDialogModule,
  MatTabsModule,
  MatProgressSpinnerModule
} from '@angular/material';

import { AddDataModalService } from './services/add-data-modal.service';
import { AutoInputModule } from '../components/auto-input/auto-input.module';
import { SearchInputModule } from '../../search-input/search-input.module';
import { AddDataModalComponent } from './components/modal/add-data-modal.component';
import { AddDataListComponent } from './components/list/add-data-list.component';
import { InfiniteScrollDirective } from 'src/app/directives/infinite-scroll.directive';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatListModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    AutoInputModule,
    SearchInputModule
  ],
  declarations: [
    AddDataModalComponent,
    AddDataListComponent,
    InfiniteScrollDirective
  ],
  entryComponents: [AddDataModalComponent],
  providers: [AddDataModalService],
  exports: [AddDataModalComponent]
})
export class AddDataModalModule {}
