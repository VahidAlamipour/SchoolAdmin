import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MatButtonModule,
  MatProgressBarModule,
  MatProgressSpinnerModule
} from '@angular/material';

import { ImportProgressService } from './import-progress.service';
import { ImportProgressComponent } from './root/import-progress.component';
import { ImportItemComponent } from './components/import-item/import-item.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatProgressBarModule,
    MatProgressSpinnerModule
  ],
  declarations: [ImportProgressComponent, ImportItemComponent],
  providers: [ImportProgressService],
  exports: [ImportProgressComponent]
})
export class ImportProgressModule {}
