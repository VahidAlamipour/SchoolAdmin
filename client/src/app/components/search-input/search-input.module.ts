import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material';

import { SearchInputComponent } from './component/search-input.component';

@NgModule({
  imports: [CommonModule, FormsModule, MatButtonModule],
  declarations: [SearchInputComponent],
  exports: [SearchInputComponent]
})
export class SearchInputModule {}
