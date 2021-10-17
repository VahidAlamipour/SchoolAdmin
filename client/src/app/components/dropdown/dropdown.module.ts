import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatButtonModule } from '@angular/material';

import { DropdownComponent } from './component/dropdown.component';

@NgModule({
  imports: [CommonModule, MatButtonModule],
  declarations: [DropdownComponent],
  exports: [DropdownComponent]
})
export class DropdownModule {}
