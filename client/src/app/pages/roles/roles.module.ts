import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule, MatProgressSpinnerModule } from '@angular/material';

import { RolesComponent } from './root/roles.component';
import { ChipsBlockModule } from 'src/app/components/modals/components/chips-block/chips-block.module';
import { RolesService } from './services/roles.service';
import { RolesPreloadService } from './services/roles-preload.service';
import { EducatorsBlockModule } from './components/educators-block/educators-block.module';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    ChipsBlockModule,
    EducatorsBlockModule
  ],
  declarations: [RolesComponent],
  providers: [RolesService, RolesPreloadService]
})
export class RolesModule {}
