import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PopupComponent } from './component/popup.component';

@NgModule({
  imports: [CommonModule],
  declarations: [PopupComponent],
  exports: [PopupComponent]
})
export class PopupModule {}
