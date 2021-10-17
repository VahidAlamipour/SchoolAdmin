import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material';

import { BigSearchComponent } from './component/big-search.component';
import { BigSearchService } from './big-search.service';
import { HighlightSearch } from 'src/app/pipes/highlight-search.pipe';

@NgModule({
  imports: [CommonModule, FormsModule, MatButtonModule],
  declarations: [BigSearchComponent, HighlightSearch],
  providers: [BigSearchService],
  exports: [BigSearchComponent]
})
export class BigSearchModule {}
