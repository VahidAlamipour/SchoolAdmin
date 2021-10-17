import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StartPageComponent } from './start-page/start-page.component';
import { NoAccessPageComponent } from './no-access/no-access.component';
import { StartSelectComponent } from './start-select/start-select.component';
import { InstitutionSelectorModule } from 'src/app/components/institution-selector/institution-selector.module';

@NgModule({
  imports: [CommonModule, InstitutionSelectorModule],
  declarations: [
    StartPageComponent,
    NoAccessPageComponent,
    StartSelectComponent
  ]
})
export class LoginModule {}
