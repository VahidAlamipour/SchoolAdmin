import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SLCSelectorComponent } from './component/slc-selector.component';
import { DropdownModule } from '../dropdown/dropdown.module';
import { MatButtonModule, MatProgressSpinnerModule } from '@angular/material';
import { SLCService } from './slc-selector.service';

@NgModule({
  imports: [
    CommonModule,
    DropdownModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  declarations: [SLCSelectorComponent],
  providers: [SLCService],
  exports: [SLCSelectorComponent]
})
export class SLCSelectorModule {}
