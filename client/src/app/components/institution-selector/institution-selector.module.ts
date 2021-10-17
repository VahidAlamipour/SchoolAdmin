import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material';
import { CookieService } from 'ngx-cookie-service';

import { InstitutionSelectorComponent } from './component/institution-selector.component';

@NgModule({
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule],
  declarations: [InstitutionSelectorComponent],
  providers: [CookieService],
  exports: [InstitutionSelectorComponent]
})
export class InstitutionSelectorModule {}
